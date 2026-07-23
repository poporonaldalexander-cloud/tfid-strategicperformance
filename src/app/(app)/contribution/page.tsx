'use client';
import { useMemo, useState } from 'react';
import { useStore, useYearInds } from '@/lib/store';
import { aggregate, ragOf, pcolor, CONTRIB_LEVELS, LEVEL_COLOR, levelOf } from '@/lib/bsc';
import { Icon, IC, RagBadge, HBars } from '@/components/ui';
import type { Indicator } from '@/lib/types';

type CellAgg = ReturnType<typeof aggregate>;
type Detail = { level: string; label: string; sub: string; items: Indicator[] } | null;

const ragCol = (avg: number | null) =>
  avg == null ? 'var(--qual)' : avg >= 0.9 ? 'var(--on)' : avg >= 0.6 ? 'var(--risk)' : 'var(--off)';

export default function ContributionPage() {
  const { db, session, saveIndicator } = useStore();
  const list = useYearInds();
  const [detail, setDetail] = useState<Detail>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const levelAgg = useMemo(
    () => CONTRIB_LEVELS.map((lvl) => ({ level: lvl, list: list.filter((i) => levelOf(i) === lvl), ...aggregate(list.filter((i) => levelOf(i) === lvl)) })),
    [list]
  );

  const unclassified = useMemo(() => list.filter((i) => levelOf(i) == null), [list]);

  const rows = useMemo(() => {
    const sms = db.strategy_map.slice().sort((a, b) => a.order - b.order);
    const out = sms.flatMap((sm) => {
      const outs = db.outcomes.filter((o) => o.sm_id === sm.id).sort((a, b) => (a.code || a.id).localeCompare(b.code || b.id));
      return outs.map((o) => {
        const oi = list.filter((i) => i.outcome_id === o.id);
        if (!oi.length) return null;
        const cells = CONTRIB_LEVELS.map((lvl) => {
          const sub = oi.filter((i) => levelOf(i) === lvl);
          return { level: lvl, list: sub, agg: aggregate(sub) };
        });
        return { key: o.id, sm, label: (o.code || o.id) + ' · ' + o.name, count: oi.length, cells, overall: aggregate(oi) };
      }).filter(Boolean) as { key: string; sm: typeof sms[number]; label: string; count: number; cells: { level: string; list: Indicator[]; agg: CellAgg }[]; overall: CellAgg }[];
    });
    const noOutcome = list.filter((i) => !i.outcome_id);
    if (noOutcome.length) {
      const cells = CONTRIB_LEVELS.map((lvl) => {
        const sub = noOutcome.filter((i) => levelOf(i) === lvl);
        return { level: lvl, list: sub, agg: aggregate(sub) };
      });
      out.push({ key: '__none__', sm: null as any, label: 'Belum terhubung ke Outcome tertentu', count: noOutcome.length, cells, overall: aggregate(noOutcome) });
    }
    return out;
  }, [db.strategy_map, db.outcomes, list]);

  const canEditRow = (i: Indicator) => session.role === 'admin' || (session.role === 'pic' && (!session.scope || i.acc_id === session.scope));

  const quickSetLevel = async (i: Indicator, lvl: string) => {
    setSavingId(i.id);
    try { await saveIndicator({ ...i, indicator_type: lvl || null }); } catch (e: any) { alert('Gagal menyimpan: ' + e.message); } finally { setSavingId(null); }
  };

  const openDetail = (level: string, label: string, sub: string, items: Indicator[]) => {
    if (!items.length) return;
    setDetail({ level, label, sub, items });
  };

  return (
    <>
      <p className="muted" style={{ fontSize: 12.5, maxWidth: 900, marginBottom: 18 }}>
        Peta ini menelusuri kontribusi setiap indikator terhadap rantai hasil strategis: <b>Output</b> → <b>Intermediate Outcome</b> → <b>Outcome</b> → <b>Impact</b>,
        dikelompokkan menurut Outcome strategis pada Peta Strategi. Level tiap indikator diambil dari kolom &quot;Level Capaian (Jenis Indikator)&quot; di menu Indikator KPI.
      </p>

      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        {levelAgg.map((l) => (
          <div className="stat" key={l.level}>
            <div className="accent" style={{ background: LEVEL_COLOR[l.level] }} />
            <div className="lbl">{l.level}</div>
            <div className="big" style={{ color: LEVEL_COLOR[l.level] }}>{l.avg != null ? Math.round(l.avg * 100) + '%' : '—'}</div>
            <div className="meta">{l.total} indikator · {l.on} tercapai</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><h3>Rata-rata Capaian per Level Hasil</h3><span className="hint">Tahun {session.year}</span></div>
        <div className="card-pad">
          <HBars items={levelAgg.map((l) => ({ name: l.level, val: l.avg, sub: l.total + ' indikator', color: LEVEL_COLOR[l.level] }))} />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Peta Kontribusi Indikator → Outcome → Level Capaian</h3>
          <span className="hint">klik sel untuk melihat daftar indikator</span>
        </div>
        <div className="tbl-scroll">
          {rows.length ? (
            <table>
              <thead>
                <tr>
                  <th>Outcome Strategis</th>
                  {CONTRIB_LEVELS.map((lvl) => <th key={lvl} style={{ textAlign: 'center', color: LEVEL_COLOR[lvl] }}>{lvl}</th>)}
                  <th style={{ textAlign: 'center' }}>Keseluruhan</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key}>
                    <td>
                      <span className="iname">{r.label}</span>
                      <span className="imeta">
                        {r.sm && <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: pcolor(r.sm.id), marginRight: 5 }} />}
                        {r.sm ? r.sm.name + ' · ' : ''}{r.count} indikator
                      </span>
                    </td>
                    {r.cells.map((c) => (
                      <td key={c.level} style={{ textAlign: 'center', cursor: c.agg.total ? 'pointer' : 'default' }}
                        onClick={() => openDetail(c.level, r.label, c.level, c.list)}>
                        {c.agg.total ? (
                          <>
                            <div style={{ fontWeight: 700, color: ragCol(c.agg.avg) }}>{c.agg.avg != null ? Math.round(c.agg.avg * 100) + '%' : '—'}</div>
                            <div className="muted" style={{ fontSize: 10.5 }}>{c.agg.total} indikator</div>
                          </>
                        ) : <span className="muted">—</span>}
                      </td>
                    ))}
                    <td style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => openDetail('', r.label, 'Semua level', [...r.cells.flatMap((c) => c.list)])}>
                      <div style={{ fontWeight: 700, color: ragCol(r.overall.avg) }}>{r.overall.avg != null ? Math.round(r.overall.avg * 100) + '%' : '—'}</div>
                      <div className="muted" style={{ fontSize: 10.5 }}>{r.overall.total} indikator</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="empty muted">Tidak ada indikator dengan Outcome untuk tahun ini.</div>}
        </div>
      </div>

      {unclassified.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h3>Indikator Belum Diklasifikasikan</h3>
            <span className="hint">{unclassified.length} indikator · lengkapi level agar tampil di peta kontribusi</span>
          </div>
          <div className="tbl-scroll">
            <table>
              <thead><tr><th>Kode</th><th>Indikator</th><th>Outcome Terkait</th><th>Unit</th><th>Level Capaian</th></tr></thead>
              <tbody>
                {unclassified.map((i) => {
                  const editableRow = canEditRow(i);
                  const o = db.outcomes.find((x) => x.id === i.outcome_id);
                  const acc = db.accountability.find((a) => a.id === i.acc_id);
                  return (
                    <tr key={i.id}>
                      <td><span className="code">{i.code}</span></td>
                      <td><span className="iname">{i.name}</span><span className="imeta">{i.program_name || ''}</span></td>
                      <td>{o ? (o.code || o.id) : <span className="muted">—</span>}</td>
                      <td>{acc?.short || '—'}</td>
                      <td>
                        <div className="fg" style={{ maxWidth: 190 }}>
                          <select disabled={!editableRow || savingId === i.id} value="" onChange={(e) => quickSetLevel(i, e.target.value)}>
                            <option value="">Pilih level…</option>
                            {CONTRIB_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detail && (
        <div className="modal-bg show" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('modal-bg')) setDetail(null); }}>
          <div className="modal">
            <div className="modal-head">
              <span className="code" style={{ background: LEVEL_COLOR[detail.level] || 'var(--green)' }}>{detail.sub}</span>
              <h3>{detail.label}</h3>
              <button className="x" onClick={() => setDetail(null)}><Icon path={IC.x} /></button>
            </div>
            <div className="modal-body">
              <div className="tbl-scroll">
                <table>
                  <thead><tr><th>Kode</th><th>Indikator</th><th>Program</th><th className="num">Capaian</th><th>Status</th></tr></thead>
                  <tbody>
                    {detail.items.map((i) => {
                      const r = ragOf(i);
                      return (
                        <tr key={i.id}>
                          <td><span className="code">{i.code}</span></td>
                          <td><span className="iname">{i.name}</span></td>
                          <td>{i.program_name || '—'}</td>
                          <td className="num">{r.ratio != null ? Math.round(r.ratio * 100) + '%' : '—'}</td>
                          <td><RagBadge i={i} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-foot"><button className="btn" onClick={() => setDetail(null)}>Tutup</button></div>
          </div>
        </div>
      )}

      <p className="muted" style={{ fontSize: 11, marginTop: 14, maxWidth: 760 }}>
        Catatan metodologi: setiap indikator dipetakan ke satu Outcome strategis (kolom Outcome pada menu Indikator KPI) dan satu level rantai hasil
        (Output, Intermediate Outcome, Outcome, atau Impact). Persentase pada tiap sel merupakan rata-rata capaian indikator kuantitatif di sel tersebut
        terhadap target tahun berjalan; indikator kualitatif dihitung jumlahnya tetapi tidak memengaruhi rata-rata.
      </p>
    </>
  );
}
