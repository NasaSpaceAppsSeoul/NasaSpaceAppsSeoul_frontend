import { useId } from "react";

/*
 * 보정 전후 막대 카드 하나 (screens/kr/about.png "원시값"·"보정값").
 * 2012년 전은 회색, 그 뒤는 색 그라데이션(위 → 아래). 막대 25개라 막대 위 숫자는 빼고 `<title>`로 값을 단다.
 * SVG 좌표는 `viewBox` 단위이고 화면 너비에 맞춰 늘어난다.
 */
export type ChartBar = { year: number; value: number; era: "pre" | "post" };
export type ChartTone = "blue" | "orange";

type AnnualBarChartProps = {
  title: string;
  sub: string;
  legend: string;
  note: string;
  /** 그래프의 읽히는 이름 */
  label: string;
  bars: readonly ChartBar[];
  /** 세로축 위 끝(두 카드가 같은 값을 쓴다) */
  max: number;
  tone: ChartTone;
  /** 막대 `<title>` 문구 */
  barTitle: (bar: ChartBar) => string;
  /** 눈금 숫자 */
  formatTick: (value: number) => string;
  /** 아래에 이름을 적을 해 */
  yearTicks: readonly number[];
  /** 진하게 보일 해(위성 전환) */
  markYear: number;
  /** 값이 모두 0일 때 그래프 대신 보일 문구(0과 자료 없음이 구분되지 않는다) */
  empty: string;
};

const GRADIENT: Record<ChartTone, { from: string; to: string }> = {
  blue: { from: "var(--color-bar-raw-from)", to: "var(--color-bar-raw-to)" },
  orange: { from: "var(--color-bar-harmonized-from)", to: "var(--color-bar-harmonized-to)" },
};

const LEGEND_CLASS: Record<ChartTone, string> = {
  blue: "text-action",
  orange: "text-bar-harmonized-to",
};

const WIDTH = 520;
const HEIGHT = 200;
const LEFT = 40;
/** 마지막 해 이름이 잘리지 않게 오른쪽에 남기는 자리 */
const RIGHT = 16;
const TOP = 8;
const BOTTOM = 24;
const PLOT_H = HEIGHT - TOP - BOTTOM;

export function AnnualBarChart(props: AnnualBarChartProps) {
  const { title, sub, legend, note, bars, empty } = props;
  const hasData = bars.some((bar) => bar.value > 0);
  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-page p-6">
      <div>
        <h3 className="text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted">{sub}</p>
      </div>
      {hasData ? <Bars {...props} /> : <p className="py-16 text-center text-base text-muted">{empty}</p>}
      <p className={`text-sm font-medium ${LEGEND_CLASS[props.tone]}`}>{legend}</p>
      <p className="text-base text-ink">{note}</p>
    </div>
  );
}

function Bars({ label, bars, max, tone, barTitle, formatTick, yearTicks, markYear }: AnnualBarChartProps) {
  const gradientId = useId();
  const slot = (WIDTH - LEFT - RIGHT) / Math.max(1, bars.length);
  const barW = slot * 0.62;
  const y = (value: number) => TOP + PLOT_H - (Math.max(0, value) / max) * PLOT_H;
  const ticks = [0, max / 2, max];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={label} className="h-auto w-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={GRADIENT[tone].from} />
            <stop offset="100%" stopColor={GRADIENT[tone].to} />
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
          return (
            <g key={bar.year}>
              {bar.value > 0 && (
                <rect
                  x={x}
                  y={top}
                  width={barW}
                  height={TOP + PLOT_H - top}
                  rx={2}
                  fill={bar.era === "pre" ? "var(--color-bar-pre2012)" : `url(#${gradientId})`}
                >
                  <title>{barTitle(bar)}</title>
                </rect>
              )}
              {yearTicks.includes(bar.year) && (
                <text
                  x={x + barW / 2}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  className={bar.year === markYear ? "fill-ink text-xs font-semibold" : "fill-muted text-xs"}
                >
                  {bar.year}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
