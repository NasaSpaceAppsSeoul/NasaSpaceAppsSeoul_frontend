import { Button } from "../../../components/Button";
import { SeasonCard } from "../../../components/dashboard/SeasonCard";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useBaseline } from "../../../hooks/useBaseline";
import { useRegionDetail } from "../../../hooks/useRegionDetail";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { formatPercent } from "../../../lib/format";
import { peakMonth, riskMonthRuns } from "../../../lib/season";
import type { DashboardScope } from "../scope";

/*
 * 나라 화면 평소 화재 집중 시기 (5장, `plans/dashboard-sections.md` 4-2·11-9).
 * 달은 `/regions/{나라}`의 `risk_months`, 비중은 `risk_share`(없으면 그 구절을 뺀다),
 * 정점과 비교 기간은 `/baseline/{나라}`(히트맵과 같은 캐시). `/regions/{id}` 실패만 카드 에러,
 * `/baseline` 실패는 달은 그리고 정점·기간을 빼고 안내와 다시 시도.
 */
export function RiskSeasonSection({ scope }: { scope: DashboardScope }) {
  const t = useMessages();
  const s = t.dashboard.season;
  const locale = useLocale();
  const { country, region } = scope;
  const detail = useRegionDetail(country, region.id);
  const baseline = useBaseline(country, region.id);

  if (detail.data === undefined) {
    if (detail.isError) {
      return (
        // 집중 시기 칸과 같이 판 없이 제목 + 에러
        <section>
          <h2 className="mb-4 text-xl font-semibold text-ink">{s.title}</h2>
          <SectionError kind={errorKind(detail.error)} onRetry={() => void detail.refetch()} />
        </section>
      );
    }
    return <Skeleton className="h-52 w-full" />;
  }
  // 정점·기간은 `/baseline`이 오면 붙인다(받는 동안은 자리 표시)
  if (baseline.data === undefined && !baseline.isError) return <Skeleton className="h-52 w-full" />;

  const { risk_months: months, risk_share: share } = detail.data;
  const base = baseline.data;
  const runs = riskMonthRuns(months);
  const season = runs.length === 0 ? null : runs.map(([a, b]) => s.run(a, b)).join(", ");
  const peak = base === undefined ? null : peakMonth(months, base.by_month);
  const period = base === undefined ? null : `${base.period[0]}–${base.period[1]}`;
  // 위험 달이 없으면 정점을 구할 대상이 없어 `/baseline` 실패 안내도 내지 않는다
  const notice =
    base === undefined && months.length > 0 ? (
      <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-ink">
        <p>{s.partial}</p>
        <Button size="sm" onClick={() => void baseline.refetch()}>
          {t.common.retry}
        </Button>
      </div>
    ) : undefined;

  return (
    <SeasonCard
      title={s.title}
      sub={s.sub(share === null ? null : formatPercent(share, locale), period)}
      season={season}
      detail={months.length === 0 ? null : s.detail(s.count(months.length), peak)}
      note={s.note}
      empty={s.empty}
      notice={notice}
    />
  );
}
