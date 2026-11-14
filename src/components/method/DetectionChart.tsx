import type { DetectRow } from "../../lib/landing";

/*
 * 05절 크기별 감지율 (시안 `DRAW.det`): 단계마다 가로 막대(감지율, 클수록 진하게) + 우연 기준 세로선 + 오른쪽 % 와 건수.
 * 감지율이 없으면 막대 없이 "—"(8-3). 막대마다 `<title>`로 감지율·우연 기준·건수를 단다.
 * 첫 화면의 옛 `DetectionBars`(흰 카드 HTML 막대)와 모양이 달라 새로 그린다.
 */
type DetectionChartProps = {
  rows: readonly DetectRow[];
  label: string;
  /** 값이 없으면 "—"를 돌려준다 */
  percent: (value: number | null) => string;
  count: (n: number | null) => string;
  rowTitle: (bin: string, detected: string, chance: string, n: string) => string;
};

const BX = 120;
const BW = 460;
const ROW = 44;

export function DetectionChart({ rows, label, percent, count, rowTitle }: DetectionChartProps) {
  const height = rows.length * ROW + 30;
  const x = (p: number) => BX + p * BW;
  return (
    <svg viewBox={`0 0 720 ${height}`} className="block h-auto w-full" role="img" aria-label={label}>
      {rows.map((row, i) => {
        const y = 12 + i * ROW;
        const detected = percent(row.detected);
        const chance = percent(row.chance);
        return (
          <g key={row.bin}>
            <title>{rowTitle(row.label, detected, chance, count(row.n))}</title>
            <text x={BX - 12} y={y + 15} textAnchor="end" fontSize={13.5} className="fill-ink">
              {row.label}
            </text>
            <rect x={BX} y={y} width={BW} height={20} rx={4} className="fill-wash" />
            {row.detected !== null && (
              <rect
                x={BX}
                y={y}
                width={x(row.width) - BX}
                height={20}
                rx={4}
                // 왼쪽부터 자란다(탭을 바꾸면 다시, `chart-grow-x`)
                className="chart-grow-x fill-fire"
                opacity={0.35 + row.width * 0.65}
              />
            )}
            {row.chanceAt !== null && (
              <line x1={x(row.chanceAt)} x2={x(row.chanceAt)} y1={y - 4} y2={y + 24} strokeWidth={2} className="chart-fade stroke-ink opacity-60" />
            )}
            <text x={BX + BW + 14} y={y + 15} fontSize={14} fontWeight={600} className="fill-ink">
              {detected}
            </text>
            <text x={BX + BW + 62} y={y + 15} fontSize={12} className="fill-muted">
              {count(row.n)}
            </text>
          </g>
        );
      })}
      {[0, 0.25, 0.5, 0.75, 1].map((p) => (
        <text key={p} x={x(p)} y={height - 6} textAnchor="middle" fontSize={11.5} className="fill-muted">
          {percent(p)}
        </text>
      ))}
    </svg>
  );
}
