'use client';
import { useState, useMemo } from 'react';
import { useStore, useYearInds } from '@/lib/store';
import { ragOf, ragHex, fmtVal, pcolor, qBars, qSpark } from '@/lib/bsc';
import { Icon, IC, RagBadge, QChart, QSpark } from '@/components/ui';
import type { Indicator } from '@/lib/types';

type Mini = null | { kind: 'year' | 'outcome'; a: string; b: string };

export default function IndicatorsPage() {
  const { db, session, saveIndicator, deleteIndicator, addOutcome } = useStore();
  const yearInds = useYearInds();
  const [f, setF] = useState({ q: '', sm: '', acc: '', rag: '' });
  const [edit, setEdit] = useState<Indicator | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [tab, setTab] = useState<'info' | 'data' | 'narr'>('info');
  const [mini, setMini] = useState<Mini>(null);
  const [busy, setBusy] = useState(false);

  const accById = (id: string | null) => db.accountability.find((a) => a.id === id);
  const smById = (id: string | null) => db.strategy_map.find((s) => s.id === id);

  const canEdit = (i: Indicator) => session.role === 'admin' || (session.role === 'pic' && (!session.scope || i.acc_id === session.scope));
  const editable = edit ? (isNew ? session.role !== 'viewer' : canEdit(edit)) : false;

  const filtered = useMemo(() => {
    let list = yearInds;
    if (f.sm) list = list.filter((i) => i.sm_id === f.sm);
    if (f.acc) list = list.filter((i) => i.acc_id === f.acc);
    if (f.rag) list = list.filter((i) => ragOf(i).k === f.rag);
    if (f.q) { const q = f.q.toLowerCase(); list = list.filter((i) => `${i.name} ${i.code} ${i.program_name} ${i.pic}`.toLowerCase().includes(q)); }
    return list;
  }, [yearInds, f]);

  const yearList = (cur: number) => {
    const ys = db.indicators.map((i) => i.year);
    const minY = Math.min(...ys, session.year, cur || session.year);
    const maxY = Math.max(...ys, session.year, cur || session.year, new Date().getFullYear());
    const arr: number[] = [];
    for (let y = minY; y <= maxY + 6; y++) arr.push(y);
    if (cur && !arr.includes(cur)) arr.push(cur);
    return arr.sort((a, b) => a - b);
  };

  const blank = (): Indicator => ({
    id: '', year: session.year, sm_id: db.strategy_map[0]?.id || null, outcome_id: null,
    acc_id: (session.role !== 'admin' && session.scope) ? session.scope : (db.accountability[0]?.id || null),
    program_id: null, program_name: '', code: '', details: null, name: '', definition: '', unit: 'Number',
    disaggregation: null, frequency: 'Quarterly', data_source: null, mov: null, calc_method: null,
    indicator_type: null, direction: 'Naik', pic: session.user?.email || '',
    target_2030: null, target_2030_raw: null, target_year: null, target_year_raw: null,
    actual: null, actual_raw: null, ach_target_2030: null, ach_year: null,
    q1: null, q2: null, q3: null, q4: null, notes: '', key_initiatives: '', follow_up: '', status: 'Active',
  });

  const open = (i: Indicator | null) => { setIsNew(!i); setTab('info'); setEdit(i ? { ...i } : blank()); };
  const set = (k: keyof Indicator, v: any) => setEdit((e) => (e ? { ...e, [k]: v } : e));

  const save = async () => {
    if (!edit) return;
    let i = { ...edit };
    if (!i.name?.trim()) { setTab('info'); return alert('Nama indikator wajib diisi.'); }
    if (!i.code?.trim()) {
      const max = db.indicators.reduce((m, x) => { const n = parseInt((x.code || '').replace(/\D/g, '')) || 0; return n > m ? n : m; }, 0);
      i.code = 'IND' + (max + 1);
    }
    if (i.unit !== 'Text') { i.target_year_raw = null; i.target_2030_raw = null; i.actual_raw = null; }
    if (!i.id) i.id = `${i.code}-${i.year}`;
    setBusy(true);
    try { await saveIndicator(i); setEdit(null); } catch (e: any) { alert('Gagal menyimpan: ' + e.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!edit || !edit.id) return;
    if (!confirm('Hapus indikator ini? Tindakan tidak dapat dibatalkan.')) return;
    setBusy(true);
    try { await deleteIndicator(edit.id); setEdit(null); } catch (e: any) { alert('Gagal: ' + e.message); } finally { setBusy(false); }
  };

  // mini prompt submit
  const submitMini = async () => {
    if (!mini || !edit) return;
    if (mini.kind === 'year') {
      const y = parseInt(mini.a);
      if (!y || y < 2000 || y > 2100) return alert('Masukkan tahun yang valid (2000–2100).');
      set('year', y); setMini(null);
    } else {
      if (!mini.b.trim()) return alert('Nama outcome wajib diisi.');
      const max = db.outcomes.reduce((m, o) => { const n = parseInt((o.id || '').replace(/\D/g, '')) || 0; return n > m ? n : m; }, 0);
      const id = 'OUT' + String(max + 1).padStart(2, '0');
      setBusy(true);
      try {
        await addOutcome({ id, sm_id: edit.sm_id!, code: mini.a || '', name: mini.b });
        set('outcome_id', id); setMini(null);
      } catch (e: any) { alert('Gagal menambah outcome: ' + e.message); } finally { setBusy(false); }
    }
  };

  const r = edit ? ragOf(edit) : null;

  return (
    <>
      <div className="toolbar">
        <div className="search"><Icon path={IC.search} />
          <input placeholder="Cari indikator, kode, program…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        </div>
        <select value={f.sm} onChange={(e) => setF({ ...f, sm: e.target.value })}>
          <option value="">Semua Perspektif</option>
          {db.strategy_map.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {!session.scope && (
          <select value={f.acc} onChange={(e) => setF({ ...f, acc: e.target.value })}>
            <option value="">Semua Unit</option>
            {db.accountability.map((a) => <option key={a.id} value={a.id}>{a.short} — {a.name}</option>)}
          </select>
        )}
        <select value={f.rag} onChange={(e) => setF({ ...f, rag: e.target.value })}>
          <option value="">Semua Status</option><option value="on">Tercapai</option><option value="risk">Berisiko</option><option value="off">Belum Tercapai</option><option value="qual">Kualitatif</option>
        </select>
        {session.role !== 'viewer' && <button className="btn solid" onClick={() => open(null)}><Icon path={IC.plus} />Indikator Baru</button>}
      </div>

      <div className="tbl-wrap"><div className="tbl-scroll">
        {filtered.length ? (
          <table>
            <thead><tr><th>Kode</th><th>Indikator</th><th>Unit / Akuntabilitas</th><th className="num">Target {session.year}</th><th className="num">Aktual</th><th>Triwulan</th><th className="num">Target 2030</th><th className="num" style={{ minWidth: 130 }}>Capaian</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((i) => {
                const rr = ragOf(i); const acc = accById(i.acc_id);
                const v = rr.ratio != null ? Math.min(rr.ratio, 1.5) : 0;
                const col = rr.k === 'qual' ? 'var(--qual)' : ragHex(rr.k);
                return (
                  <tr key={i.id} onClick={() => open(i)}>
                    <td><span className="code">{i.code}</span><div className="imeta">{i.year}</div></td>
                    <td><span className="iname">{i.name}</span><span className="imeta">{i.program_name} · {i.pic || '—'}</span></td>
                    <td>{i.unit || '—'}<div className="imeta">{acc?.short}</div></td>
                    <td className="num">{fmtVal(i.target_year, i.target_year_raw, i.unit)}</td>
                    <td className="num">{fmtVal(i.actual, i.actual_raw, i.unit)}</td>
                    <td><QSpark data={qSpark(i)} /></td>
                    <td className="num">{fmtVal(i.target_2030, i.target_2030_raw, i.unit)}</td>
                    <td className="num">{rr.ratio != null ? <><span className="mini-prog"><i style={{ width: `${(v / 1.5) * 100}%`, background: col }} /></span> {Math.round(rr.ratio * 100)}%</> : '—'}</td>
                    <td><RagBadge i={i} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <div className="empty"><Icon path={IC.search} style={{ width: 40, height: 40, color: 'var(--line)', margin: '0 auto 10px' }} /><div>Tidak ada indikator yang cocok dengan filter.</div></div>}
      </div></div>
      <p className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>Menampilkan {filtered.length} indikator untuk tahun {session.year}.</p>

      {/* ---------- INDICATOR MODAL ---------- */}
      {edit && (
        <div className="modal-bg show" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('modal-bg')) setEdit(null); }}>
          <div className="modal">
            <div className="modal-head">
              <span className="code">{edit.code || 'BARU'}</span>
              <h3>{edit.name || 'Indikator Baru'}</h3>
              <button className="x" onClick={() => setEdit(null)}><Icon path={IC.x} /></button>
            </div>
            <div className="modal-body">
              {!isNew && r && (
                <div className="detail-banner">
                  <div className="m"><div className="l">Status Kinerja</div><div className="v"><RagBadge i={edit} /></div></div>
                  <div className="m"><div className="l">Capaian vs Target {edit.year}</div><div className="v" style={{ color: r.k === 'qual' ? 'var(--qual)' : ragHex(r.k) }}>{r.ratio != null ? Math.round(r.ratio * 100) + '%' : '—'}</div></div>
                  <div className="m"><div className="l">Capaian vs Target 2030</div><div className="v">{edit.target_2030 && edit.actual != null ? Math.round((edit.actual / edit.target_2030) * 100) + '%' : '—'}</div></div>
                  <div className="m"><div className="l">Perspektif</div><div className="v" style={{ fontSize: 13, color: pcolor(edit.sm_id) }}>{smById(edit.sm_id)?.name || '—'}</div></div>
                </div>
              )}
              <div className="tabs">
                <button className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>Definisi</button>
                <button className={tab === 'data' ? 'active' : ''} onClick={() => setTab('data')}>Data &amp; Capaian</button>
                <button className={tab === 'narr' ? 'active' : ''} onClick={() => setTab('narr')}>Narasi &amp; Tindak Lanjut</button>
              </div>

              {tab === 'info' && (
                <div className="form-grid">
                  <div className="fg full"><label>Nama Indikator</label><textarea disabled={!editable} value={edit.name} onChange={(e) => set('name', e.target.value)} /></div>
                  <div className="fg"><label>Kode</label><input disabled={!editable} value={edit.code || ''} onChange={(e) => set('code', e.target.value)} /></div>
                  <div className="fg"><label>Tahun</label>
                    <select disabled={!editable} value={edit.year} onChange={(e) => { if (e.target.value === '__new__') setMini({ kind: 'year', a: String(Math.max(...yearList(edit.year)) + 1), b: '' }); else set('year', +e.target.value); }}>
                      {yearList(edit.year).map((y) => <option key={y} value={y}>{y}</option>)}
                      <option value="__new__">+ Tahun lain…</option>
                    </select>
                  </div>
                  <div className="fg"><label>Perspektif (Strategy Map)</label>
                    <select disabled={!editable} value={edit.sm_id || ''} onChange={(e) => set('sm_id', e.target.value)}>
                      {db.strategy_map.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="fg"><label>Outcome</label>
                    <select disabled={!editable} value={edit.outcome_id || ''} onChange={(e) => { if (e.target.value === '__new__') setMini({ kind: 'outcome', a: '', b: '' }); else set('outcome_id', e.target.value); }}>
                      <option value="">—</option>
                      {db.outcomes.filter((o) => o.sm_id === edit.sm_id).map((o) => <option key={o.id} value={o.id}>{(o.code || o.id) + ' · ' + o.name}</option>)}
                      <option value="__new__">+ Tambah outcome baru…</option>
                    </select>
                  </div>
                  <div className="fg"><label>Unit Akuntabilitas</label>
                    <select disabled={!editable} value={edit.acc_id || ''} onChange={(e) => set('acc_id', e.target.value)}>
                      {db.accountability.map((a) => <option key={a.id} value={a.id}>{a.short} — {a.name}</option>)}
                    </select>
                  </div>
                  <div className="fg"><label>Program</label><input disabled={!editable} value={edit.program_name || ''} onChange={(e) => set('program_name', e.target.value)} placeholder="mis. ECED, TELADAN" /></div>
                  <div className="fg"><label>Satuan (Unit)</label>
                    <select disabled={!editable} value={edit.unit || 'Number'} onChange={(e) => set('unit', e.target.value)}>{['Number', 'Percent', 'Text'].map((u) => <option key={u}>{u}</option>)}</select>
                  </div>
                  <div className="fg"><label>Frekuensi</label>
                    <select disabled={!editable} value={edit.frequency || 'Quarterly'} onChange={(e) => set('frequency', e.target.value)}>{['Quarterly', 'Annual', 'Semester'].map((u) => <option key={u}>{u}</option>)}</select>
                  </div>
                  <div className="fg"><label>Arah Capaian</label>
                    <select disabled={!editable} value={edit.direction || 'Naik'} onChange={(e) => set('direction', e.target.value)}>
                      <option value="Naik">Naik (semakin tinggi semakin baik)</option><option value="Turun">Turun (semakin rendah semakin baik)</option>
                    </select>
                  </div>
                  <div className="fg"><label>Jenis Indikator</label><input disabled={!editable} value={edit.indicator_type || ''} onChange={(e) => set('indicator_type', e.target.value)} placeholder="mis. Outcome, Output" /></div>
                  <div className="fg"><label>PIC (email)</label><input disabled={!editable} value={edit.pic || ''} onChange={(e) => set('pic', e.target.value)} /></div>
                  <div className="fg full"><label>Definisi Indikator</label><textarea disabled={!editable} value={edit.definition || ''} onChange={(e) => set('definition', e.target.value)} /></div>
                  <div className="fg"><label>Metode Perhitungan</label><textarea disabled={!editable} value={edit.calc_method || ''} onChange={(e) => set('calc_method', e.target.value)} /></div>
                  <div className="fg"><label>Means of Verification</label><textarea disabled={!editable} value={edit.mov || ''} onChange={(e) => set('mov', e.target.value)} /></div>
                </div>
              )}

              {tab === 'data' && (
                <div className="form-grid">
                  <div className="sec-divider"><span>Target &amp; Aktual</span><i /></div>
                  {edit.unit === 'Text' ? (
                    <>
                      <div className="fg"><label>Target {edit.year}</label><input disabled={!editable} value={edit.target_year_raw ?? (edit.target_year ?? '')} onChange={(e) => { const n = parseFloat(e.target.value); set('target_year', isNaN(n) ? null : n); set('target_year_raw', e.target.value); }} /></div>
                      <div className="fg"><label>Target 2030</label><input disabled={!editable} value={edit.target_2030_raw ?? (edit.target_2030 ?? '')} onChange={(e) => { const n = parseFloat(e.target.value); set('target_2030', isNaN(n) ? null : n); set('target_2030_raw', e.target.value); }} /></div>
                      <div className="fg full"><label>Nilai Aktual</label><input disabled={!editable} value={edit.actual_raw ?? (edit.actual ?? '')} onChange={(e) => { const n = parseFloat(e.target.value); set('actual', isNaN(n) ? null : n); set('actual_raw', e.target.value); }} /></div>
                    </>
                  ) : (
                    <>
                      <div className="fg"><label>Target {edit.year} {edit.unit === 'Percent' ? '(desimal, 0.8 = 80%)' : ''}</label><input disabled={!editable} type="number" step="any" value={edit.target_year ?? ''} onChange={(e) => set('target_year', e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                      <div className="fg"><label>Target 2030 {edit.unit === 'Percent' ? '(desimal)' : ''}</label><input disabled={!editable} type="number" step="any" value={edit.target_2030 ?? ''} onChange={(e) => set('target_2030', e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                      <div className="fg full"><label>Nilai Aktual {edit.unit === 'Percent' ? '(desimal)' : ''}</label><input disabled={!editable} type="number" step="any" value={edit.actual ?? ''} onChange={(e) => set('actual', e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                    </>
                  )}
                  <div className="sec-divider"><span>Capaian Triwulanan</span><i /></div>
                  <div className="fg full">
                    <QChart {...qBars(edit)} unit={edit.unit} year={edit.year} />
                  </div>
                  <div className="fg full"><div className="q-grid">
                    {(['q1', 'q2', 'q3', 'q4'] as const).map((q) => (
                      <div className="fg" key={q}><label>{q.toUpperCase()}</label><input disabled={!editable} type="number" step="any" value={edit[q] ?? ''} onChange={(e) => set(q, e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                    ))}
                  </div></div>
                  <div className="sec-divider"><span>Status Terhitung</span><i /></div>
                  <div className="fg full"><div className="ro">Arah: <b>{edit.direction}</b> · Capaian: <b style={{ color: r!.k === 'qual' ? 'var(--qual)' : ragHex(r!.k) }}>{r!.ratio != null ? Math.round(r!.ratio * 100) + '%' : '—'}</b> · Status: <RagBadge i={edit} /></div></div>
                </div>
              )}

              {tab === 'narr' && (
                <div className="form-grid">
                  <div className="fg full"><label>Catatan / Penjelasan Capaian</label><textarea disabled={!editable} style={{ minHeight: 120 }} value={edit.notes || ''} onChange={(e) => set('notes', e.target.value)} /></div>
                  <div className="fg full"><label>Inisiatif Kunci (Key Initiatives)</label><textarea disabled={!editable} style={{ minHeight: 90 }} value={edit.key_initiatives || ''} onChange={(e) => set('key_initiatives', e.target.value)} /></div>
                  <div className="fg full"><label>Tindak Lanjut (Follow-up Action)</label><textarea disabled={!editable} style={{ minHeight: 90 }} value={edit.follow_up || ''} onChange={(e) => set('follow_up', e.target.value)} /></div>
                  <div className="fg"><label>Status</label><select disabled={!editable} value={edit.status} onChange={(e) => set('status', e.target.value)}>{['Active', 'Inactive', 'Archived'].map((s) => <option key={s}>{s}</option>)}</select></div>
                </div>
              )}
            </div>
            <div className="modal-foot">
              <span className="note">{editable ? (isNew ? 'Mengisi indikator baru' : 'Anda dapat mengubah indikator ini') : 'Mode hanya-baca — di luar unit akuntabilitas Anda'}</span>
              {editable && !isNew && <button className="btn ghost" style={{ color: 'var(--off)' }} onClick={remove}>Hapus</button>}
              <button className="btn" onClick={() => setEdit(null)}>Tutup</button>
              {editable && <button className="btn solid" disabled={busy} onClick={save}><Icon path={IC.check} />{busy ? 'Menyimpan…' : 'Simpan'}</button>}
            </div>
          </div>

          {/* nested mini-prompt */}
          {mini && (
            <div className="modal-bg show" style={{ zIndex: 90 }} onClick={(e) => { if ((e.target as HTMLElement).classList.contains('modal-bg')) setMini(null); }}>
              <div className="modal" style={{ width: 440 }}>
                <div className="modal-head"><h3>{mini.kind === 'year' ? 'Tambah Tahun' : 'Tambah Outcome Baru'}</h3>
                  <button className="x" onClick={() => setMini(null)}><Icon path={IC.x} /></button>
                </div>
                <div className="modal-body"><div className="form-grid">
                  {mini.kind === 'year' ? (
                    <div className="fg full"><label>Tahun (mis. 2027)</label><input autoFocus type="number" value={mini.a} onChange={(e) => setMini({ ...mini, a: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && submitMini()} /></div>
                  ) : (
                    <>
                      <div className="fg full"><label>Kode (opsional)</label><input value={mini.a} onChange={(e) => setMini({ ...mini, a: e.target.value })} placeholder="mis. OUT24" /></div>
                      <div className="fg full"><label>Nama Outcome</label><input autoFocus value={mini.b} onChange={(e) => setMini({ ...mini, b: e.target.value })} placeholder="Deskripsi singkat outcome" onKeyDown={(e) => e.key === 'Enter' && submitMini()} /></div>
                    </>
                  )}
                </div></div>
                <div className="modal-foot">
                  <button className="btn" onClick={() => setMini(null)}>Batal</button>
                  <button className="btn solid" disabled={busy} onClick={submitMini}><Icon path={IC.check} />Simpan</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

