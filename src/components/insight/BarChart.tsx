import { useId } from "react";

/*
 * 인사이트의 막대 그래프 (screens/kr/insight.png의 "같은 달 연도별"과 "계절").
 * 강조 막대(`accent`)는 주황 그라데이션, 나머지는 회색. 막대 위 숫자, 세로축 눈금 0·절반·위 끝.
 * 집계 중 막대는 점선 테두리, `marked` 막대는 이름 아래 파란 점. SVG 좌표는 `viewBox` 단위다(소개 `AnnualBarChart`와 같은 방식).
 * 모양은 참고안 `.in-yb`(2026-11-15 디자이너): 회색 막대 #5e6167, 강조 막대는 주황 그라데이션(#f28a49 → #b64b1c)과 은은한 빛,
 * 0은 바닥의 얇은 눈금(#8e98a6), 집계 중은 채움 없이 점선(#f2c9a3), 눈금선은 흰 8% 점선·바닥선 흰 22%, 축·이름 글자는 Mono 10 #8e98a6.
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
          <stop offset="0%" stopColor="#f28a49" />
          <stop offset="100%" stopColor="#b64b1c" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={LEFT}
            x2={WIDTH - RIGHT}
            y1={y(tick)}
            y2={y(tick)}
            stroke={tick === 0 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)"}
            strokeDasharray={tick === 0 ? undefined : "3 3"}
            strokeWidth={1}
          />
          <text x={LEFT - 8} y={y(tick)} textAnchor="end" dominantBaseline="middle" className="fill-[#8e98a6] font-mono text-[10px]">
            {formatTick(tick)}
          </text>
        </g>
      ))}
      {bars.map((bar, i) => {
        const x = LEFT + i * slot + (slot - barW) / 2;
        const top = y(bar.value);
        const partial = bar.partial === true;
        const accent = bar.tone === "accent";
        // 0인 해는 바닥의 얇은 회색 눈금(참고 `is-zero`). 집계 중인 해는 채움 없이 점선 테두리(0이어도 2px 남긴다)
        const zero = bar.value <= 0 && !partial;
        return (
          <g key={bar.key}>
            <rect
              x={x}
              y={zero ? TOP + PLOT_H - 2 : Math.min(top, TOP + PLOT_H - 2)}
              width={barW}
              height={zero ? 2 : Math.max(2, TOP + PLOT_H - top)}
              rx={zero ? 1 : 3}
              fill={partial ? "transparent" : zero ? "#8e98a6" : accent ? `url(#${gradientId})` : "#5e6167"}
              stroke={partial ? "#f2c9a3" : undefined}
              strokeDasharray={partial ? "3 2" : undefined}
              // 강조 막대의 은은한 빛(참고 `box-shadow: 0 0 18px rgba(244,122,50,.18)`)
              style={accent && !partial && !zero ? { filter: "drop-shadow(0 0 9px rgba(244,122,50,0.18))" } : undefined}
            >
              <title>{bar.title}</title>
            </rect>
            <text x={x + barW / 2} y={top - 6} textAnchor="middle" className={`font-mono text-[10px] ${accent ? "fill-white" : "fill-[#c3cad4]"}`}>
              {bar.valueText}
            </text>
            <text x={x + barW / 2} y={HEIGHT - 14} textAnchor="middle" className={`font-mono text-[10px] ${accent ? "fill-white" : "fill-[#8e98a6]"}`}>
              {bar.name}
            </text>
            {bar.marked === true && <circle cx={x + barW / 2} cy={HEIGHT - 3} r={3} className="fill-action" />}
          </g>
        );
      })}
    </svg>
  );
}
