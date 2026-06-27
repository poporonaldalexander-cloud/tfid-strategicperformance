'use client';
import { useStore, useYearInds } from '@/lib/store';
import { aggregate, pcolor } from '@/lib/bsc';

function shade(hex: string, p: number) {
  const n = parseInt(hex.replace('#', ''), 16);
  let r = (n >> 16) + p * 2.55, g = ((n >> 8) & 255) + p * 2.55, b = (n & 255) + p * 2.55;
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return '#' + [cl(r), cl(g), cl(b)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export default function StrategyPage() {
  const { db } = useStore();
  const list = useYearInds();
  const sms = db.strategy_map.slice().sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="legend" style={{ marginBottom: 16 }}>
        <span><span className="dot" style={{ background: 'var(--on)' }} />Tercapai</span>
        <span><span className="dot" style={{ background: 'var(--risk)' }} />Berisiko</span>
        <span><span className="dot" style={{ background: 'var(--off)' }} />Belum Tercapai</span>
        <span><span className="dot" style={{ background: 'var(--qual)' }} />Kualitatif</span>
      </div>
      <div className="smap">
        {sms.map((sm) => {
          const sub = list.filter((i) => i.sm_id === sm.id);
          const a = aggregate(sub);
          const outsWith = db.outcomes.filter((o) => o.sm_id === sm.id && sub.some((i) => i.outcome_id === o.id));
          const outs = outsWith.length ? outsWith : db.outcomes.filter((o) => o.sm_id === sm.id && o.status === 'Active');
          return (
            <div className="smap-row" key={sm.id}>
              <div className="smap-head" style={{ background: `linear-gradient(150deg,${pcolor(sm.id)},${shade(pcolor(sm.id), -20)})`, color: '#fff' }}>
                <div className="pn">{sm.id}</div>
                <div className="nm">{sm.name}</div>
                <div className="st"><b>{a.avg != null ? Math.round(a.avg * 100) + '%' : '—'}</b> rata-rata · {sub.length} indikator</div>
              </div>
              <div className="smap-body">
                {outs.length ? outs.map((o) => {
                  const oi = sub.filter((i) => i.outcome_id === o.id);
                  const oa = aggregate(oi);
                  const v = oa.avg != null ? Math.min(oa.avg, 1.5) : 0;
                  const col = oa.avg == null ? 'var(--qual)' : oa.avg >= 0.9 ? 'var(--on)' : oa.avg >= 0.6 ? 'var(--risk)' : 'var(--off)';
                  return (
                    <div className="ocard" key={o.id}>
                      <div className="oc">{o.code || o.id}</div>
                      <div className="on">{o.name}</div>
                      <div className="ofoot">
                        <span className="cnt">{oi.length} indikator</span>
                        <span>
                          <span className="mini-prog"><i style={{ width: `${Math.min((v / 1.5) * 100, 100)}%`, background: col }} /></span>
                          <b style={{ fontSize: 11.5, marginLeft: 7 }}>{oa.avg != null ? Math.round(oa.avg * 100) + '%' : '—'}</b>
                        </span>
                      </div>
                    </div>
                  );
                }) : <div className="muted" style={{ padding: 8 }}>Belum ada indikator untuk tahun ini.</div>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
