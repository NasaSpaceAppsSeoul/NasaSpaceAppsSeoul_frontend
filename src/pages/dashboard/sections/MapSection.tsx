import { useMemo, useRef, useState, type ReactNode } from "react";
import type { GeoFeature, MapResponse } from "../../../api/types";
import { Card, CardHeader } from "../../../components/Card";
import { MapCanvas, type MapCanvasHandle, type MapHover, type ZoomState } from "../../../components/map/MapCanvas";
import { MapLegend } from "../../../components/map/MapLegend";
import { MapPanel, PANEL_FIT_PADDING } from "../../../components/map/MapPanel";
import { MapToggles, type MapMode } from "../../../components/map/MapToggles";
import { MapUsualError, MapUsualLegend } from "../../../components/map/MapUsualLegend";
import { MapTooltip } from "../../../components/map/MapTooltip";
import { MapZoomControls } from "../../../components/map/MapZoomControls";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useBulkJudgement } from "../../../hooks/useBulkJudgement";
import { useGeo } from "../../../hooks/useGeo";
import { useMap } from "../../../hooks/useMap";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { formatCount, formatFireDays, formatMonth, formatRatio } from "../../../lib/format";
import {
  agedCells, dayDate, fillStates, pickFeatures, provinceBorders, usualFills, visibleRegionIds, type AgedCell, type BorderFeature,
} from "../../../lib/map";
import { usualHover, usualMonthState } from "../../../lib/mapUsual";
import { regionNameById } from "../../../lib/region";
import type { DashboardNavigate, DashboardScope } from "../scope";

/*
 * 나라 대시보드의 지도 (4장, `decisions.md` 5절). `/geo`(한 번)와 나라 전체 `/map`(달마다, 5-7)으로 그린다.
 * 시·도·시·군·구 화면의 지도는 `RegionMapSection`(5장).
 * 시·도 경계선은 시·군·구 도형에서 만든다(`provinceBorders`, 2026-11-14 사용자 선택 안 B). 시·도 원본 경계(`/geo?level=prov`)는
 * 시·군·구와 원본이 달라 어긋나므로 쓰지 않는다.
 * 화면이 `key={region.id}`로 그려 지역이 바뀌면 확대 상태가 처음으로 돌아간다. 언어를 바꿔도(`MapCanvas`의 `key={locale}`) 처음으로 돌아간다.
 */
type MapSectionProps = {
  scope: DashboardScope;
  navigate: DashboardNavigate;
  /** 보기 방식. 화면(`DashboardLayout`)이 들고 있어 지역·달을 바꿔도 유지된다 */
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
};

const START: ZoomState = { canZoomIn: true, canZoomOut: false, atStart: true };
const EMPTY: readonly GeoFeature[] = [];
const NO_BORDERS: readonly BorderFeature[] = [];
const NO_CELLS: readonly AgedCell[] = [];

export function MapSection({ scope, navigate, mode, onModeChange }: MapSectionProps) {
  const t = useMessages();
  const locale = useLocale();
  const { country, region, index, month, meta } = scope;
  const geo = useGeo(country, { level: "dist" });
  const map = useMap(country, month);
  const usual = mode === "usual";
  // 평소 대비: 집계 중·2012-02 전 달은 평가하지 않으므로 받지도 않는다(숫자 카드가 칩을 숨기는 것과 같은 기준)
  const monthState = usualMonthState(month, scope.range, scope.countrySeries.months);
  const bulk = useBulkJudgement(country, month, usual && monthState === "judged");
  const canvas = useRef<MapCanvasHandle>(null);
  const [zoom, setZoom] = useState<ZoomState>(START);
  // 올린 자리를 어느 응답으로 그렸는지 함께 둔다. 달이 바뀌어 응답이 바뀌면 지난 응답의 점 순번을 쓰지 않는다
  const [hover, setHover] = useState<{ at: MapHover; data: MapResponse | undefined } | null>(null);

  const outOfRange = map.isError && errorKind(map.error) === "range";
  const features = geo.data?.features ?? EMPTY;
  const visible = useMemo(() => {
    const ids = visibleRegionIds(features, region);
    return { list: ids, ...pickFeatures(features, ids) };
  }, [features, region]);
  const fills = useMemo(
    () =>
      usual
        ? usualFills(visible.list, bulk.data?.regions, monthState === "judged")
        : fillStates(visible.list, map.data?.regions),
    [usual, visible.list, bulk.data, monthState, map.data],
  );
  // 나라 화면은 경계 밖·경계가 없는 구역의 점까지 모두 그린다(E-1 "전체 점"). 평소 대비 보기는 점 없이 면만
  const allCells = useMemo(() => agedCells(map.data?.points.items ?? []), [map.data]);
  const cells = usual ? NO_CELLS : allCells;
  // 시·도 단계가 없는 나라(CAL·BC)는 시·도 경계선이 없다
  const single = meta.labels.single;
  const borders = useMemo(() => (single ? NO_BORDERS : [provinceBorders(visible.features)]), [single, visible.features]);
  const data = map.data;
  const usualNotes: string[] = [];
  if (monthState === "partial") usualNotes.push(t.map.usual.partial);
  if (monthState === "pre2012") usualNotes.push(t.map.usual.pre2012);
  if (monthState === "outOfRange") usualNotes.push(t.map.notes.outOfRange);
  const bulkFailedKind = usual && bulk.isError && bulk.data === undefined ? errorKind(bulk.error) : null;
  const notes: string[] = [];
  if (outOfRange) notes.push(t.map.notes.outOfRange);
  // 새 달을 받는 동안(지난 달을 흐리게 보이는 동안)은 지난 달의 안내를 보이지 않는다
  if (data !== undefined && !map.isPlaceholderData && data.points.shown < data.points.count) {
    notes.push(t.map.notes.sample(formatCount(data.points.count, locale), formatCount(data.points.shown, locale)));
  }
  if (data !== undefined && !map.isPlaceholderData && data.regions.some((r) => r.reason === "PRE_2012_DISTRICT")) notes.push(t.map.notes.pre2012(data.points.sensor));

  const title = usual ? t.map.usual.title(formatMonth(month, locale)) : t.map.title(formatMonth(month, locale));
  const sub = usual ? t.map.usual.sub : t.map.sub;
  // 에러는 일반 카드로(지도가 없으니 떠 있는 판도 없다)
  const frame = (body: ReactNode) => (
    <Card className="flex flex-col gap-4">
      <CardHeader title={title} sub={sub} />
      <MapToggles mode={mode} onChange={onModeChange} />
      {body}
    </Card>
  );
  const header = (
    <>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-medium text-ink">{title}</h2>
        <p className="text-xs text-muted">{sub}</p>
      </div>
      <MapToggles mode={mode} onChange={onModeChange} />
      {bulkFailedKind !== null && <MapUsualError kind={bulkFailedKind} onRetry={() => void bulk.refetch()} />}
    </>
  );
  // 처음부터 받지 못한 것만 에러로(범위 밖 달은 빈 지도와 안내, 5-9)
  // 일괄 판정 실패는 범례에서 알린다(지도와 보기 전환은 남는다)
  const failed = [geo, ...(outOfRange ? [] : [map])].filter((q) => q.isError && q.data === undefined);
  const firstFailed = failed[0];
  if (firstFailed !== undefined) {
    return frame(<SectionError kind={errorKind(firstFailed.error)} onRetry={() => failed.forEach((q) => void q.refetch())} />);
  }
  // 로딩 자리는 지도 카드와 같은 크기로 그려 다 받은 뒤 높이가 출렁이지 않게 한다
  if (geo.data === undefined || (map.data === undefined && !outOfRange)) {
    return <Skeleton className="min-h-155 w-full rounded-card" />;
  }

  const name = (id: string) => regionNameById(id, id, index, locale);
  const tooltip = (() => {
    if (hover === null || hover.data !== map.data) return null;
    const h = hover.at;
    // 오른쪽 절반은 왼쪽으로, 위쪽 1/4은 아래로 띄워 카드 밖·머리글을 덮지 않게 한다
    const at = { x: h.x, y: h.y, flipX: h.x > h.width / 2, below: h.y < h.height / 4 };
    if (h.kind === "point") {
      const cell = cells[h.index];
      if (cell === undefined || data === undefined) return null;
      // 경계 밖 점은 이름 줄 없이 날짜만(설계 9절). 날짜는 그 점을 받은 응답의 달로 만든다
      const title = cell.regionId === null ? null : name(cell.regionId);
      return { ...at, title, label: t.map.tooltip.firstDetected, value: dayDate(data.month, cell.firstDay) };
    }
    if (usual) {
      const u = t.map.usual.tooltip;
      // 평가를 아직 모르거나(받는 중·다른 달 값을 보이는 중) 받지 못했으면 "평가 없음"으로 읽히지 않게 툴팁을 띄우지 않는다
      if (monthState === "judged" && (bulk.data === undefined || bulk.isPlaceholderData)) return null;
      const v = usualHover(monthState === "judged" && !bulk.isPlaceholderData ? bulk.data?.regions.find((x) => x.id === h.id) : undefined);
      const text =
        v.kind === "own"
          ? v.ratio !== null
            ? u.ratio(t.chip[v.chip], formatRatio(v.ratio, locale))
            : t.chip[v.chip]
          : v.kind === "borrowed"
            ? u.borrowed(name(v.refId), t.chip[v.chip])
            : u.none;
      return { ...at, title: name(h.id), label: null, value: text };
    }
    const value = data?.regions.find((r) => r.id === h.id)?.value ?? null;
    const text = value === null ? t.map.tooltip.noValue : t.map.tooltip.cells(formatFireDays(value, locale));
    return { ...at, title: name(h.id), label: null, value: text };
  })();

  return (
    <MapPanel
      header={header}
      dimmed={usual ? bulk.isPlaceholderData || bulk.isLoading : map.isPlaceholderData}
      map={
        // 휠 안내 문구는 지도를 만들 때 한 번만 쓰므로 언어가 바뀌면 지도를 새로 만든다(`/`와 `/en`은 같은 자리에 그려진다)
        <MapCanvas
          key={locale}
          ref={canvas}
          features={visible.features}
          featureKey={visible.key}
          fills={fills}
          outlines={borders}
          gestureHelp={t.map.gestureHelp}
          selectedId={null}
          cells={cells}
          fallbackBounds={region.bbox}
          fitPadding={PANEL_FIT_PADDING}
          label={usual ? t.map.usual.canvasLabel(title, visible.list.length) : t.map.canvasLabel(title, visible.list.length, cells.length)}
          onRegionClick={(id) => id !== region.id && navigate.toRegion(id)}
          onHover={(at) => setHover(at === null ? null : { at, data: map.data })}
          onZoomChange={setZoom}
        />
      }
      zoom={
        <MapZoomControls
          state={zoom}
          onZoomIn={() => canvas.current?.zoomIn()}
          onZoomOut={() => canvas.current?.zoomOut()}
          onReset={() => canvas.current?.reset()}
        />
      }
      legend={
        usual ? (
          <MapUsualLegend
            notes={usualNotes}
            orientation="vertical"
          />
        ) : (
          <MapLegend bins={meta.labels.bins} showSelected={false} notes={notes} orientation="vertical" />
        )
      }
      legendLabel={t.map.legend.toggle}
      hint={t.map.hint}
      attribution={t.map.attribution.line(t.map.attribution.boundary[country], t.map.attribution.time[meta.time_basis.code])}
      tooltip={tooltip !== null && <MapTooltip {...tooltip} />}
    />
  );
}
