'use client';
import { useMemo, useState } from 'react';
import { useStore, useYearInds } from '@/lib/store';
import {
  aggregate, weightedAggregate, indicatorContribution, levelWeightMapFor, rowOverall, effectiveWeight,
  ragOf, pcolor, CONTRIB_LEVELS, LEVEL_COLOR, levelOf, type ContribLevel, type LevelCell,
} from '@/lib/bsc';
import { Icon, IC, RagBadge, HBars } from '@/components/ui';
import { TocPathwayDiagram } from '@/components/toc-pathway';
import type { Indicator } from '@/lib/types';

type Detail =
  | {
      scope: 'cell'; level: string; label: string; sub: string; items: Indicator[];
      weights: Record<string, number>; isWeighted: boolean;
    }
  | {
      scope: 'row'; level: string; label: string; sub: string; items: Indicator[];
      cells: LevelCell[]; rowWeights: Record<string, number>; rowIsWeighted: boolean;
    }
  | null;

const ragCol = (avg: number | null) =>
  avg == null ? 'var(--qual)' : avg >= 0.9 ? 'var(--on)' : avg >= 0.6 ? 'var(--risk)' : 'var(--off)';

const pct = (v: number | null | undefined) => (v == null ? '—' : Math.round(v * 100) + '%');

type WeightEdit = { outcomeId: string; label: string; values: Record<string, string> } | null;

export default function ContributionPage() {
  const { db, session, saveIndicator, saveLevelWeight } = useStore();
  const list = useYearInds();
  const [detail, setDetail] = useState<Detail>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pathwayOutcome, setPathwayOutcome] = useState('');
  const [weightEdit, setWeightEdit] = useState<WeightEdit>(null);
  const [savingWeights, setSavingWeights] = useState(false);

  const isAdmin = session.role === 'admin';

  // Kartu ringkasan & radar per-perspektif: gambaran portofolio secara keseluruhan, memakai rata-rata biasa
  // (lintas banyak Outcome sekaligus, sehingga bobot per-Outcome tidak relevan pada level ini).
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
        const cells: LevelCell[] = CONTRIB_LEVELS.map((lvl) => {
          const sub = oi.filter((i) => levelOf(i) === lvl);
          return { level: lvl, list: sub, agg: weightedAggregate(sub) };
        });
        const lwMap = levelWeightMapFor(o.id, db.level_weights);
        const overall = rowOverall(cells, lwMap);
        return { key: o.id, outcomeId: o.id, sm, label: (o.code || o.id) + ' · ' + o.name, count: oi.length, cells, overall, lwMap };
      }).filter(Boolean) as {
        key: string; outcomeId: string; sm: typeof sms[number]; label: string; count: number;
        cells: LevelCell[]; overall: ReturnType<typeof rowOverall>; lwMap: Partial<Record<ContribLevel, number>>;
      }[];
    });
    const noOutcome = list.filter((i) => !i.outcome_id);
    if (noOutcome.length) {
      const cells: LevelCell[] = CONTRIB_LEVELS.map((lvl) => {
        const sub = noOutcome.filter((i) => levelOf(i) === lvl);
        return { level: lvl, list: sub, agg: weightedAggregate(sub) };
      });
      const overall = rowOverall(cells, {});
      out.push({ key: '__none__', outcomeId: '', sm: null as any, label: 'Belum terhubung ke Outcome tertentu', count: noOutcome.length, cells, overall, lwMap: {} });
    }
    return out;
  }, [db.strategy_map, db.outcomes, db.level_weights, list]);

  const outcomeOptions = rows.filter((r) => r.key !== '__none__' && r.cells.some((c) => c.agg.total > 0));
  const selectedPathwayKey = pathwayOutcome || outcomeOptions[0]?.key || '';
  const pathwayRow = rows.find((r) => r.key === selectedPathwayKey);

  const canEditRow = (i: Indicator) => session.role === 'admin' || (session.role === 'pic' && (!session.scope || i.acc_id === session.scope));

  const quickSetLevel = async (i: Indicator, lvl: string) => {
    setSavingId(i.id);
    try { await saveIndicator({ ...i, indicator_type: lvl || null }); } catch (e: any) { alert('Gagal menyimpan: ' + e.message); } finally { setSavingId(null); }
  };

  const openCellDetail = (level: string, label: string, cell: LevelCell) => {
    if (!cell.list.length) return;
    setDetail({ scope: 'cell', level, label, sub: level, items: cell.list, weights: cell.agg.weights, isWeighted: cell.agg.isWeighted });
  };

  const openRowDetail = (label: string, row: (typeof rows)[number]) => {
    const items = row.cells.flatMap((c) => c.list);
    if (!items.length) return;
    setDetail({ scope: 'row', level: '', label, sub: 'Semua level (kontribusi ke keseluruhan Outcome)', items, cells: row.cells, rowWeights: row.overall.weights, rowIsWeighted: row.overall.isWeighted });
  };

  const openWeightEditor = (row: (typeof rows)[number]) => {
    if (!row.outcomeId) return;
    const values: Record<string, string> = {};
    CONTRIB_LEVELS.forEach((lvl) => { values[lvl] = row.lwMap[lvl] != null ? String(row.lwMap[lvl]) : ''; });
    setWeightEdit({ outcomeId: row.outcomeId, label: row.label, values });
  };

  const saveWeightEditor = async () => {
    if (!weightEdit) return;
    setSavingWeights(true);
    try {
      for (const lvl of CONTRIB_LEVELS) {
        const raw = weightEdit.values[lvl];
        const v = raw?.trim() ? parseFloat(raw) : null;
        await saveLevelWeight(weightEdit.outcomeId, lvl, v != null && !isNaN(v) ? v : null);
      }
      setWeightEdit(null);
    } catch (e: any) {
      alert('Gagal menyimpan bobot level: ' + e.message);
    } finally {
      setSavingWeights(false);
    }
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

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Weighted Theory of Change Pathway Diagram</h3>
          <span className="hint">alur kausalitas: indikator → level rantai hasil → skor keseluruhan Outcome, dengan bobot kontribusi pada tiap panah</span>
        </div>
        <div className="card-pad">
          <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
            Tiap indikator mengalir ke level rantai hasilnya (Output / Intermediate Outcome / Outcome / Impact) dengan bobot indikator di dalam level tsb;
            tiap level lalu mengalir ke skor keseluruhan Outcome dengan bobot level (diatur lewat tombol &quot;Atur&quot; pada tabel di bawah).
            Angka di tiap kotak adalah capaian (%); angka di tiap panah adalah bobot kontribusi (%).
          </p>
          <div className="fg" style={{ maxWidth: 360, marginBottom: 16 }}>
            <label>Pilih Outcome</label>
            <select value={selectedPathwayKey} onChange={(e) => setPathwayOutcome(e.target.value)}>
              {outcomeOptions.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          {pathwayRow ? (
            <TocPathwayDiagram cells={pathwayRow.cells} rowWeights={pathwayRow.overall.weights} overallAvg={pathwayRow.overall.avg} />
          ) : (
            <div className="empty muted">Belum ada Outcome dengan data indikator untuk tahun ini.</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Peta Kontribusi Berbobot: Indikator → Outcome → Level Capaian</h3>
          <span className="hint">klik sel untuk melihat rincian bobot &amp; kontribusi · kolom Keseluruhan dihitung berjenjang (Output → Intermediate Outcome → Outcome → Impact)</span>
        </div>
        <div className="tbl-scroll">
          {rows.length ? (
            <table>
              <thead>
                <tr>
                  <th>Outcome Strategis</th>
                  {CONTRIB_LEVELS.map((lvl) => <th key={lvl} style={{ textAlign: 'center', color: LEVEL_COLOR[lvl] }}>{lvl}</th>)}
                  <th style={{ textAlign: 'center' }}>Keseluruhan</th>
                  {isAdmin && <th style={{ textAlign: 'center' }}>Bobot</th>}
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
                        onClick={() => openCellDetail(c.level, r.label, c)}>
                        {c.agg.total ? (
                          <>
                            <div style={{ fontWeight: 700, color: ragCol(c.agg.avg) }}>{c.agg.avg != null ? Math.round(c.agg.avg * 100) + '%' : '—'}</div>
                            <div className="muted" style={{ fontSize: 10.5 }}>{c.agg.total} indikator{c.agg.isWeighted ? ' · berbobot' : ''}</div>
                          </>
                        ) : <span className="muted">—</span>}
                      </td>
                    ))}
                    <td style={{ textAlign: 'center', cursor: 'pointer' }}
                      onClick={() => openRowDetail(r.label, r)}>
                      <div style={{ fontWeight: 700, color: ragCol(r.overall.avg) }}>{r.overall.avg != null ? Math.round(r.overall.avg * 100) + '%' : '—'}</div>
                      <div className="muted" style={{ fontSize: 10.5 }}>{r.overall.isWeighted ? 'berjenjang berbobot' : 'rata-rata setara'}</div>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'center' }}>
                        {r.outcomeId ? (
                          <button className="btn ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => openWeightEditor(r)}>
                            <Icon path={IC.check} /> Atur
                          </button>
                        ) : <span className="muted">—</span>}
                      </td>
                    )}
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
          <div className="modal" style={{ width: 780 }}>
            <div className="modal-head">
              <span className="code" style={{ background: LEVEL_COLOR[detail.level] || 'var(--green)' }}>{detail.sub}</span>
              <h3>{detail.label}</h3>
              <button className="x" onClick={() => setDetail(null)}><Icon path={IC.x} /></button>
            </div>
            <div className="modal-body">
              {detail.scope === 'cell' && !detail.isWeighted && (
                <p className="muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
                  Belum ada bobot yang diisi untuk indikator pada level ini — kontribusi dihitung dengan bobot setara (sama dengan rata-rata biasa).
                  Isi kolom &quot;Bobot dalam Level (%)&quot; pada masing-masing indikator di menu Indikator KPI untuk mengaktifkan pembobotan.
                </p>
              )}
              {detail.scope === 'row' && (
                <p className="muted" style={{ fontSize: 11.5, marginBottom: 10 }}>
                  Kontribusi ke keseluruhan Outcome = Capaian indikator × Bobot Efektif (bobot indikator dalam levelnya × bobot level tsb terhadap Outcome ini).
                  {!detail.rowIsWeighted && ' Bobot antar-level belum diatur — dianggap setara.'}
                </p>
              )}
              <div className="tbl-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Kode</th><th>Indikator</th><th>Program</th>
                      {detail.scope === 'row' && <th>Level</th>}
                      <th className="num">Capaian</th>
                      {(detail.scope === 'cell' || detail.scope === 'row') && <th className="num">{detail.scope === 'row' ? 'Bobot Efektif' : 'Bobot'}</th>}
                      {(detail.scope === 'cell' || detail.scope === 'row') && <th className="num">Kontribusi</th>}
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((i) => {
                      const r = ragOf(i);
                      let weightCell: number | null = null;
                      let contribCell: number | null = null;
                      if (detail.scope === 'cell') {
                        const c = indicatorContribution(i, detail.weights);
                        weightCell = c.weight; contribCell = c.contribution;
                      } else if (detail.scope === 'row') {
                        const lvl = levelOf(i);
                        const cell = lvl ? detail.cells.find((c) => c.level === lvl) : undefined;
                        const wInLevel = cell ? (cell.agg.weights[i.id] || 0) : 0;
                        const wLevel = lvl ? (detail.rowWeights[lvl] || 0) : 0;
                        weightCell = effectiveWeight(wInLevel, wLevel);
                        contribCell = r.ratio != null ? Math.min(r.ratio, 2) * weightCell : null;
                      }
                      return (
                        <tr key={i.id}>
                          <td><span className="code">{i.code}</span></td>
                          <td><span className="iname">{i.name}</span>{detail.scope === 'row' && <span className="imeta">{levelOf(i) || '—'}</span>}</td>
                          <td>{i.program_name || '—'}</td>
                          {detail.scope === 'row' && <td>{levelOf(i) || '—'}</td>}
                          <td className="num">{r.ratio != null ? Math.round(r.ratio * 100) + '%' : '—'}</td>
                          {(detail.scope === 'cell' || detail.scope === 'row') && <td className="num">{weightCell != null ? pct(weightCell) : '—'}</td>}
                          {(detail.scope === 'cell' || detail.scope === 'row') && <td className="num">{contribCell != null ? pct(contribCell) : '—'}</td>}
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

      {weightEdit && (
        <div className="modal-bg show" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('modal-bg')) setWeightEdit(null); }}>
          <div className="modal" style={{ width: 460 }}>
            <div className="modal-head">
              <h3>Atur Bobot Level</h3>
              <button className="x" onClick={() => setWeightEdit(null)}><Icon path={IC.x} /></button>
            </div>
            <div className="modal-body">
              <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>{weightEdit.label}</p>
              <p className="muted" style={{ fontSize: 11.5, marginBottom: 14 }}>
                Bobot (%) tiap level rantai hasil terhadap skor keseluruhan Outcome ini. Kosongkan semua untuk bobot setara.
                Angka tidak wajib berjumlah 100% — akan dinormalisasi otomatis di antara level yang memiliki data indikator.
              </p>
              <div className="form-grid">
                {CONTRIB_LEVELS.map((lvl) => (
                  <div className="fg" key={lvl}>
                    <label style={{ color: LEVEL_COLOR[lvl] }}>{lvl} (%)</label>
                    <input type="number" step="any" min={0} max={100} placeholder="setara"
                      value={weightEdit.values[lvl]}
                      onChange={(e) => setWeightEdit({ ...weightEdit, values: { ...weightEdit.values, [lvl]: e.target.value } })} />
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn" onClick={() => setWeightEdit(null)}>Batal</button>
              <button className="btn solid" disabled={savingWeights} onClick={saveWeightEditor}><Icon path={IC.check} />{savingWeights ? 'Menyimpan…' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}

      <p className="muted" style={{ fontSize: 11, marginTop: 14, maxWidth: 820 }}>
        Catatan metodologi: setiap indikator dipetakan ke satu Outcome strategis (kolom Outcome pada menu Indikator KPI) dan satu level rantai hasil
        (Output, Intermediate Outcome, Outcome, atau Impact). Kontribusi = Capaian × Bobot. Bobot indikator (diisi di menu Indikator KPI) dinormalisasi
        di antara indikator dengan level &amp; Outcome yang sama; jika kosong, seluruh indikator pada sel tsb dianggap berbobot setara (rata-rata biasa).
        Skor "Keseluruhan" per Outcome dihitung berjenjang: Σ(Capaian level × Bobot level), dengan Bobot level (diatur lewat tombol "Atur", khusus Administrator)
        dinormalisasi di antara level yang memiliki data; jika kosong, seluruh level dianggap berbobot setara. Indikator kualitatif dihitung jumlahnya tetapi
        tidak memengaruhi capaian rata-rata/berbobot.
      </p>
    </>
  );
}
