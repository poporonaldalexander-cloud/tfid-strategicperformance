'use client';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { DB, AppUser, AppRole, Indicator } from './types';
import { appRoleOf, scopeOf } from './bsc';

const EMPTY: DB = { strategy_map: [], outcomes: [], accountability: [], programs: [], app_users: [], indicators: [] };
const SESS_KEY = 'tf_bsc_session_email';

type Session = { user: AppUser | null; role: AppRole; scope: string | null; year: number };

type Store = {
  db: DB;
  loading: boolean;
  error: string | null;
  session: Session;
  ready: boolean;
  login: (email: string) => void;
  logout: () => void;
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

  // initial load + resume session
  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sesi sengaja TIDAK dipulihkan otomatis dari localStorage,
  // agar aplikasi selalu dibuka dari halaman login setiap kali diakses.

  function applyUser(u: AppUser) {
    const years = db.indicators.map((i) => i.year);
    const year = years.length ? Math.max(...years) : new Date().getFullYear();
    setSession({ user: u, role: appRoleOf(u), scope: scopeOf(u), year });
    if (typeof window !== 'undefined') localStorage.setItem(SESS_KEY, u.email);
  }

  const login = (email: string) => {
    const u = db.app_users.find((x) => x.email === email && x.status === 'Active');
    if (u) applyUser(u);
  };
  const logout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(SESS_KEY);
    setSession({ user: null, role: 'viewer', scope: null, year: session.year });
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
    db, loading, error, session, ready,
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

