import { Navigate } from "react-router-dom";
import type { Insight, Meta, RegionSummary } from "../../api/types";
import { Button, ButtonLink } from "../../components/Button";
import { Breadcrumb, type Crumb } from "../../components/dashboard/Breadcrumb";
import { SectionError } from "../../components/SectionError";
import { useInsight } from "../../hooks/useInsight";
import { useRegions } from "../../hooks/useRegions";
import { useSeries } from "../../hooks/useSeries";
import { useLocale, useMessages } from "../../i18n";
import type { Country } from "../../lib/country";
import { dashboardPath } from "../../lib/dashboardPath";
import { errorKind } from "../../lib/errorKind";
import { formatMonth, formatMonthName } from "../../lib/format";
import { insightPath } from "../../lib/insightPath";
import type { Locale } from "../../lib/locale";
import { monthNumber, monthRange } from "../../lib/month";
import { indexRegions, ownName, regionPath } from "../../lib/region";
import { InsightMessage, InsightSectionsSkeleton, InsightSkeleton } from "./InsightSkeleton";
import type { InsightScope } from "./scope";
import { InsightSections } from "./sections/InsightSections";

type InsightBodyProps = { country: Country; regionId: string; monthParam: string | undefined; meta: Meta };

/**
 * `/regions`와 나라 시계열(달 범위)로 지역과 달을 확인하고 `/insight`를 받아 구역에 나눈다.
 * - 시·군·구가 아니면 그 지역의 대시보드로, 주소에 달이 없으면 자료의 마지막 달로 보낸다.
 * - `/insight`가 처음부터 실패하면 에러 한 장, 받아 둔 자료가 있는데 다시 받다 실패하면 받아 둔 자료로 계속 그린다.
 * - 일부 실패(`unavailable`)는 위에 안내 띠. 구역은 자기 필드가 `null`인지만 본다(8-2).
 */
export function InsightBody({ country, regionId, monthParam, meta }: InsightBodyProps) {
  const t = useMessages();
  const locale = useLocale();
  const regions = useRegions(country);
  const series = useSeries(country, country);
  const index = regions.data === undefined ? null : indexRegions(regions.data.items);
  const region = index?.get(regionId);
  const isDistrict = region?.level === "dist";
  const insight = useInsight(country, isDistrict ? regionId : undefined, monthParam);

  const failed = [regions, series].filter((query) => query.data === undefined && query.isError);
  const firstFailed = failed[0];
  if (firstFailed !== undefined) {
    return (
      <InsightMessage>
        <SectionError kind={errorKind(firstFailed.error)} onRetry={() => failed.forEach((q) => void q.refetch())} className="w-full" />
      </InsightMessage>
    );
  }
  if (index === null || series.data === undefined) return <InsightSkeleton />;
  // 주소의 지역이 목록에 없다: 대시보드와 같은 안내 한 장과 대시보드 링크
  if (region === undefined) {
    return (
      <InsightMessage>
        <div role="alert" className="flex flex-col gap-4">
          <h1 className="text-title-lg text-ink">{t.dashboard.regionMissing.title}</h1>
          <p className="text-base text-muted">{t.dashboard.regionMissing.body}</p>
        </div>
        <ButtonLink to={dashboardPath(locale, country, null, monthParam)} variant="dark" size="lg">
          {t.insight.toDashboard}
        </ButtonLink>
      </InsightMessage>
    );
  }
  // 나라·시·도 ID면 백엔드는 400이다. 서버에 보내지 않고 그 지역의 대시보드로
  if (!isDistrict) return <Navigate to={dashboardPath(locale, country, region.id, monthParam)} replace />;
  const range = monthRange(series.data.months);
  if (monthParam === undefined) {
    if (range === null) return <InsightSkeleton />;
    return <Navigate to={insightPath(locale, country, region.id, range.last)} replace />;
  }

  const scope: InsightScope = {
    country,
    meta,
    index,
    region,
    month: monthParam,
    name: ownName(region, locale),
    monthLabel: formatMonth(monthParam, locale),
    monthName: formatMonthName(monthNumber(monthParam), locale),
    countryStatus: series.data.months.find((m) => m.month === monthParam)?.status ?? null,
    retry: () => void insight.refetch(),
  };

  return (
    <main className="flex flex-col gap-8 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <Breadcrumb items={crumbs(scope, locale)} />
        <ButtonLink to={dashboardPath(locale, country, region.id, monthParam)} size="sm" className="min-w-100">
          {t.insight.back}
        </ButtonLink>
      </div>
      {insight.data === undefined ? (
        insight.isError ? (
          <SectionError
            kind={errorKind(insight.error)}
            onRetry={scope.retry}
            action={<ButtonLink to={dashboardPath(locale, country, region.id, null)}>{t.insight.toDashboard}</ButtonLink>}
          />
        ) : (
          <InsightSectionsSkeleton />
        )
      ) : (
        <>
          <Notices
            insight={insight.data}
            refetchFailed={insight.isError && !insight.isFetching}
            fetching={insight.isFetching}
            onRetry={scope.retry}
          />
          <InsightSections scope={scope} insight={insight.data} />
        </>
      )}
    </main>
  );
}

/** 나라 → (시·도) → 시·군·구. 앞 단계는 같은 달 대시보드 링크, 마지막은 지금 위치 */
function crumbs(scope: InsightScope, locale: Locale): Crumb[] {
  const path: RegionSummary[] = regionPath(scope.region, scope.country, scope.meta.labels.single, scope.index);
  return path.map((r, i) => ({
    key: r.id,
    label: ownName(r, locale),
    href: i === path.length - 1 ? null : dashboardPath(locale, scope.country, r.level === "nat" ? null : r.id, scope.month),
  }));
}

type NoticesProps = { insight: Insight; refetchFailed: boolean; fetching: boolean; onRetry: () => void };

/** 일부 실패 안내 띠, 다시 받기 실패 안내 띠. 다시 받는 동안은 버튼을 잠근다 */
function Notices({ insight, refetchFailed, fetching, onRetry }: NoticesProps) {
  const t = useMessages();
  const messages = [refetchFailed ? t.insight.refetchFailed : null, insight.unavailable.length > 0 ? t.insight.partialFailure : null].filter(
    (m): m is string => m !== null,
  );
  if (messages.length === 0) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-tone-yellow px-6 py-4 text-sm text-tone-yellow-ink">
      <p>{messages.join(" ")}</p>
      <Button size="sm" onClick={onRetry} disabled={fetching}>
        {fetching ? t.common.loading : t.common.retry}
      </Button>
    </div>
  );
}
