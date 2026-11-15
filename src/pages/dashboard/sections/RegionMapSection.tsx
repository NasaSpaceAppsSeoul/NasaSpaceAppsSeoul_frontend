import { useMemo, type ReactNode } from "react";
import type { GeoFeature } from "../../../api/types";
import { SectionHeading } from "../../../components/about/SectionHeading";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { MapToggles, type MapMode } from "../../../components/map/MapToggles";
import { MapUsualError, MapUsualLegend } from "../../../components/map/MapUsualLegend";
import { RegionMap, type RegionMapHover } from "../../../components/map/RegionMap";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useBulkJudgement } from "../../../hooks/useBulkJudgement";
import { useGeo } from "../../../hooks/useGeo";
import { useMap } from "../../../hooks/useMap";
import { useRegionDetail } from "../../../hooks/useRegionDetail";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { andParticle, formatCount, formatFireDays, formatRatio } from "../../../lib/format";
import { agedCells, dayDate, fillStates, filterPoints, pickFeatures, usualFills, visibleRegionIds, type AgedCell } from "../../../lib/map";
import { usualHover, usualMonthState } from "../../../lib/mapUsual";
import { ownName, regionNameById } from "../../../lib/region";
import type { DashboardNavigate, DashboardScope } from "../scope";

/*
 * 시·도·시·군·구 대시보드의 지역 지도 (5장, `plans/dashboard-sections.md` 4-1·4-2·11절).
 * 시·도: 그 시·도의 시·군·구(선택 테두리 없음, 12절 ②). 시·군·구: 자기 + 맞닿은 지역(`/regions/{id}`의 `neighbors`, 5-8),
 * 자기에 파란 테두리. 값과 점은 나라 전체 `/map` 하나를 거른다(5-7, 단계를 오가도 같은 캐시).
 * 이웃을 받는 동안은 자리 표시(자기만 그렸다가 이웃이 오면 다시 맞추며 지도가 튀지 않게), 실패하면 자기만 그리고 안내.
 * 화면이 `key={region.id}`로 그린다.
 */
type RegionMapSectionProps = {
  scope: DashboardScope;
  navigate: DashboardNavigate;
  /** 보기 방식(화면이 들고 있다, 나라 지도와 같은 상태) */
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
};

const EMPTY: readonly GeoFeature[] = [];
const NO_NEIGHBORS: readonly string[] = [];
const NO_CELLS: readonly AgedCell[] = [];

export function RegionMapSection({ scope, navigate, mode, onModeChange }: RegionMapSectionProps) {
  const t = useMessages();
  const locale = useLocale();
  const { country, region, index, month, meta } = scope;
  const district = region.level === "dist";
  const geo = useGeo(country, { level: "dist" });
  const map = useMap(country, month);
  const detail = useRegionDetail(country, district ? region.id : undefined);
  const usual = mode === "usual";
  // 평소 대비: 나라 전체 일괄 판정 하나를 걸러 쓴다(나라 지도와 같은 캐시). 집계 중·2012-02 전 달은 받지 않는다
  const monthState = usualMonthState(month, scope.range, scope.countrySeries.months);
  const bulk = useBulkJudgement(country, month, usual && monthState === "judged");

  const outOfRange = map.isError && errorKind(map.error) === "range";
  const features = geo.data?.features ?? EMPTY;
  const neighborIds = useMemo(() => detail.data?.neighbors.map((n) => n.id) ?? NO_NEIGHBORS, [detail.data]);
  const visible = useMemo(() => {
    const ids = visibleRegionIds(features, region, neighborIds);
    return { list: ids, ...pickFeatures(features, ids) };
  }, [features, region, neighborIds]);
  const fills = useMemo(
    () =>
      usual
        ? usualFills(visible.list, bulk.data?.regions, monthState === "judged")
        : fillStates(visible.list, map.data?.regions),
    [usual, visible.list, bulk.data, monthState, map.data],
  );
  // 경계 밖 점(`region_id: null`)은 그리지 않는다. 평소 대비 보기는 점 없이 면만
  const allCells = useMemo(() => agedCells(filterPoints(map.data?.points.items ?? [], visible.ids, false)), [map.data, visible.ids]);
  const cells = usual ? NO_CELLS : allCells;

  const name = ownName(region, locale);
  const title = district
    ? t.map.regional.districtTitle(name, andParticle(name))
    : t.map.regional.provinceTitle(name, scope.levelNames.lv2);
  const frame = (body: ReactNode) => (
    <Card className="flex flex-col gap-6">
      <SectionHeading eyebrow={t.map.regional.eyebrow} title={title} lead={usual ? t.map.usual.sub : t.map.regional.sub} />
      <MapToggles mode={mode} onChange={onModeChange} />
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

  const usualNotes: string[] = [];
  if (monthState === "partial") usualNotes.push(t.map.usual.partial);
  if (monthState === "pre2012") usualNotes.push(t.map.usual.pre2012);
  if (monthState === "outOfRange") usualNotes.push(t.map.notes.outOfRange);
  const bulkFailedKind = usual && bulk.isError && bulk.data === undefined ? errorKind(bulk.error) : null;
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
    if (usual) {
      const u = t.map.usual.tooltip;
      // 평가를 아직 모르거나(받는 중·다른 달 값을 보이는 중) 받지 못했으면 "평가 없음"으로 읽히지 않게 툴팁을 띄우지 않는다
      if (monthState === "judged" && (bulk.data === undefined || bulk.isPlaceholderData)) return null;
      const v = usualHover(monthState === "judged" && !bulk.isPlaceholderData ? bulk.data?.regions.find((x) => x.id === hover.id) : undefined);
      const text =
        v.kind === "own"
          ? v.ratio !== null
            ? u.ratio(t.chip[v.chip], formatRatio(v.ratio, locale))
            : t.chip[v.chip]
          : v.kind === "borrowed"
            ? u.borrowed(nameOf(v.refId), t.chip[v.chip])
            : u.none;
      return { title: nameOf(hover.id), label: null, value: text };
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
          <p className="text-xs text-muted">{usual ? t.map.usual.sub : t.map.regional.sub}</p>
          <MapToggles mode={mode} onChange={onModeChange} />
        </div>
      }
      features={visible.features}
      featureKey={visible.key}
      fills={fills}
      cells={cells}
      selectedId={district ? region.id : null}
      bins={meta.labels.bins}
      notes={notes}
      notice={
        // 일괄 판정 실패는 머리 판 아래에(범례를 접어도 보인다)
        bulkFailedKind !== null ? (
          <>
            {notice}
            <MapUsualError kind={bulkFailedKind} onRetry={() => void bulk.refetch()} />
          </>
        ) : (
          notice
        )
      }
      legend={
        usual ? (
          <MapUsualLegend
            notes={usualNotes}
            orientation="vertical"
            showSelected={district}
          />
        ) : undefined
      }
      fallbackBounds={region.bbox}
      label={
        usual
          ? t.map.usual.canvasLabel(`${title} · ${t.map.modes.usual}`, visible.list.length)
          : t.map.canvasLabel(title, visible.list.length, cells.length)
      }
      dimmed={usual ? bulk.isPlaceholderData || bulk.isLoading : map.isPlaceholderData}
      describe={describe}
      onRegionClick={(id) => id !== region.id && navigate.toRegion(id)}
    />
  );
}
