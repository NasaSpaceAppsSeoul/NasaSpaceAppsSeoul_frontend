import type { ReactNode } from "react";
import type { Insight } from "../../../api/types";
import { Button } from "../../../components/Button";
import { InsightFigureRow, InsightPanel, InsightSection } from "../../../components/insight/InsightSection";
import { BarChart, type Bar } from "../../../components/insight/BarChart";
import { SectionError } from "../../../components/SectionError";
import { useSeries } from "../../../hooks/useSeries";
import { useLocale, useMessages } from "../../../i18n";
import { formatFireDays } from "../../../lib/format";
import {
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
 * 02 절 "다른 해의 같은 달": 같은 달 연도별 막대(왼쪽)와 설명 글(오른쪽, 04·05 절과 같은 그림 | 글 두 칸).
 * 예전 "감지된 해" 표는 막대와 같은 숫자를 다시 나열해 뺐다(2026-11-15 사용자). 개수 한 줄과 드문 지역 안내는 글 칸에 남긴다.
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
    <div className="flex flex-col gap-6">
      <YearBars scope={scope} insight={insight} bars={bars} year={year} />
      {needs && current.isError && (
        <p role="alert" className="flex items-center gap-3 text-sm text-muted">
          {t.years.currentFailed}
          <Button size="sm" onClick={() => void current.refetch()}>
            {retryText}
          </Button>
        </p>
      )}
    </div>,
  );
}

function YearBars({ scope, insight, bars, year }: { scope: InsightScope; insight: Insight; bars: YearBar[]; year: number }) {
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
  const count = yearsCount(insight.years.strip);

  return (
    <InsightFigureRow
      figure={
        <InsightPanel>
          <BarChart label={t.years.chartLabel(scope.monthName)} bars={chartBars} max={max} formatTick={(v) => formatFireDays(v, locale)} />
        </InsightPanel>
      }
      aside={
        <>
          <p>{t.years.lead(from, to, scope.monthName, formatFireDays(max, locale))}</p>
          {count !== null && <p className="text-ink">{t.detected.countLine(count.total, count.detected)}</p>}
          {summary !== null && (
            <>
              <p>
                {summary.current !== null
                  ? t.years.summary(year, scope.monthName, formatFireDays(summary.current, locale), summary.previousYears, formatFireDays(summary.previousSum, locale))
                  : t.years.summaryAll(from, to, formatFireDays(summary.previousSum, locale))}
              </p>
              <p>{t.years.zeroNote}</p>
            </>
          )}
          <p>{t.years.note(from, to, scope.monthName)}</p>
          {showSparseNote(insight.head.region_type) && <p>{t.detected.sparseNote}</p>}
        </>
      }
    />
  );
}
