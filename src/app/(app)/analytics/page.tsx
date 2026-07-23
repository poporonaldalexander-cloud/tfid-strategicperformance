'use client';
import { useStore, useYearInds } from '@/lib/store';
import { aggregate, pcolor } from '@/lib/bsc';
import { Donut, HBars, LineChart } from '@/components/ui';

export default function AnalyticsPage() {
  const { db, session } = useStore();
  const list = useYearInds();

  const persp = db.strategy_map.slice().sort((a, b) => a.order - b.order).map((sm) => {
    const sub = list.filter((i) => i.sm_id === sm.id);
    return { name: sm.name, id: sm.id, avg: aggregate(sub).avg, count: sub.length };
  });

  const progMap: Record<string, typeof list> = {};
  list.forEach((i) => { const k = i.program_name || '(lain)'; (progMap[k] = progMap[k] || []).push(i); });
  const progAgg = Object.entries(progMap).map(([k, v]) => ({ name: k, avg: aggregate(v).avg, count: v.length }))
    .filter((x) => x.avg != null).sort((a, b) => (b.avg as number) - (a.avg as number));

  const ag = aggregate(list);
  const years = [...new Set(db.indicators.map((i) => i.year))].sort();
  const trend = db.strategy_map.slice().sort((a, b) => a.order - b.order).map((sm) => ({
    sm,
    vals: years.map((y) => aggregate(db.indicators.filter((i) => i.year === y && i.sm_id === sm.id && (!session.scope || i.acc_id === session.scope))).avg),
  }));

  return (
    <>
      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Rata-rata Capaian per Perspektif</h3><span className="hint">Tahun {session.year}</span></div>
          <div className="card-pad"><HBars items={persp.map((p) => ({ name: p.name, val: p.avg, sub: p.count + ' indikator', color: pcolor(p.id) }))} /></div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Distribusi Status</h3><span className="hint">{ag.total} indikator</span></div>
          <div className="card-pad"><div className="donut-wrap">
            <Donut data={[['Tercapai', ag.on, 'var(--on)'], ['Berisiko', ag.risk, 'var(--risk)'], ['Belum Tercapai', ag.off, 'var(--off)'], ['Kualitatif', ag.qual, 'var(--qual)']]} />
          </div></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Capaian per Program</h3><span className="hint">rata-rata vs target tahun {session.year}</span></div>
        <div className="card-pad"><HBars items={progAgg.slice(0, 14).map((p) => ({ name: p.name, val: p.avg, sub: p.count + ' indikator' }))} /></div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h3>Tren Capaian Lintas Tahun</h3><span className="hint">{years.join(' → ')}</span></div>
        <div className="card-pad"><LineChart years={years} trend={trend} /></div>
      </div>
    </>
  );
}
