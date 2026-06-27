'use client';
import Link from 'next/link';
import { useStore, useYearInds } from '@/lib/store';
import { aggregate, ragOf, ragHex, pcolor, fmtVal } from '@/lib/bsc';
import { Donut, RagBadge } from '@/components/ui';

function shade(hex: string, p: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  let r = (n >> 16) + p * 2.55, g = ((n >> 8) & 255) + p * 2.55, b = (n & 255) + p * 2.55;
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [cl(r), cl(g), cl(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export default function DashboardPage() {
  const { db, session } = useStore();
  const list = useYearInds();
  const ag = aggregate(list);
  const quant = ag.total - ag.qual;

  const stats = [
    { lbl: 'Total Indikator', big: ag.total, meta: `${quant} kuantitatif · ${ag.qual} kualitatif`, col: 'var(--green)' },
    { lbl: 'Tercapai', big: ag.on, meta: `${quant ? Math.round((ag.on / quant) * 100) : 0}% dari indikator kuantitatif`, col: 'var(--on)' },
    { lbl: 'Berisiko', big: ag.risk, meta: 'Capaian 60–89% terhadap target', col: 'var(--risk)' },
    { lbl: 'Belum Tercapai', big: ag.off, meta: 'Capaian di bawah 60%', col: 'var(--off)' },
  ];
  const persp = db.strategy_map.slice().sort((a, b) => a.order - b.order).map((sm) => {
    const sub = list.filter((i) => i.sm_id === sm.id);
    return { sm, count: sub.length, avg: aggregate(sub).avg };
  });
  const accAgg = db.accountability.map((acc) => {
    const sub = list.filter((i) => i.acc_id === acc.id);
    return { acc, count: sub.length, avg: aggregate(sub).avg };
  }).filter((x) => x.count > 0).sort((a, b) => (b.avg || 0) - (a.avg || 0));

  const attention = list.filter((i) => ['off', 'risk'].includes(ragOf(i).k))
    .sort((a, b) => (ragOf(a).ratio || 0) - (ragOf(b).ratio || 0)).slice(0, 12);

  return (
    <>
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        {stats.map((s, ix) => (
          <div className="stat" key={ix}>
            <div className="accent" style={{ background: s.col }} />
            <div className="lbl">{s.lbl}</div>
            <div className="big" style={{ color: s.col }}>{s.big}</div>
            <div className="meta">{s.meta}</div>
          </div>
        ))}
      </div>

      <div className="card-head" style={{ border: 'none', padding: '4px 0 12px' }}>
        <h3 style={{ fontSize: 14 }}>Capaian per Perspektif Balanced Scorecard</h3>
      </div>
      <div className="persp-grid" style={{ marginBottom: 22 }}>
        {persp.map((p) => (
          <Link href="/strategy" key={p.sm.id} className="persp"
            style={{ background: `linear-gradient(135deg,${pcolor(p.sm.id)},${shade(pcolor(p.sm.id), -18)})`, color: '#fff' }}>
            <div className="ring" />
            <div className="pn">{p.sm.id}</div>
            <div className="nm">{p.sm.name}</div>
            <div className="spacer" />
            <div className="ach">{p.avg != null ? Math.round(p.avg * 100) + '%' : '—'}</div>
            <div className="sub">rata-rata capaian · {p.count} indikator</div>
          </Link>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Distribusi Status Kinerja</h3><span className="hint">Tahun {session.year}</span></div>
          <div className="card-pad"><div className="donut-wrap">
            <Donut data={[['Tercapai', ag.on, 'var(--on)'], ['Berisiko', ag.risk, 'var(--risk)'], ['Belum Tercapai', ag.off, 'var(--off)'], ['Kualitatif', ag.qual, 'var(--qual)']]} />
          </div></div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Capaian per Unit Akuntabilitas</h3><span className="hint">rata-rata vs target tahun</span></div>
          <div className="card-pad">
            {accAgg.length ? accAgg.map((x) => {
              const v = x.avg != null ? Math.min(x.avg, 1.5) : 0;
              const col = x.avg == null ? 'var(--qual)' : x.avg >= 0.9 ? 'var(--on)' : x.avg >= 0.6 ? 'var(--risk)' : 'var(--off)';
              return (
                <div className="bar-row" key={x.acc.id}>
                  <div className="nm" title={x.acc.name}>{x.acc.short} · {x.acc.name}</div>
                  <div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min((v / 1.5) * 100, 100)}%`, background: col }} /></div>
                  <div className="val">{x.avg != null ? Math.round(x.avg * 100) + '%' : '—'}</div>
                </div>
              );
            }) : <div className="empty muted">Tidak ada data.</div>}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Perlu Perhatian — Indikator Belum Tercapai & Berisiko</h3><span className="hint">Tahun {session.year}</span></div>
        <div className="tbl-scroll">
          {attention.length ? (
            <table>
              <thead><tr><th>Kode</th><th>Indikator</th><th>Unit</th><th className="num">Target</th><th className="num">Aktual</th><th className="num">Capaian</th><th>Status</th></tr></thead>
              <tbody>
                {attention.map((i) => {
                  const r = ragOf(i);
                  const acc = db.accountability.find((a) => a.id === i.acc_id);
                  return (
                    <tr key={i.id}>
                      <td><span className="code">{i.code}</span></td>
                      <td><span className="iname">{i.name}</span><span className="imeta">{acc?.short} · {i.program_name}</span></td>
                      <td>{i.unit || '—'}</td>
                      <td className="num">{fmtVal(i.target_year, i.target_year_raw, i.unit)}</td>
                      <td className="num">{fmtVal(i.actual, i.actual_raw, i.unit)}</td>
                      <td className="num">{r.ratio != null ? Math.round(r.ratio * 100) + '%' : '—'}</td>
                      <td><RagBadge i={i} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <div className="empty"><div className="muted">Tidak ada indikator berisiko atau belum tercapai. 🎉</div></div>}
        </div>
      </div>

      <p className="muted" style={{ fontSize: 11, marginTop: 14, maxWidth: 760 }}>
        Catatan metodologi: status kinerja dihitung otomatis dari rasio nilai aktual terhadap target tahun berjalan
        (Tercapai ≥ 90%, Berisiko 60–89%, Belum Tercapai &lt; 60%). Untuk indikator arah &quot;Turun&quot; (mis. biaya, atrisi),
        rasio dihitung target ÷ aktual. Indikator dengan target kualitatif tidak diberi skor RAG.
      </p>
    </>
  );
}
