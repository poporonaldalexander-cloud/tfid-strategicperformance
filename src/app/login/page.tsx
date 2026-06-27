'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { appRoleOf, scopeOf } from '@/lib/bsc';
import { LOGO } from '@/lib/logo';

export default function LoginPage() {
  const { db, login, session, ready, loading, error } = useStore();
  const router = useRouter();
  const active = useMemo(() => db.app_users.filter((u) => u.status === 'Active'), [db.app_users]);
  const [email, setEmail] = useState('');

  useEffect(() => { if (session.user) router.replace('/dashboard'); }, [session.user, router]);
  useEffect(() => { if (!email && active.length) setEmail(active[0].email); }, [active, email]);

  const u = active.find((x) => x.email === email);
  const r = u ? appRoleOf(u) : 'viewer';
  const sc = u ? scopeOf(u) : null;
  const ac = u ? db.accountability.find((a) => a.id === u.acc_id) : null;
  const roleLbl = r === 'admin' ? 'Administrator' : r === 'pic' ? 'Program PIC' : 'Viewer';
  const unitTxt = sc ? (ac ? ac.short + ' — ' + ac.name : u?.acc_id) : 'Semua unit';
  const accessTxt = r === 'admin' ? 'Semua unit · dapat mengelola pengguna'
    : !sc ? (r === 'pic' ? 'Melihat & mengubah data semua unit' : 'Melihat data semua unit')
    : (r === 'pic' ? 'Hanya mengubah & melihat data unit ini' : 'Hanya melihat data unit ini');

  return (
    <div id="login">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark"><img src={LOGO} alt="Tanoto Foundation" /></div>
          <div><div className="sub">Tanoto Foundation</div><h1>Strategic Performance</h1></div>
        </div>
        <h2>Masuk ke dasbor</h2>
        <p className="lead">Sistem manajemen kinerja strategis berbasis Balanced Scorecard.</p>

        {error && <div className="login-access" style={{ borderColor: 'var(--off)', color: 'var(--off)' }}>{error}</div>}

        <div className="field">
          <label>Masuk sebagai</label>
          <select value={email} onChange={(e) => setEmail(e.target.value)} disabled={!active.length}>
            {!active.length && <option>{loading ? 'Memuat pengguna…' : 'Tidak ada pengguna'}</option>}
            {active.map((x) => {
              const rr = appRoleOf(x);
              const tag = rr === 'admin' ? 'Administrator' : x.role || 'Pengguna';
              const accShort = db.accountability.find((a) => a.id === x.acc_id)?.short || x.acc_id;
              return <option key={x.email} value={x.email}>{x.name} — {tag}{rr === 'admin' ? '' : ' · ' + accShort}</option>;
            })}
          </select>
        </div>

        {u && (
          <div className="login-access">
            <div className="la-row"><b>Peran</b><span>{roleLbl}</span></div>
            <div className="la-row"><b>Unit</b><span>{unitTxt}</span></div>
            <div className="la-row"><b>Akses data</b><span>{accessTxt}</span></div>
          </div>
        )}

        <button className="btn-primary" disabled={!u} onClick={() => { login(email); }}>Masuk</button>
        <p className="login-hint">Terhubung ke Supabase. Pastikan <code>.env.local</code> sudah diisi dan skema database sudah dibuat.</p>
      </div>
    </div>
  );
}
