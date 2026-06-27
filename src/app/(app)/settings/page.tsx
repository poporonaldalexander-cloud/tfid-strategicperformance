'use client';
import { useStore, useYearInds } from '@/lib/store';
import { ROLE_LABEL } from '@/lib/bsc';

export default function SettingsPage() {
  const { db, session, refresh } = useStore();
  const u = session.user!;
  const ac = db.accountability.find((a) => a.id === u.acc_id);
  const r = session.role;
  const yc = useYearInds().length;
  const initials = (u.name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const totalScoped = session.scope ? db.indicators.filter((i) => i.acc_id === session.scope).length : db.indicators.length;

  return (
    <>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Profil & Akses</h3></div>
          <div className="card-pad">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div className="user-chip" style={{ background: 'var(--green-tint2)' }}>
                <div className="av">{initials}</div>
                <div><div className="nm" style={{ color: 'var(--ink)' }}>{u.name}</div><div className="rl" style={{ color: 'var(--muted)' }}>{u.email}</div></div>
              </div>
            </div>
            <div className="form-grid">
              <div className="fg"><label>Peran</label><div className="ro">{ROLE_LABEL[r]}</div></div>
              <div className="fg"><label>Unit Akuntabilitas</label><div className="ro">{!session.scope ? 'Semua unit' : (ac ? ac.short + ' — ' + ac.name : u.acc_id)}</div></div>
              <div className="fg"><label>Cakupan Data</label><div className="ro">{session.scope ? 'Hanya indikator unit ' + (ac?.short || session.scope) : 'Seluruh unit organisasi'}</div></div>
              <div className="fg"><label>Hak Akses</label><div className="ro">{u.can_edit ? 'Edit' : '—'}{u.can_approve ? ' · Approve' : ''}{r === 'admin' ? ' · Kelola Pengguna' : ''}</div></div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Ringkasan Data</h3></div>
          <div className="card-pad">
            {[
              [`Indikator (tahun ${session.year}, cakupan Anda)`, yc],
              ['Total indikator (cakupan Anda)', totalScoped],
              ['Perspektif Balanced Scorecard', db.strategy_map.length],
              ['Unit akuntabilitas', db.accountability.length],
              ['Program', db.programs.length],
              ['Pengguna terdaftar', db.app_users.length],
            ].map(([n, v], ix) => (
              <div className="bar-row" key={ix}><div className="nm">{n as string}</div><div className="bar-track" /><div className="val">{v as number}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Sinkronisasi & Tentang</h3></div>
        <div className="card-pad" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <p className="muted" style={{ fontSize: 12.5, maxWidth: 460 }}>
            Data dibaca langsung dari Supabase. Klik segarkan untuk mengambil perubahan terbaru. Status kinerja
            dihitung otomatis dari rasio aktual ÷ target tahun (Tercapai ≥ 90%, Berisiko 60–89%, Belum Tercapai &lt; 60%).
          </p>
          <button className="btn gold" onClick={() => refresh()}>Segarkan Data</button>
        </div>
      </div>
    </>
  );
}
