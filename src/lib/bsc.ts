import type { Indicator, AppUser, AppRole } from './types';

export const PCOL: Record<string, string> = { SM01: '#006341', SM02: '#8F8147', SM03: '#3E7C8C', SM04: '#9C6B3F' };
export const pcolor = (id?: string | null) => (id && PCOL[id]) || '#006341';

export const ROLE_LABEL: Record<AppRole, string> = { admin: 'Administrator', pic: 'Program PIC', viewer: 'Viewer' };

export function appRoleOf(u: AppUser): AppRole {
  if (/admin/i.test(u.role || '')) return 'admin';
  return u.can_edit ? 'pic' : 'viewer';
}
export function scopeOf(u: AppUser): string | null {
  if (appRoleOf(u) === 'admin') return null;
  if (!u.acc_id || u.acc_id === 'ALL') return null;
  return u.acc_id;
}

export type Rag = { k: 'on' | 'risk' | 'off' | 'qual'; label: string; ratio: number | null };
export function ragOf(i: Indicator): Rag {
  const t = i.target_year, a = i.actual;
  if (t == null || a == null) return { k: 'qual', label: 'Kualitatif', ratio: null };
  let r: number;
  if (i.direction === 'Turun') r = a > 0 ? t / a : a <= t ? 1 : 0;
  else r = t !== 0 ? a / t : a > 0 ? 1 : 0;
  if (r >= 0.9) return { k: 'on', label: 'Tercapai', ratio: r };
  if (r >= 0.6) return { k: 'risk', label: 'Berisiko', ratio: r };
  return { k: 'off', label: 'Belum Tercapai', ratio: r };
}
export const ragHex = (k: string) =>
  ({ on: 'var(--on)', risk: 'var(--risk)', off: 'var(--off)', qual: 'var(--qual)' } as any)[k];

export function aggregate(list: Indicator[]) {
  const r = { total: list.length, on: 0, risk: 0, off: 0, qual: 0, ratios: [] as number[] };
  list.forEach((i) => {
    const g = ragOf(i);
    (r as any)[g.k]++;
    if (g.ratio != null) r.ratios.push(Math.min(g.ratio, 2));
  });
  const avg = r.ratios.length ? r.ratios.reduce((a, b) => a + b, 0) / r.ratios.length : null;
  return { ...r, avg };
}

export function fmtNum(v: number | null) {
  if (v == null) return '—';
  if (Math.abs(v) >= 1000) return v.toLocaleString('id-ID', { maximumFractionDigits: 0 });
  return (Math.round(v * 100) / 100).toLocaleString('id-ID', { maximumFractionDigits: 2 });
}
export function fmtVal(num: number | null, raw: string | null, unit: string | null) {
  if (num != null) {
    if (unit === 'Percent') return Math.round(num * 1000) / 10 + '%';
    return fmtNum(num);
  }
  return raw != null ? raw : '—';
}
