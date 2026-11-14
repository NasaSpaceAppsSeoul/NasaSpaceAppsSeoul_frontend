import { axisTicks, BREAK_YEAR, type AnnualBar } from "../../lib/landing";
import { FigureDataTable } from "./FigureDataTable";

/*
 * 04절 연간 화재 칸 보정 전·후 (시안 `DRAW.ba`): 한 축에 두 선. 보정 전은 흐린 선, 보정 후는 주황 선.
 * 2012년 앞에 점선(센서 전환)과 이름, 마지막 해 오른쪽에 두 값. 점마다 `<title>`로 해와 값을 단다.
 * 두 선은 단위가 달라(보정 전은 위성마다 다른 원래 값, `H-landing.md` H-3) 크기 비교용이 아니다. 읽는 법은 판이 적는다.
 * 0은 "자료 없음"과 구분되지 않으므로(H-3) 그 해는 점을 찍지 않고 선을 끊는다(한쪽만 0인 해를 "보정이 지웠다"로 읽지 않게).
 * 그림 안 글자는 화면 읽기 프로그램에 전달되지 않아, 같은 값을 숨긴 표로 함께 둔다.
 * 첫 화면의 옛 `AnnualBarChart`(막대 두 판)와 모양이 달라 새로 그린다(시안 기법 페이지는 선 그래프).
 */
type AnnualLineChartProps = {
  bars: readonly AnnualBar[];
  label: string;
  beforeLabel: string;
  afterLabel: string;
  breakMark: string;
  yearHead: string;
  missing: string;
  format: (value: number) => string;
  pointTitle: (year: number, value: string) => string;
};

const X0 = 58;
const X1 = 636;
const YB = 268;
const YT = 18;
const FIRST_YEAR = 2001;
const LAST_YEAR = 2025;

type Pick = (bar: AnnualBar) => number;

export function AnnualLineChart(props: AnnualLineChartProps) {
  const { bars, label, beforeLabel, afterLabel, breakMark, yearHead, missing, format, pointTitle } = props;
  const ticks = axisTicks(bars.flatMap((bar) => [bar.before, bar.after]));
  const top = ticks.at(-1) ?? 1;
  const x = (year: number) => X0 + ((year - FIRST_YEAR) / (LAST_YEAR - FIRST_YEAR)) * (X1 - X0);
  const y = (value: number) => YB - (value / top) * (YB - YT);
  // 값이 0인 해에서 선을 끊는다: 그 해는 건너뛰고 다음 값은 새로 시작(M)
  const path = (pick: Pick) =>
    bars
      .map((bar, i) => {
        if (pick(bar) <= 0) return "";
        const prev = bars[i - 1];
        const start = prev === undefined || pick(prev) <= 0;
        return `${start ? "M" : "L"}${x(bar.year)} ${y(pick(bar))}`;
      })
      .join("");
  const before: Pick = (bar) => bar.before;
  const after: Pick = (bar) => bar.after;
  const last = bars.at(-1);
  const lastAfter = last !== undefined && last.after > 0 ? last.after : null;
  const lastBefore = last !== undefined && last.before > 0 ? last.before : null;
  // 마지막 값 두 개가 겹치지 않게 벌린다
  const gap =
    lastAfter !== null && lastBefore !== null && Math.abs(y(lastAfter) - y(lastBefore)) < 16 ? (lastAfter > lastBefore ? -8 : 8) : 0;
  const breakX = x(BREAK_YEAR - 0.5);
  const cell = (value: number) => (value > 0 ? format(value) : missing);

  return (
    <div>
      <ul className="mb-2.5 flex flex-wrap gap-4.5 text-[0.84375rem] text-muted">
        <li className="flex items-center gap-1.75">
          <span aria-hidden="true" className="h-0.75 w-4.5 rounded-full bg-muted" />
          {beforeLabel}
        </li>
        <li className="flex items-center gap-1.75">
          <span aria-hidden="true" className="h-0.75 w-4.5 rounded-full bg-fire" />
          {afterLabel}
        </li>
      </ul>
      <svg viewBox="0 0 720 300" className="block h-auto w-full" role="img" aria-label={label}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={X0} x2={X1} y1={y(tick)} y2={y(tick)} className="stroke-line" />
            <text x={X0 - 8} y={y(tick) + 4} textAnchor="end" fontSize={11.5} className="fill-muted">
              {format(tick)}
            </text>
          </g>
        ))}
        {[2001, 2005, 2010, 2015, 2020, 2025].map((year) => (
          <text key={year} x={x(year)} y={YB + 22} textAnchor="middle" fontSize={11.5} className="fill-muted">
            {year}
          </text>
        ))}
        <line x1={breakX} x2={breakX} y1={YT} y2={YB} strokeDasharray="3 4" className="stroke-ink opacity-45" />
        <text x={breakX + 8} y={YT + 12} fontSize={12} className="fill-muted">
          {breakMark}
        </text>
        <path d={path(before)} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-muted" />
        <path d={path(after)} fill="none" strokeWidth={2.5} strokeLinejoin="round" className="stroke-fire" />
        {bars.map((bar) => (
          <g key={bar.year}>
            {bar.before > 0 && (
              <circle cx={x(bar.year)} cy={y(bar.before)} r={3} className="fill-muted">
                <title>{`${beforeLabel} · ${pointTitle(bar.year, format(bar.before))}`}</title>
              </circle>
            )}
            {bar.after > 0 && (
              <circle cx={x(bar.year)} cy={y(bar.after)} r={3} className="fill-fire">
                <title>{`${afterLabel} · ${pointTitle(bar.year, format(bar.after))}`}</title>
              </circle>
            )}
          </g>
        ))}
        {last !== undefined && lastAfter !== null && (
          <text x={x(last.year) + 10} y={y(lastAfter) + 4 + gap} fontSize={12.5} fontWeight={600} className="fill-ink">
            {format(lastAfter)}
          </text>
        )}
        {last !== undefined && lastBefore !== null && (
          <text x={x(last.year) + 10} y={y(lastBefore) + 4 - gap} fontSize={12.5} className="fill-muted">
            {format(lastBefore)}
          </text>
        )}
      </svg>
      <FigureDataTable
        caption={label}
        head={[yearHead, beforeLabel, afterLabel]}
        rows={bars.map((bar) => ({ key: String(bar.year), cells: [String(bar.year), cell(bar.before), cell(bar.after)] }))}
      />
    </div>
  );
}
