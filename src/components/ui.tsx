'use client';
import React from 'react';
import { ragOf, ragHex, pcolor, fmtVal } from '@/lib/bsc';
import type { Indicator } from '@/lib/types';

export const IC: Record<string, string> = {
  dash: '<path d="M3 13h8V3H3zM13 21h8V8h-8zM13 3v3h8V3zM3 21h8v-6H3z"/>',
  map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
};

export function Icon({ path, w = 2, style }: { path: string; w?: number; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"
      style={style} dangerouslySetInnerHTML={{ __html: path }} />
  );
}

export function RagBadge({ i }: { i: Indicator }) {
  const r = ragOf(i);
  return (
    <span className={`badge b-${r.k}`}><span className="dot" />{r.label}</span>
  );
}

export function QChart({ bars, cur, target, unit, year }: {
  bars: { lbl: string; disp: string; h: number; cur: boolean }[];
  cur: number; target: number | null; unit: string | null; year: number;
}) {
  return (
    <>
      <div className="qbars">
        {bars.map((b, ix) => (
          <div className="qbar" key={ix}>
            <div className="qb-val">{b.disp}</div>
            <div className="qb-track"><div className={`qb-fill${b.cur ? ' cur' : ''}`} style={{ height: `${b.h}%` }} /></div>
            <div className="qb-lbl">{b.lbl}</div>
          </div>
        ))}
      </div>
      <div className="qb-cap">
        {target != null && <span>Target {year}: <b>{fmtVal(target, null, unit)}</b></span>}
        {cur >= 0 ? <span>Triwulan terisi terakhir: <b>Q{cur + 1}</b> (ditandai emas)</span> : <span className="muted">Belum ada data triwulanan</span>}
      </div>
    </>
  );
}

export function QSpark({ data }: { data: { h: number; cur: boolean; title: string }[] | null }) {
  if (!data) return <span className="muted">—</span>;
  return (
    <span className="qspark" title="Q1–Q4">
      {data.map((d, ix) => (
        <i key={ix} className={d.cur ? 'cur' : ''} style={{ height: `${d.h}%` }} title={d.title} />
      ))}
    </span>
  );
}

/* ---------- Charts ---------- */
export function Donut({ data }: { data: [string, number, string][] }) {
  const total = data.reduce((a, d) => a + d[1], 0) || 1;
  const R = 54, C = 2 * Math.PI * R;
  let off = 0;
  return (
    <>
      <svg width="140" height="140" viewBox="0 0 140 140">
        {data.filter((d) => d[1] > 0).map((d, ix) => {
          const len = (d[1] / total) * C;
          const el = (
            <circle key={ix} cx="70" cy="70" r={R} fill="none" stroke={d[2]} strokeWidth="22"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} transform="rotate(-90 70 70)" />
          );
          off += len;
          return el;
        })}
        <text x="70" y="64" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--ink)">{total}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="10" fill="var(--muted)">INDIKATOR</text>
      </svg>
      <div className="donut-legend">
        {data.map((d, ix) => (
          <div className="li" key={ix}><span className="dot" style={{ background: d[2] }} />{d[0]}<b>{d[1]}</b></div>
        ))}
      </div>
    </>
  );
}

export function HBars({ items }: { items: { name: string; val: number | null; sub?: string; color?: string }[] }) {
  if (!items.length || items.every((x) => x.val == null))
    return <div className="empty muted">Tidak ada data kuantitatif.</div>;
  const max = 1.5;
  return (
    <>
      {items.map((it, ix) => {
        const v = it.val == null ? 0 : Math.min(it.val, max);
        const col = it.color || (it.val == null ? 'var(--qual)' : it.val >= 0.9 ? 'var(--on)' : it.val >= 0.6 ? 'var(--risk)' : 'var(--off)');
        const lbl = it.val == null ? '—' : Math.round(it.val * 100) + '%';
        return (
          <div className="bar-row" key={ix}>
            <div className="nm" title={it.name}>{it.name}{it.sub ? <span className="muted" style={{ fontWeight: 400 }}> · {it.sub}</span> : null}</div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${(v / max) * 100}%`, background: col }} /></div>
            <div className="val">{lbl}</div>
          </div>
        );
      })}
    </>
  );
}

export function LineChart({ years, trend }: { years: number[]; trend: { sm: any; vals: (number | null)[] }[] }) {
  const W = 640, H = 240, pad = 40, plotW = W - pad * 2, plotH = H - pad * 2, maxY = 1.6, n = years.length;
  const x = (ix: number) => pad + (n <= 1 ? plotW / 2 : (ix / (n - 1)) * plotW);
  const y = (v: number) => pad + plotH - (Math.min(v, maxY) / maxY) * plotH;
  const grid: React.ReactNode[] = [];
  for (let g = 0; g <= 4; g++) {
    const gy = pad + plotH - (g / 4) * plotH;
    grid.push(<line key={'g' + g} x1={pad} y1={gy} x2={W - pad} y2={gy} stroke="var(--line2)" />);
    grid.push(<text key={'t' + g} x={pad - 8} y={gy + 4} textAnchor="end" fontSize="10" fill="var(--muted2)">{Math.round((g / 4) * maxY * 100)}%</text>);
  }
  years.forEach((yr, ix) => grid.push(<text key={'y' + ix} x={x(ix)} y={H - 12} textAnchor="middle" fontSize="11" fill="var(--muted)">{yr}</text>));
  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 520 }}>
          {grid}
          <line x1={pad} y1={y(0.9)} x2={W - pad} y2={y(0.9)} stroke="var(--on)" strokeDasharray="4 4" opacity={0.6} />
          {trend.map((t, ti) => {
            const pts = t.vals.map((v, ix) => (v == null ? null : [x(ix), y(v)])).filter(Boolean) as number[][];
            const path = pts.map((p, ix) => (ix ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
            return (
              <g key={ti}>
                <path d={path} fill="none" stroke={pcolor(t.sm.id)} strokeWidth={2.5} />
                {t.vals.map((v, ix) => (v == null ? null : <circle key={ix} cx={x(ix)} cy={y(v)} r={4} fill={pcolor(t.sm.id)} />))}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="legend" style={{ marginTop: 12, justifyContent: 'center' }}>
        {trend.map((t, ix) => (<span key={ix}><span className="dot" style={{ background: pcolor(t.sm.id) }} />{t.sm.name}</span>))}
      </div>
    </>
  );
}

export function csvCell(v: any) {
  if (v == null) v = '';
  v = String(v);
  if (/[",\n\r]/.test(v)) v = '"' + v.replace(/"/g, '""') + '"';
  return v;
}

