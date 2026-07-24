'use client';
import { ragOf, LEVEL_COLOR, type LevelCell } from '@/lib/bsc';

const ragCol = (avg: number | null | undefined) =>
  avg == null ? '#8B968F' : avg >= 0.9 ? '#1E8C5A' : avg >= 0.6 ? '#CF9A2E' : '#C7553F';

const ROW_H = 30, ROW_GAP = 8, BLOCK_GAP = 26, PAD = 20;
const COL1_X = 16, COL1_W = 172;
const COL2_X = 350, COL2_W = 192;
const COL3_X = 712, COL3_W = 196;
const NODE_H = 26;

/**
 * Weighted Theory of Change Pathway Diagram
 * Menggambarkan hubungan kausalitas antar level TOC untuk satu Outcome strategis:
 *   Indikator (Tier 1) --bobot%--> Level rantai hasil (Tier 2: Output/Intermediate Outcome/Outcome/Impact)
 *   --bobot level%--> Skor keseluruhan Outcome (Tier 3)
 * Semua angka bobot & capaian diambil dari perhitungan contribution analysis yang sudah ada
 * (weightedAggregate / rowOverall) — diagram ini murni visualisasi, tidak menghitung ulang.
 */
export function TocPathwayDiagram({
  cells, rowWeights, overallAvg, overallLabel = 'Keseluruhan Outcome',
}: {
  cells: LevelCell[];
  rowWeights: Record<string, number>;
  overallAvg: number | null;
  overallLabel?: string;
}) {
  const active = cells.filter((c) => c.agg.total > 0 && c.agg.avg != null);
  if (!active.length) {
    return <div className="empty muted" style={{ padding: '30px 0' }}>Belum ada data yang dapat digambarkan untuk Outcome ini.</div>;
  }

  let y = PAD;
  const blocks = active.map((c) => {
    const n = Math.max(c.list.length, 1);
    const blockH = n * ROW_H + (n - 1) * ROW_GAP;
    const startY = y;
    const indicatorYs = c.list.length
      ? c.list.map((_, i) => startY + i * (ROW_H + ROW_GAP) + ROW_H / 2)
      : [startY + ROW_H / 2];
    const centerY = startY + blockH / 2;
    y += blockH + BLOCK_GAP;
    return { level: c.level, cell: c, indicatorYs, centerY };
  });
  const totalH = Math.max(y - BLOCK_GAP + PAD, 90);
  const overallY = totalH / 2;
  const width = COL3_X + COL3_W + 24;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${totalH}`} width={width} height={totalH} style={{ display: 'block', minWidth: 760 }}>
        <defs>
          <marker id="tocArrowInd" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#C4CFC8" /></marker>
        </defs>

        {/* Tier 1 -> Tier 2: indikator ke level */}
        {blocks.map((b) => b.cell.list.map((ind, i) => {
          const y1 = b.indicatorYs[i], y2 = b.centerY;
          const x1 = COL1_X + COL1_W, x2 = COL2_X, midX = (x1 + x2) / 2;
          const w = b.cell.agg.weights[ind.id] || 0;
          return (
            <g key={ind.id + '-e1'}>
              <path d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`} stroke="#C9D4CD" strokeWidth={1.4} fill="none" markerEnd="url(#tocArrowInd)" />
              {w > 0 && <text x={midX} y={(y1 + y2) / 2 - 4} fontSize="9.5" fontWeight={700} fill="#647069" textAnchor="middle">{Math.round(w * 100)}%</text>}
            </g>
          );
        }))}

        {/* Tier 2 -> Tier 3: level ke keseluruhan */}
        {blocks.map((b) => {
          const y1 = b.centerY, y2 = overallY;
          const x1 = COL2_X + COL2_W, x2 = COL3_X, midX = (x1 + x2) / 2;
          const w = rowWeights[b.level] || 0;
          const col = LEVEL_COLOR[b.level] || '#006341';
          return (
            <g key={b.level + '-e2'}>
              <path d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`} stroke={col} strokeOpacity={0.55} strokeWidth={2.2} fill="none" markerEnd="url(#tocArrowInd)" />
              {w > 0 && <text x={midX} y={(y1 + y2) / 2 - 5} fontSize="11" fontWeight={700} fill={col} textAnchor="middle">{Math.round(w * 100)}%</text>}
            </g>
          );
        })}

        {/* Tier 1: node indikator */}
        {blocks.map((b) => b.cell.list.map((ind, i) => {
          const yy = b.indicatorYs[i] - NODE_H / 2;
          const r = ragOf(ind);
          const label = (ind.code || ind.name || '').toString();
          return (
            <g key={ind.id + '-n1'}>
              <rect x={COL1_X} y={yy} width={COL1_W} height={NODE_H} rx={6} fill="#fff" stroke="#E3E9E5" />
              <text x={COL1_X + 9} y={yy + 12} fontSize="10" fontWeight={700} fill="#19231F">{label.length > 20 ? label.slice(0, 19) + '…' : label}</text>
              <text x={COL1_X + 9} y={yy + 22} fontSize="9.5" fill={ragCol(r.ratio)}>{r.ratio != null ? Math.round(r.ratio * 100) + '%' : '—'}</text>
            </g>
          );
        }))}

        {/* Tier 2: node level */}
        {blocks.map((b) => {
          const col = LEVEL_COLOR[b.level] || '#006341';
          const yy = b.centerY - NODE_H / 2 - 4;
          return (
            <g key={b.level + '-n2'}>
              <rect x={COL2_X} y={yy} width={COL2_W} height={NODE_H + 8} rx={8} fill={col} fillOpacity={0.1} stroke={col} strokeWidth={1.4} />
              <text x={COL2_X + 12} y={yy + 17} fontSize="11.5" fontWeight={700} fill={col}>{b.level}</text>
              <text x={COL2_X + COL2_W - 12} y={yy + 17} fontSize="13" fontWeight={700} fill={ragCol(b.cell.agg.avg)} textAnchor="end">
                {b.cell.agg.avg != null ? Math.round(b.cell.agg.avg * 100) + '%' : '—'}
              </text>
            </g>
          );
        })}

        {/* Tier 3: node keseluruhan */}
        <g>
          <rect x={COL3_X} y={overallY - 23} width={COL3_W} height={46} rx={10} fill={ragCol(overallAvg)} fillOpacity={0.14} stroke={ragCol(overallAvg)} strokeWidth={1.6} />
          <text x={COL3_X + COL3_W / 2} y={overallY - 4} fontSize="11.5" fontWeight={700} fill="#19231F" textAnchor="middle">{overallLabel}</text>
          <text x={COL3_X + COL3_W / 2} y={overallY + 16} fontSize="15" fontWeight={700} fill={ragCol(overallAvg)} textAnchor="middle">
            {overallAvg != null ? Math.round(overallAvg * 100) + '%' : '—'}
          </text>
        </g>
      </svg>
    </div>
  );
}
