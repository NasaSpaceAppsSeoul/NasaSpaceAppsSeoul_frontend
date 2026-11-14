import { useLocale, useMessages } from "../../i18n";
import { formatFireDays, formatMonthShort } from "../../lib/format";
import type { MonthlyChart } from "../../lib/monthlyChart";

/*
 * 월별 선 그래프 아래: 범례 줄(그 해 값·보통 해 범위·중앙값, 오른쪽 끝에 "N–12월: 아직 집계 전")과
 * 화면 읽기용 숨김 표(차트는 `aria-hidden`이라 같은 값을 표로 둔다). 값만 받는다(고정 문구는 `useMessages`, 1-6).
 */
type MonthlyChartFooterProps = {
  chart: MonthlyChart;
  year: number;
  /** "2001–2025" */
  period: string;
};

export function MonthlyChartFooter({ chart, year, period }: MonthlyChartFooterProps) {
  const m = useMessages().dashboard.monthly;
  const locale = useLocale();
  const n = (v: number | null) => (v === null ? m.tooltip.noValue : formatFireDays(v, locale));
  return (
    <>
      <ul className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="relative h-0.5 w-5 bg-bar-harmonized-to">
            <span className="absolute -top-1 left-1.5 size-2.5 rounded-full border-2 border-bar-harmonized-to bg-surface" />
          </span>
          {m.legendYear(year, chart.anyConverted)}
        </li>
        <li className="flex items-center gap-2">
          {/* 범례 견본 모서리는 지도 범례(`MapLegend`)와 같은 2px */}
          <span aria-hidden="true" className="h-3 w-5 rounded-[2px] bg-bar-pre2012/55" />
          {m.legendBand(period)}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="w-5 border-t-2 border-dashed border-ink" />
          {m.legendMedian}
        </li>
        {/* 그래프 위에 겹치지 않게 범례 줄 오른쪽 끝에 둔다(어느 나라든 집계 전 달의 띠와 겹치지 않게) */}
        {chart.pendingFrom !== null && <li className="ml-auto">{m.pending(chart.pendingFrom)}</li>}
      </ul>
      <table className="sr-only">
        <caption>{m.tableCaption(year)}</caption>
        <thead>
          <tr>
            <th scope="col">{m.columns.month}</th>
            <th scope="col">{m.columns.value}</th>
            <th scope="col">{m.columns.median}</th>
            <th scope="col">{m.columns.band}</th>
          </tr>
        </thead>
        <tbody>
          {chart.points.map((p) => (
            <tr key={p.month}>
              <th scope="row">{formatMonthShort(p.month, locale)}</th>
              <td>
                {p.future
                  ? m.tooltip.future
                  : [n(p.value), p.value !== null && p.partial ? m.tooltip.partial : null, p.value !== null && p.converted ? m.tooltip.converted : null]
                      .filter((s) => s !== null)
                      .join(" · ")}
              </td>
              <td>{n(p.median)}</td>
              <td>{p.low === null || p.high === null ? m.tooltip.noValue : `${n(p.low)}–${n(p.high)}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
