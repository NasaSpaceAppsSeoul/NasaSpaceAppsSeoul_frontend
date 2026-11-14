import type { ReactNode } from "react";
import type { Insight } from "../../../api/types";
import { Button } from "../../../components/Button";
import { InsightPanel, InsightSection } from "../../../components/insight/InsightSection";
import { BarChart, type Bar } from "../../../components/insight/BarChart";
import { InsightTable } from "../../../components/insight/InsightTable";
import { SectionError } from "../../../components/SectionError";
import { useSeries } from "../../../hooks/useSeries";
import { useLocale, useMessages } from "../../../i18n";
import { formatFireDays } from "../../../lib/format";
import {
  detectedYears,
  needsCurrentYear,
  showSparseNote,
  withCurrentYear,
  yearsCount,
  yearSummary,
  type YearBar,
} from "../../../lib/insight";
import { niceMax } from "../../../lib/landing";
import { monthYear } from "../../../lib/month";
import type { InsightScope } from "../scope";

/*
 * 02 절 "다른 해의 같은 달": 같은 달 연도별 막대(왼쪽 그림 판)와 감지된 해 표(오른쪽, 판 없음).
 * 2026년 달은 `strip`에 올해가 없어 `/series?from=달&to=달`로 보충한다(스킬 `burnline-api` 12번, 8-5).
 * 개수("감지가 있던 해")는 보충 전 `strip`으로 센다(결정 ③). 순위는 쓰지 않는다(3-1).
 */
export function YearsSection({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const messages = useMessages();
  const t = messages.insight;
  const retryText = messages.common.retry;
  const year = monthYear(scope.month);
  const strip = insight.years.strip;
  const needs = needsCurrentYear(strip, year, insight.head.value);
  const current = useSeries(scope.country, needs ? scope.region.id : undefined, { from: scope.month, to: scope.month });
  const row = current.data?.months.find((m) => m.month === scope.month) ?? null;
  const bars = withCurrentYear(strip, year, row === null ? null : { value: row.value, status: row.status });

  const section = (children: ReactNode) => (
    <InsightSection id="years" index="02" title={t.years.eyebrow} lead={t.years.title(scope.monthName)}>
      {children}
    </InsightSection>
  );
  if (bars === null) return section(<SectionError kind="other" onRetry={scope.retry} />);

  return section(
    <div className="grid grid-cols-2 items-start gap-x-8 gap-y-6">
      <YearBars scope={scope} bars={bars} year={year} />
      <DetectedTable scope={scope} insight={insight} bars={bars} year={year} />
      {needs && current.isError && (
        <p role="alert" className="col-span-2 flex items-center gap-3 text-sm text-muted">
          {t.years.currentFailed}
          <Button size="sm" onClick={() => void current.refetch()}>
            {retryText}
          </Button>
        </p>
      )}
    </div>,
  );
}

function YearBars({ scope, bars, year }: { scope: InsightScope; bars: YearBar[]; year: number }) {
  const t = useMessages().insight;
  const locale = useLocale();
  const max = niceMax(bars.map((bar) => bar.v));
  const summary = yearSummary(bars, year);
  const chartBars: Bar[] = bars.map((bar) => ({
    key: String(bar.year),
    name: String(bar.year),
    value: bar.v,
    valueText: formatFireDays(bar.v, locale),
    title: `${bar.year} · ${formatFireDays(bar.v, locale)}${bar.partial ? ` · ${t.years.partialBar}` : ""}`,
    tone: bar.year === year ? "accent" : "base",
    partial: bar.partial,
  }));
  const from = summary?.from ?? year;
  const to = summary?.to ?? year;

  return (
    <InsightPanel>
      <p className="text-sm text-muted">{t.years.lead(from, to, scope.monthName, formatFireDays(max, locale))}</p>
      <BarChart label={t.years.chartLabel(scope.monthName)} bars={chartBars} max={max} formatTick={(v) => formatFireDays(v, locale)} />
      {summary !== null && (
        <div className="text-sm text-muted">
          <p>
            {summary.current !== null
              ? t.years.summary(year, scope.monthName, formatFireDays(summary.current, locale), summary.previousYears, formatFireDays(summary.previousSum, locale))
              : t.years.summaryAll(from, to, formatFireDays(summary.previousSum, locale))}
          </p>
          <p>{t.years.zeroNote}</p>
        </div>
      )}
      <p className="text-sm text-muted">{t.years.note(from, to, scope.monthName)}</p>
    </InsightPanel>
  );
}

function DetectedTable({ scope, insight, bars, year }: { scope: InsightScope; insight: Insight; bars: YearBar[]; year: number }) {
  const t = useMessages().insight;
  const locale = useLocale();
  const count = yearsCount(insight.years.strip);
  const rows = detectedYears(bars, year);

  return (
    <div className="flex flex-col gap-4">
      {/* 절 안의 작은 머리(판 없음): 이름 + 한 줄 */}
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-medium text-ink">{t.detected.title}</h3>
        {count !== null && <p className="text-sm text-muted">{t.detected.lead(count.total, count.detected)}</p>}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t.detected.empty}</p>
      ) : (
        <InsightTable
          framed
          caption={t.detected.eyebrow}
          head={[t.detected.year, t.detected.value(scope.monthName), t.detected.note]}
          rows={rows.map((r) => ({
            key: String(r.year),
            highlight: r.selected,
            cells: [r.year, formatFireDays(r.v, locale), r.selected ? t.detected.selected : t.detected.detected],
          }))}
        />
      )}
      {showSparseNote(insight.head.region_type) && <p className="text-sm text-muted">{t.detected.sparseNote}</p>}
    </div>
  );
}
