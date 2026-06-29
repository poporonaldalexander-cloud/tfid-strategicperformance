'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { DB, AppUser, AppRole, Indicator } from './types';
import { appRoleOf, scopeOf } from './bsc';

const EMPTY: DB = { strategy_map: [], outcomes: [], accountability: [], programs: [], app_users: [], indicators: [] };

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
      setDb({
        strategy_map: sm.data || [],
        outcomes: out.data || [],
        accountability: acc.data || [],
        programs: prog.data || [],
        app_users: usr.data || [],
        indicators: ind.data || [],
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

  const value: Store = {
    db, loading, error, session, ready, loggingIn, loginError,
    login, logout, setYear, refresh,
    saveIndicator, deleteIndicator, saveUser, deleteUser, addOutcome,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// convenience selectors
export function useYearInds(): Indicator[] {
  const { db, session } = useStore();
  return db.indicators.filter((i) => i.year === session.year && (!session.scope || i.acc_id === session.scope));
}


