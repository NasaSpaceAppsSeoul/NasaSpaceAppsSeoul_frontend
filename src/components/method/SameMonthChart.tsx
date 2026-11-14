import { axisTicks } from "../../lib/landing";
import type { SameMonthBar, SameMonthChip } from "../../lib/methodFigures";

/*
 * 06절 같은 달 연도별 값 (시안 `DRAW.band`): 해마다 막대 하나(색 = 그해 칩), 보통 범위 음영, 평년(중앙값) 점선,
 * 오른쪽에 범위 위·평년·아래 값, 최고 기록 막대 옆에 한 줄. 칩은 `lib/methodFigures`가 백엔드 규칙으로 정한다.
 * 막대마다 `<title>`로 해·값·칩을 단다. 범위 값이 없으면 음영·점선·오른쪽 값 없이 막대만.
 */
type SameMonthChartProps = {
  bars: readonly SameMonthBar[];
  band: { median: number | null; low: number | null; high: number | null } | null;
  label: string;
  format: (value: number) => string;
  chipName: Readonly<Record<SameMonthChip, string>>;
  barTitle: (year: number, value: string, chip: string) => string;
  /** 최고 기록 막대 옆 한 줄(없으면 쓰지 않는다) */
  recordNote: string | null;
  bandLabels: { high: (v: string) => string; median: (v: string) => string; low: (v: string) => string };
};

const BAR_CLASS: Record<SameMonthChip, string> = {
  record: "fill-chip-record",
  above: "fill-chip-above-ink",
  normal: "fill-chip-normal-ink",
  below: "fill-chip-below-ink",
};

const X0 = 58;
const X1 = 610;
const YB = 262;
const YT = 16;

export function SameMonthChart(props: SameMonthChartProps) {
  const { bars, band, label, format, chipName, barTitle, recordNote, bandLabels } = props;
  const ticks = axisTicks([...bars.map((bar) => bar.value), band?.high ?? 0]);
  const top = ticks.at(-1) ?? 1;
  const y = (value: number) => YB - (Math.min(value, top) / top) * (YB - YT);
  const width = (X1 - X0) / Math.max(1, bars.length);
  const low = band?.low === null || band?.low === undefined ? null : Math.max(0, band.low);
  const high = band?.high ?? null;
  const median = band?.median ?? null;
  const recordIndex = bars.findIndex((bar) => bar.chip === "record");
  const record = bars[recordIndex];

  // 오른쪽 값 세 줄: 가까우면 14씩 벌린다
  const side = [
    high === null ? null : { key: "high", y: y(high), text: bandLabels.high(format(high)), strong: false },
    median === null ? null : { key: "median", y: y(median), text: bandLabels.median(format(median)), strong: true },
    low === null ? null : { key: "low", y: y(low), text: bandLabels.low(format(low)), strong: false },
  ].filter((item) => item !== null);
  for (let i = 1; i < side.length; i += 1) {
    const prev = side[i - 1];
    const cur = side[i];
    if (prev !== undefined && cur !== undefined && cur.y - prev.y < 14) cur.y = prev.y + 14;
  }

  return (
    <svg viewBox="0 0 720 290" className="block h-auto w-full" role="img" aria-label={label}>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={X0} x2={X1} y1={y(tick)} y2={y(tick)} className="stroke-line" />
          <text x={X0 - 8} y={y(tick) + 4} textAnchor="end" fontSize={11.5} className="fill-muted">
            {format(tick)}
          </text>
        </g>
      ))}
      {low !== null && high !== null && (
        <rect x={X0} y={y(high)} width={X1 - X0} height={Math.max(2, y(low) - y(high))} className="fill-ink opacity-10" />
      )}
      {median !== null && (
        <line x1={X0} x2={X1} y1={y(median)} y2={y(median)} strokeDasharray="4 4" className="stroke-ink opacity-60" />
      )}
      {bars.map((bar, i) => (
        <g key={bar.year}>
          <rect
            x={X0 + i * width + 3}
            y={y(bar.value)}
            width={Math.max(1, width - 6)}
            height={Math.max(1, YB - y(bar.value))}
            rx={2}
            className={BAR_CLASS[bar.chip]}
          >
            <title>{barTitle(bar.year, format(bar.value), chipName[bar.chip])}</title>
          </rect>
          {bar.year % 4 === 1 && (
            <text x={X0 + i * width + width / 2} y={YB + 20} textAnchor="middle" fontSize={11.5} className="fill-muted">
              {bar.year}
            </text>
          )}
        </g>
      ))}
      {record !== undefined && recordNote !== null && (
        // 최고 기록은 가장 높은 막대라 그 위에 두면 다른 막대와 겹치지 않는다. 오른쪽 절반이면 끝을 막대에 맞춘다
        <text
          x={recordIndex > bars.length / 2 ? X0 + (recordIndex + 1) * width - 3 : X0 + recordIndex * width + 3}
          y={Math.max(YT - 4, y(record.value) - 8)}
          textAnchor={recordIndex > bars.length / 2 ? "end" : "start"}
          fontSize={12.5}
          fontWeight={600}
          className="fill-ink"
        >
          {recordNote}
        </text>
      )}
      {side.map((item) => (
        <text key={item.key} x={X1 + 10} y={item.y + 4} fontSize={11.5} className={item.strong ? "fill-ink" : "fill-muted"}>
          {item.text}
        </text>
      ))}
    </svg>
  );
}
