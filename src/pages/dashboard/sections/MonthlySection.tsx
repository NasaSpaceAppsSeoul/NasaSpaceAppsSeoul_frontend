import { useMemo } from "react";
import { Card, CardHeader } from "../../../components/Card";
import { MonthlyChartFooter } from "../../../components/dashboard/MonthlyChartFooter";
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

  return (
    <Card className="flex flex-col">
      {header}
      <MonthlyLineChart points={chart.points} selectedMonth={monthNumber(month)} text={text} />
      <MonthlyChartFooter chart={chart} year={year} period={period} />
    </Card>
  );
}
