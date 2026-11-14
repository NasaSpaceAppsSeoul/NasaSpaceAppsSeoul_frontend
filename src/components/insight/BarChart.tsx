import { useId } from "react";

/*
 * 인사이트의 막대 그래프 (screens/kr/insight.png의 "같은 달 연도별"과 "계절").
 * 강조 막대(`accent`)는 주황 그라데이션, 나머지는 회색. 막대 위 숫자, 세로축 눈금 0·절반·위 끝.
 * 집계 중 막대는 점선 테두리, `marked` 막대는 이름 아래 파란 점. SVG 좌표는 `viewBox` 단위다(소개 `AnnualBarChart`와 같은 방식).
 */
export type Bar = {
  key: string;
  /** 아래 이름 */
  name: string;
  value: number;
  /** 막대 위 숫자 */
  valueText: string;
  /** 읽는 이름(`<title>`) */
  title: string;
  tone: "accent" | "base";
  partial?: boolean;
  marked?: boolean;
};

type BarChartProps = {
  label: string;
  bars: readonly Bar[];
  max: number;
  formatTick: (value: number) => string;
};

const WIDTH = 560;
const HEIGHT = 220;
/** 눈금 숫자("2,000")가 잘리지 않을 자리 */
const LEFT = 52;
const RIGHT = 8;
const TOP = 20;
const BOTTOM = 32;
const PLOT_H = HEIGHT - TOP - BOTTOM;

export function BarChart({ label, bars, max, formatTick }: BarChartProps) {
  const gradientId = useId();
  const slot = (WIDTH - LEFT - RIGHT) / Math.max(1, bars.length);
  const barW = slot * 0.62;
  const y = (value: number) => TOP + PLOT_H - (Math.max(0, value) / max) * PLOT_H;
  const ticks = [0, max / 2, max];

  // `role="img"` 안의 `<title>`·글자는 화면 읽기 프로그램에 전달되지 않는다. 막대 값을 읽는 이름에 함께 넣는다
  const spoken = `${label}. ${bars.map((bar) => bar.title).join(", ")}`;
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={spoken} className="h-auto w-full">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-bar-harmonized-from)" />
          <stop offset="100%" stopColor="var(--color-bar-harmonized-to)" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(tick)} y2={y(tick)} className="stroke-border" strokeWidth={1} />
          <text x={LEFT - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="fill-muted text-xs">
            {formatTick(tick)}
          </text>
        </g>
      ))}
      {bars.map((bar, i) => {
        const x = LEFT + i * slot + (slot - barW) / 2;
        const top = y(bar.value);
        // 0인 막대는 그리지 않고 숫자 "0"만(디자인). 집계 중인 해는 0이어도 점선 테두리가 보이게 2px 남긴다
        const drawn = bar.value > 0 || bar.partial === true;
        return (
          <g key={bar.key}>
            {drawn && (
            <rect
              x={x}
              y={Math.min(top, TOP + PLOT_H - 2)}
              width={barW}
              height={Math.max(2, TOP + PLOT_H - top)}
              rx={2}
              fill={bar.tone === "accent" ? `url(#${gradientId})` : "var(--color-bar-pre2012)"}
              stroke={bar.partial === true ? "var(--color-heat-partial)" : undefined}
              strokeDasharray={bar.partial === true ? "3 2" : undefined}
            >
              <title>{bar.title}</title>
            </rect>
            )}
            <text x={x + barW / 2} y={top - 6} textAnchor="middle" className="fill-ink text-xs">
              {bar.valueText}
            </text>
            <text x={x + barW / 2} y={HEIGHT - 14} textAnchor="middle" className="fill-muted text-xs">
              {bar.name}
            </text>
            {bar.marked === true && <circle cx={x + barW / 2} cy={HEIGHT - 3} r={3} className="fill-action" />}
          </g>
        );
      })}
    </svg>
  );
}
