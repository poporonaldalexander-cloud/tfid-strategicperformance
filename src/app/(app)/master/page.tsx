'use client';
import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';

export default function MasterPage() {
  const { db, session } = useStore();
  const [tab, setTab] = useState<'sm' | 'out' | 'acc' | 'prog'>('sm');
  const sc = session.scope;
  const isAdmin = session.role === 'admin';

  const scopedOutIds = useMemo(
    () => (sc ? new Set(db.indicators.filter((i) => i.acc_id === sc).map((i) => i.outcome_id)) : null),
    [sc, db.indicators]
  );
  const smName = (id: string | null) => db.strategy_map.find((s) => s.id === id)?.name || id;
  const accShort = (id: string | null) => db.accountability.find((a) => a.id === id)?.short || id;

  let head: string[] = [];
  let rows: any[][] = [];
  if (tab === 'sm') { head = ['ID', 'Nama', 'Urutan', 'Status']; rows = db.strategy_map.map((s) => [s.id, s.name, s.order, s.status]); }
  if (tab === 'out') { head = ['ID', 'Kode', 'Perspektif', 'Nama', 'Status']; rows = db.outcomes.filter((o) => !sc || scopedOutIds!.has(o.id)).map((o) => [o.id, o.code || '—', smName(o.sm_id), o.name, o.status]); }
  if (tab === 'acc') { head = ['ID', 'Singkatan', 'Nama', 'Penanggung Jawab', 'Status']; rows = db.accountability.filter((a) => !sc || a.id === sc).map((a) => [a.id, a.short, a.name, a.lead_person || '—', a.status]); }
  if (tab === 'prog') { head = ['ID', 'Nama', 'Portfolio', 'Unit', 'Periode', 'Status']; rows = db.programs.filter((p) => !sc || p.acc_id === sc).map((p) => [p.id, p.name, p.portfolio || '—', accShort(p.acc_id), `${p.start_year}–${p.end_year}`, p.status]); }

  const tabs: [typeof tab, string][] = [['sm', 'Perspektif'], ['out', 'Outcome'], ['acc', 'Akuntabilitas'], ['prog', 'Program']];

  return (
    <>
      <div className="tabs">
        {tabs.map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      <div className="tbl-wrap"><div className="tbl-scroll">
        {rows.length ? (
          <table>
            <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, ix) => (
                <tr key={ix} style={{ cursor: 'default' }}>
                  {r.map((cell, ci) => (
                    <td key={ci}>{ci === head.length - 1
                      ? (cell === 'Active' ? <span className="badge b-on"><span className="dot" />Aktif</span> : <span className="pill">{cell}</span>)
                      : String(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="empty muted">Tidak ada data.</div>}
      </div></div>
      <p className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>
        {sc ? `Menampilkan struktur untuk unit ${accShort(sc)}. ` : ''}
        {!isAdmin ? 'Data master hanya dapat diubah oleh Administrator.' : 'Struktur Balanced Scorecard mengikuti template Tanoto Foundation.'}
      </p>
    </>
  );
}
