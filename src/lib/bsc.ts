import type { Indicator, AppUser, AppRole } from './types';

export const PCOL: Record<string, string> = { SM01: '#006341', SM02: '#8F8147', SM03: '#3E7C8C', SM04: '#9C6B3F' };
export const pcolor = (id?: string | null) => (id && PCOL[id]) || '#006341';

/* ---------- Contribution mapping: results-chain level (Output → Intermediate Outcome → Outcome → Impact) ---------- */
export const CONTRIB_LEVELS = ['Output', 'Intermediate Outcome', 'Outcome', 'Impact'] as const;
export type ContribLevel = typeof CONTRIB_LEVELS[number];
export const LEVEL_COLOR: Record<string, string> = {
  Output: '#3E7C8C',
  'Intermediate Outcome': '#8F8147',
  Outcome: '#006341',
  Impact: '#9C6B3F',
};
/** Normalizes an indicator's free-text `indicator_type` into one of the 4 standard results-chain levels. */
export function levelOf(i: Indicator): ContribLevel | null {
  const v = (i.indicator_type || '').trim();
  if (!v) return null;
  const found = CONTRIB_LEVELS.find((l) => l.toLowerCase() === v.toLowerCase());
  return found || null;
}

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

/* ============================================================
 * CONTRIBUTION ANALYSIS BERBOBOT (WEIGHTED CONTRIBUTION ANALYSIS)
 * ------------------------------------------------------------
 * Metodologi (Results-Based Management / Theory of Change):
 *   1. Capaian_i   = realisasi / target indikator ke-i (dari ragOf().ratio)
 *   2. Bobot_i     = tingkat kepentingan indikator/level ke-i terhadap level di atasnya,
 *                    dinormalisasi agar jumlah bobot = 100% di antara item yang punya data.
 *   3. Kontribusi_i = Capaian_i x Bobot_i
 *   4. Nilai Level  = Σ Kontribusi_i (jumlah kontribusi seluruh indikator/level penyusunnya)
 * Jika TIDAK ADA bobot yang diisi pada sekelompok item, bobot dianggap setara
 * (setara dengan rata-rata biasa) — perilaku lama tetap berjalan tanpa perubahan.
 * Jika SEBAGIAN bobot diisi, hanya item yang memiliki bobot > 0 yang diikutsertakan
 * (dinormalisasi di antara item tsb); item tanpa bobot dianggap belum diberi bobot (0%).
 * ============================================================ */

/** Menormalisasi bobot sekelompok item agar jumlahnya 100% (0..1). */
export function normalizeWeights<T extends { id: string; weight: number | null | undefined }>(items: T[]): { weights: Record<string, number>; isWeighted: boolean } {
  const withW = items.filter((it) => it.weight != null && (it.weight as number) > 0);
  if (!withW.length) {
    const n = items.length;
    return { weights: Object.fromEntries(items.map((it) => [it.id, n ? 1 / n : 0])), isWeighted: false };
  }
  const sum = withW.reduce((a, it) => a + (it.weight as number), 0);
  const weights = Object.fromEntries(items.map((it) => [it.id, it.weight != null && (it.weight as number) > 0 ? (it.weight as number) / sum : 0]));
  return { weights, isWeighted: true };
}

export type WeightedAgg = ReturnType<typeof aggregate> & { isWeighted: boolean; weights: Record<string, number> };

/** Seperti aggregate(), tetapi avg dihitung sebagai Σ(Capaian_i x Bobot_i) memakai Indicator.weight. */
export function weightedAggregate(list: Indicator[]): WeightedAgg {
  const base = aggregate(list);
  const quant = list.filter((i) => ragOf(i).ratio != null);
  const { weights, isWeighted } = normalizeWeights(quant.map((i) => ({ id: i.id, weight: i.weight })));
  const avg = quant.length ? quant.reduce((s, i) => s + Math.min(ragOf(i).ratio!, 2) * (weights[i.id] || 0), 0) : null;
  return { ...base, avg, isWeighted, weights };
}

/** Kontribusi satu indikator (Capaian x Bobot ternormalisasi) terhadap levelnya. */
export function indicatorContribution(i: Indicator, weights: Record<string, number>): { ratio: number | null; weight: number; contribution: number | null } {
  const ratio = ragOf(i).ratio;
  const weight = weights[i.id] || 0;
  return { ratio, weight, contribution: ratio != null ? Math.min(ratio, 2) * weight : null };
}

/** Ambil peta bobot level (Output/IO/Outcome/Impact) untuk satu Outcome strategis dari tabel level_weights. */
export function levelWeightMapFor(outcomeId: string, levelWeights: { outcome_id: string; level: string; weight: number }[]): Partial<Record<ContribLevel, number>> {
  const m: Partial<Record<ContribLevel, number>> = {};
  levelWeights.filter((w) => w.outcome_id === outcomeId).forEach((w) => { m[w.level as ContribLevel] = w.weight; });
  return m;
}

export type LevelCell = { level: ContribLevel; list: Indicator[]; agg: WeightedAgg };

/** Agregasi berjenjang: skor keseluruhan satu Outcome strategis = Σ(Capaian_level x Bobot_level),
 *  bobot diambil dari level_weights (dinormalisasi di antara level yang punya data indikator),
 *  atau bobot setara bila belum diatur. */
export function rowOverall(cells: LevelCell[], levelWeightMap: Partial<Record<ContribLevel, number>>) {
  const withData = cells.filter((c) => c.agg.total > 0 && c.agg.avg != null);
  if (!withData.length) return { avg: null as number | null, isWeighted: false, weights: {} as Record<string, number> };
  const { weights, isWeighted } = normalizeWeights(withData.map((c) => ({ id: c.level, weight: levelWeightMap[c.level] ?? null })));
  const avg = withData.reduce((s, c) => s + (c.agg.avg as number) * (weights[c.level] || 0), 0);
  return { avg, isWeighted, weights };
}

/** Bobot efektif satu indikator terhadap skor keseluruhan Outcome (perkalian bobot antar-level):
 *  Bobot Efektif = Bobot indikator dlm levelnya  x  Bobot level tsb dlm Outcome. */
export function effectiveWeight(indicatorWeightInLevel: number, levelWeightInRow: number): number {
  return indicatorWeightInLevel * levelWeightInRow;
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

/* Quarterly mini bar-chart helper — mirrors the HTML version's qChart() */
export function qBars(i: Indicator) {
  const qs: [string, number | null][] = [
    ['Q1', i.q1 ?? null], ['Q2', i.q2 ?? null], ['Q3', i.q3 ?? null], ['Q4', i.q4 ?? null],
  ];
  const nums = qs.map((q) => q[1]).filter((v): v is number => v != null);
  const tgt = i.target_year ?? null;
  const maxV = Math.max(...nums, ...(tgt != null ? [tgt] : []), 0.0001);
  let cur = -1;
  for (let x = 3; x >= 0; x--) if (qs[x][1] != null) { cur = x; break; }
  const bars = qs.map(([lbl, v], ix) => ({
    lbl,
    disp: v == null ? '—' : fmtVal(v, null, i.unit),
    h: v == null ? 0 : Math.max(2, Math.min((v / maxV) * 100, 100)),
    cur: ix === cur,
  }));
  return { bars, cur, target: tgt };
}

/* Quarterly mini sparkline (table column) — mirrors HTML's qSpark(): scaled to quarter values only, no target line */
export function qSpark(i: Indicator) {
  const qs: (number | null)[] = [i.q1 ?? null, i.q2 ?? null, i.q3 ?? null, i.q4 ?? null];
  const nums = qs.filter((v): v is number => v != null);
  if (!nums.length) return null;
  const mx = Math.max(...nums, 0.0001);
  let cur = -1;
  for (let x = 3; x >= 0; x--) if (qs[x] != null) { cur = x; break; }
  return qs.map((v, ix) => ({
    h: v == null ? 0 : Math.max(2, Math.min((v / mx) * 100, 100)),
    cur: ix === cur,
    title: `Q${ix + 1}: ${v == null ? '—' : fmtVal(v, null, i.unit)}`,
  }));
}

