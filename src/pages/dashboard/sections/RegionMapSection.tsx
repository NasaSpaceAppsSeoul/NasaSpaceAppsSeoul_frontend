import { useMemo, type ReactNode } from "react";
import type { GeoFeature } from "../../../api/types";
import { SectionHeading } from "../../../components/about/SectionHeading";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { RegionMap, type RegionMapHover } from "../../../components/map/RegionMap";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useGeo } from "../../../hooks/useGeo";
import { useMap } from "../../../hooks/useMap";
import { useRegionDetail } from "../../../hooks/useRegionDetail";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { andParticle, formatCount, formatFireDays } from "../../../lib/format";
import { agedCells, dayDate, fillStates, filterPoints, pickFeatures, visibleRegionIds } from "../../../lib/map";
import { ownName, regionNameById } from "../../../lib/region";
import type { DashboardNavigate, DashboardScope } from "../scope";

/*
 * 시·도·시·군·구 대시보드의 지역 지도 (5장, `plans/dashboard-sections.md` 4-1·4-2·11절).
 * 시·도: 그 시·도의 시·군·구(선택 테두리 없음, 12절 ②). 시·군·구: 자기 + 맞닿은 지역(`/regions/{id}`의 `neighbors`, 5-8),
 * 자기에 파란 테두리. 값과 점은 나라 전체 `/map` 하나를 거른다(5-7, 단계를 오가도 같은 캐시).
 * 이웃을 받는 동안은 자리 표시(자기만 그렸다가 이웃이 오면 다시 맞추며 지도가 튀지 않게), 실패하면 자기만 그리고 안내.
 * 화면이 `key={region.id}`로 그린다.
 */
type RegionMapSectionProps = { scope: DashboardScope; navigate: DashboardNavigate };

const EMPTY: readonly GeoFeature[] = [];
const NO_NEIGHBORS: readonly string[] = [];

export function RegionMapSection({ scope, navigate }: RegionMapSectionProps) {
  const t = useMessages();
  const locale = useLocale();
  const { country, region, index, month, meta } = scope;
  const district = region.level === "dist";
  const geo = useGeo(country, { level: "dist" });
  const map = useMap(country, month);
  const detail = useRegionDetail(country, district ? region.id : undefined);

  const outOfRange = map.isError && errorKind(map.error) === "range";
  const features = geo.data?.features ?? EMPTY;
  const neighborIds = useMemo(() => detail.data?.neighbors.map((n) => n.id) ?? NO_NEIGHBORS, [detail.data]);
  const visible = useMemo(() => {
    const ids = visibleRegionIds(features, region, neighborIds);
    return { list: ids, ...pickFeatures(features, ids) };
  }, [features, region, neighborIds]);
  const fills = useMemo(() => fillStates(visible.list, map.data?.regions), [visible.list, map.data]);
  // 경계 밖 점(`region_id: null`)은 그리지 않는다
  const cells = useMemo(() => agedCells(filterPoints(map.data?.points.items ?? [], visible.ids, false)), [map.data, visible.ids]);

  const name = ownName(region, locale);
  const title = district
    ? t.map.regional.districtTitle(name, andParticle(name))
    : t.map.regional.provinceTitle(name, scope.levelNames.lv2);
  const frame = (body: ReactNode) => (
    <Card className="flex flex-col gap-6">
      <SectionHeading eyebrow={t.map.regional.eyebrow} title={title} lead={t.map.regional.sub} />
      {body}
    </Card>
  );

  // 처음부터 받지 못한 것만 에러로(범위 밖 달은 빈 지도와 안내, 5-9). 이웃 실패는 지도 아래 안내로
  const failed = [geo, ...(outOfRange ? [] : [map])].filter((q) => q.isError && q.data === undefined);
  const firstFailed = failed[0];
  if (firstFailed !== undefined) {
    return frame(<SectionError kind={errorKind(firstFailed.error)} onRetry={() => failed.forEach((q) => void q.refetch())} />);
  }
  // 자리 표시는 처음 받을 때만. 실패한 뒤 다시 받는 동안은 자기만 그린 지도를 그대로 둔다(지도를 새로 만들지 않게)
  const waitingNeighbors = district && detail.isPending && detail.errorUpdatedAt === 0;
  if (geo.data === undefined || (map.data === undefined && !outOfRange) || waitingNeighbors) {
    // 지도 카드와 같은 크기로(다 받은 뒤 높이가 출렁이지 않게)
    return <Skeleton className="min-h-155 w-full rounded-card" />;
  }

  const data = map.data;
  const fresh = data !== undefined && !map.isPlaceholderData;
  const notes: string[] = [];
  if (outOfRange) notes.push(t.map.notes.outOfRange);
  // 나라 전체 `/map`을 거르므로 표본 숫자는 나라 전체 기준이라고 밝힌다(이 지역의 점 수가 아니다)
  if (fresh && data.points.shown < data.points.count) {
    const nation = regionNameById(country, country, index, locale);
    notes.push(t.map.regional.sample(nation, formatCount(data.points.count, locale), formatCount(data.points.shown, locale)));
  }
  if (fresh && data.regions.some((r) => r.reason === "PRE_2012_DISTRICT")) notes.push(t.map.notes.pre2012(data.points.sensor));

  const nameOf = (id: string) => regionNameById(id, id, index, locale);
  const describe = (hover: RegionMapHover) => {
    if (hover.kind === "point") {
      if (data === undefined) return null;
      return {
        title: hover.cell.regionId === null ? null : nameOf(hover.cell.regionId),
        label: t.map.tooltip.firstDetected,
        value: dayDate(data.month, hover.cell.firstDay),
      };
    }
    const value = data?.regions.find((r) => r.id === hover.id)?.value ?? null;
    return { title: nameOf(hover.id), label: null, value: value === null ? t.map.tooltip.noValue : t.map.tooltip.cells(formatFireDays(value, locale)) };
  };
  // 다시 해서 나아질 수 있는 에러(`offline`·`other`)만 "다시 시도"(`SectionError`와 같은 기준)
  // 받아 둔 이웃이 있으면 다시 받다 실패해도 그 이웃으로 그리고 안내하지 않는다
  const neighborsKind = detail.isError && detail.data === undefined ? errorKind(detail.error) : null;
  const notice =
    district && neighborsKind !== null ? (
      <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-ink">
        <p>{t.map.regional.neighborsFailed}</p>
        {(neighborsKind === "offline" || neighborsKind === "other") && (
          <Button size="sm" onClick={() => void detail.refetch()}>
            {t.common.retry}
          </Button>
        )}
      </div>
    ) : undefined;

  return (
    <RegionMap
      layout="panel"
      attribution={t.map.attribution.line(t.map.attribution.boundary[country], t.map.attribution.time[meta.time_basis.code])}
      header={
        <div className="flex flex-col gap-1">
          <p className="mono-overline text-action">{t.map.regional.eyebrow}</p>
          <h2 className="text-base font-medium text-ink">{title}</h2>
          <p className="text-xs text-muted">{t.map.regional.sub}</p>
        </div>
      }
      features={visible.features}
      featureKey={visible.key}
      fills={fills}
      cells={cells}
      selectedId={district ? region.id : null}
      bins={meta.labels.bins}
      notes={notes}
      notice={notice}
      fallbackBounds={region.bbox}
      label={t.map.canvasLabel(title, visible.list.length, cells.length)}
      dimmed={map.isPlaceholderData}
      describe={describe}
      onRegionClick={(id) => id !== region.id && navigate.toRegion(id)}
    />
  );
}
