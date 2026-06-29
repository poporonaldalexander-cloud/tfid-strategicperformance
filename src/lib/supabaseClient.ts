'use client';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!url || !anon) {
  // Pesan ini muncul di console jika .env.local belum diisi.
  console.warn('[Supabase] NEXT_PUBLIC_SUPABASE_URL / ANON_KEY belum diatur di .env.local');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});
