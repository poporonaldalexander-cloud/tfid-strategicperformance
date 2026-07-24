'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function Home() {
  const { session, ready } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    router.replace(session.user ? '/dashboard' : '/login');
  }, [ready, session.user, router]);
  return <div style={{ padding: 40, color: 'var(--muted)' }}>Memuat…</div>;
}
