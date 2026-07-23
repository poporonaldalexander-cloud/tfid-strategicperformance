'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { DB, AppUser, AppRole, Indicator, LevelWeight } from './types';
import { appRoleOf, scopeOf } from './bsc';

const EMPTY: DB = { strategy_map: [], outcomes: [], accountability: [], programs: [], app_users: [], indicators: [], level_weights: [] };

type Session = { user: AppUser | null; role: AppRole; scope: string | null; year: number };

type Store = {
  db: DB;
  loading: boolean;
  error: string | null;
  session: Session;
  ready: boolean;
  loggingIn: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setYear: (y: number) => void;
  refresh: () => Promise<void>;
  // mutations
  saveIndicator: (i: Indicator) => Promise<void>;
  deleteIndicator: (id: string) => Promise<void>;
  saveUser: (u: AppUser, origEmail?: string | null) => Promise<void>;
  deleteUser: (email: string) => Promise<void>;
  addOutcome: (o: { id: string; sm_id: string; code: string; name: string }) => Promise<void>;
  saveLevelWeight: (outcomeId: string, level: string, weight: number | null) => Promise<void>;
};

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used within StoreProvider');
  return s;
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session>({ user: null, role: 'viewer', scope: null, year: 2026 });
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sm, out, acc, prog, usr, ind] = await Promise.all([
        supabase.from('strategy_map').select('*').order('order'),
        supabase.from('outcomes').select('*'),
        supabase.from('accountability').select('*'),
        supabase.from('programs').select('*'),
        supabase.from('app_users').select('*'),
        supabase.from('indicators').select('*'),
      ]);
      const firstErr = [sm, out, acc, prog, usr, ind].find((r) => r.error)?.error;
      if (firstErr) throw firstErr;
      // level_weights ditangani terpisah: jika migrasi supabase/migration_contribution_weights.sql
      // belum dijalankan di project ini, tabel belum ada — jangan gagalkan seluruh pemuatan data karenanya.
      let lwData: DB['level_weights'] = [];
      try {
        const lw = await supabase.from('level_weights').select('*');
        if (!lw.error) lwData = lw.data || [];
      } catch { /* tabel belum ada — abaikan, bobot level akan dianggap setara */ }
      setDb({
        strategy_map: sm.data || [],
        outcomes: out.data || [],
        accountability: acc.data || [],
        programs: prog.data || [],
        app_users: usr.data || [],
        indicators: ind.data || [],
        level_weights: lwData,
      });
    } catch (e: any) {
      setError(e.message || 'Gagal memuat data dari Supabase. Periksa .env.local dan skema database.');
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load: fetch data, then resume Supabase Auth session if one exists
  useEffect(() => {
    (async () => {
      await refresh();
      try {
        const { data } = await supabase.auth.getSession();
        const email = data.session?.user?.email;
        if (email) {
          const { data: row } = await supabase.from('app_users').select('*').eq('email', email).maybeSingle();
          if (row && row.status === 'Active') applyUser(row as AppUser);
          else await supabase.auth.signOut();
        }
      } catch { /* ignore */ }
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyUser(u: AppUser) {
    const years = db.indicators.map((i) => i.year);
    const year = years.length ? Math.max(...years) : new Date().getFullYear();
    setSession({ user: u, role: appRoleOf(u), scope: scopeOf(u), year });
  }

  // Login lewat Supabase Auth (email + password). Peran/akses diambil dari tabel app_users.
  const login = async (email: string, password: string) => {
    setLoggingIn(true);
    setLoginError(null);
    const em = email.trim().toLowerCase();
    try {
      const { error: authErr } = await supabase.auth.signInWithPassword({ email: em, password });
      if (authErr) { setLoginError('Email atau kata sandi salah.'); return; }
      // cari profil pengguna di app_users (untuk menentukan peran & cakupan)
      const { data: row } = await supabase.from('app_users').select('*').eq('email', em).maybeSingle();
      const u = row as AppUser | null;
      if (!u || u.status !== 'Active') {
        await supabase.auth.signOut();
        setLoginError('Akun terverifikasi, tetapi email ini belum terdaftar sebagai pengguna aktif aplikasi. Hubungi administrator.');
        return;
      }
      applyUser(u);
    } catch (e: any) {
      setLoginError(e.message || 'Gagal masuk. Coba lagi.');
    } finally {
      setLoggingIn(false);
    }
  };
  const logout = async () => {
    setSession({ user: null, role: 'viewer', scope: null, year: session.year });
    setLoginError(null);
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
  };
  const setYear = (y: number) => setSession((s) => ({ ...s, year: y }));

  // ---- mutations ----
  const saveIndicator = async (i: Indicator) => {
    const { error } = await supabase.from('indicators').upsert({ ...i, updated_at: new Date().toISOString() });
    if (error) throw error;
    await refresh();
  };
  const deleteIndicator = async (id: string) => {
    const { error } = await supabase.from('indicators').delete().eq('id', id);
    if (error) throw error;
    await refresh();
  };
  const saveUser = async (u: AppUser, origEmail?: string | null) => {
    if (origEmail && origEmail !== u.email) await supabase.from('app_users').delete().eq('email', origEmail);
    const { error } = await supabase.from('app_users').upsert(u);
    if (error) throw error;
    await refresh();
  };
  const deleteUser = async (email: string) => {
    const { error } = await supabase.from('app_users').delete().eq('email', email);
    if (error) throw error;
    await refresh();
  };
  const addOutcome = async (o: { id: string; sm_id: string; code: string; name: string }) => {
    const { error } = await supabase.from('outcomes').insert({ ...o, status: 'Active' });
    if (error) throw error;
    await refresh();
  };
  // Bobot level rantai hasil (Output/Intermediate Outcome/Outcome/Impact) terhadap skor keseluruhan suatu Outcome strategis.
  // weight = null/0 menghapus baris bobot (kembali ke bobot setara).
  const saveLevelWeight = async (outcomeId: string, level: string, weight: number | null) => {
    const id = `${outcomeId}::${level}`;
    if (weight == null || weight <= 0) {
      const { error } = await supabase.from('level_weights').delete().eq('id', id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('level_weights').upsert({ id, outcome_id: outcomeId, level, weight });
      if (error) throw error;
    }
    await refresh();
  };

  const value: Store = {
    db, loading, error, session, ready, loggingIn, loginError,
    login, logout, setYear, refresh,
    saveIndicator, deleteIndicator, saveUser, deleteUser, addOutcome, saveLevelWeight,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// convenience selectors
export function useYearInds(): Indicator[] {
  const { db, session } = useStore();
  return db.indicators.filter((i) => i.year === session.year && (!session.scope || i.acc_id === session.scope));
}


