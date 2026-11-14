import { useMemo } from "react";
import { Card, CardHeader } from "../../../components/Card";
import { MonthlyLineChart, type MonthlyChartText } from "../../../components/dashboard/MonthlyLineChart";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useBaseline } from "../../../hooks/useBaseline";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { formatFireDays, formatMonth, formatMonthShort } from "../../../lib/format";
import { makeMonth, monthNumber, monthYear } from "../../../lib/month";
import { monthlyChartData } from "../../../lib/monthlyChart";
import type { DashboardScope } from "../scope";

/*
 * 나라 화면 월별 선 그래프 (5장, `plans/dashboard-sections.md` 4-2·4-3).
 * 그 해 = 주소의 달의 해. 값은 이미 받은 나라 시계열(`scope.countrySeries`), 중앙값·보통 해 범위는 `/baseline/{나라}`.
 * 자료 마지막 달 뒤는 "아직 집계 전". 선택한 달은 점을 크게.
 */
export function MonthlySection({ scope }: { scope: DashboardScope }) {
  const t = useMessages();
  const m = t.dashboard.monthly;
  const locale = useLocale();
  const { country, region, month, range, countrySeries } = scope;
  const baseline = useBaseline(country, region.id);
  const year = monthYear(month);

  const chart = useMemo(
    () => (baseline.data === undefined ? null : monthlyChartData(countrySeries.months, baseline.data.by_month, year, range.last)),
    [baseline.data, countrySeries.months, year, range.last],
  );
  const text = useMemo(
    (): MonthlyChartText => ({
      monthLabel: (n) => formatMonthShort(n, locale),
      tooltipTitle: (n) => formatMonth(makeMonth(year, n), locale),
      value: (v) => formatFireDays(v, locale),
      yearLabel: String(year),
      unit: t.dashboard.unit,
      ...m.tooltip,
    }),
    [locale, year, m.tooltip, t.dashboard.unit],
  );

  const period = baseline.data === undefined ? "" : `${baseline.data.period[0]}–${baseline.data.period[1]}`;
  const header = <CardHeader title={m.title(year)} sub={baseline.data === undefined ? undefined : m.sub(period)} />;

  if (baseline.data === undefined) {
    if (baseline.isError) {
      return (
        <Card>
          {header}
          <SectionError kind={errorKind(baseline.error)} onRetry={() => void baseline.refetch()} />
        </Card>
      );
    }
    return <Skeleton className="h-104 w-full" />;
  }
  if (chart === null) {
    return (
      <Card>
        {header}
        <p className="text-sm text-muted">{m.empty}</p>
      </Card>
    );
  }

  const n = (v: number | null) => (v === null ? m.tooltip.noValue : formatFireDays(v, locale));
  return (
    <Card className="flex flex-col">
      {header}
      <MonthlyLineChart points={chart.points} selectedMonth={monthNumber(month)} text={text} />
      <ul className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="relative h-0.5 w-5 bg-bar-harmonized-to">
            <span className="absolute -top-1 left-1.5 size-2.5 rounded-full border-2 border-bar-harmonized-to bg-surface" />
          </span>
          {m.legendYear(year, chart.anyConverted)}
        </li>
        <li className="flex items-center gap-2">
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
      {/* 차트는 화면 읽기에서 숨기고 같은 값을 표로 둔다 */}
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
    </Card>
  );
}
