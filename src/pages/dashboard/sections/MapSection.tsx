import { useMemo, useRef, useState, type ReactNode } from "react";
import type { GeoFeature, MapResponse } from "../../../api/types";
import { Card, CardHeader } from "../../../components/Card";
import { MapCanvas, type MapCanvasHandle, type MapHover, type ZoomState } from "../../../components/map/MapCanvas";
import { MapLegend } from "../../../components/map/MapLegend";
import { MapToggles } from "../../../components/map/MapToggles";
import { MapTooltip } from "../../../components/map/MapTooltip";
import { MapZoomControls } from "../../../components/map/MapZoomControls";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useGeo } from "../../../hooks/useGeo";
import { useMap } from "../../../hooks/useMap";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { formatCount, formatFireDays, formatMonth } from "../../../lib/format";
import { agedCells, dayDate, fillStates, pickFeatures, provinceBorders, visibleRegionIds, type BorderFeature } from "../../../lib/map";
import { regionNameById } from "../../../lib/region";
import type { DashboardNavigate, DashboardScope } from "../scope";

/*
 * 나라 대시보드의 지도 (4장, `decisions.md` 5절). `/geo`(한 번)와 나라 전체 `/map`(달마다, 5-7)으로 그린다.
 * 시·도·시·군·구 화면의 지도는 `RegionMapSection`(5장).
 * 시·도 경계선은 시·군·구 도형에서 만든다(`provinceBorders`, 2026-11-14 사용자 선택 안 B). 시·도 원본 경계(`/geo?level=prov`)는
 * 시·군·구와 원본이 달라 어긋나므로 쓰지 않는다.
 * 화면이 `key={region.id}`로 그려 지역이 바뀌면 확대 상태가 처음으로 돌아간다. 언어를 바꿔도(`MapCanvas`의 `key={locale}`) 처음으로 돌아간다.
 */
type MapSectionProps = { scope: DashboardScope; navigate: DashboardNavigate };

const START: ZoomState = { canZoomIn: true, canZoomOut: false, atStart: true };
const EMPTY: readonly GeoFeature[] = [];
const NO_BORDERS: readonly BorderFeature[] = [];
const GRID = "grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center";

export function MapSection({ scope, navigate }: MapSectionProps) {
  const t = useMessages();
  const locale = useLocale();
  const { country, region, index, month, meta } = scope;
  const geo = useGeo(country, { level: "dist" });
  const map = useMap(country, month);
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
  const fills = useMemo(() => fillStates(visible.list, map.data?.regions), [visible.list, map.data]);
  // 나라 화면은 경계 밖·경계가 없는 구역의 점까지 모두 그린다(E-1 "전체 점")
  const cells = useMemo(() => agedCells(map.data?.points.items ?? []), [map.data]);
  // 시·도 단계가 없는 나라(CAL·BC)는 시·도 경계선이 없다
  const single = meta.labels.single;
  const borders = useMemo(() => (single ? NO_BORDERS : [provinceBorders(visible.features)]), [single, visible.features]);
  const data = map.data;
  const notes: string[] = [];
  if (outOfRange) notes.push(t.map.notes.outOfRange);
  // 새 달을 받는 동안(지난 달을 흐리게 보이는 동안)은 지난 달의 안내를 보이지 않는다
  if (data !== undefined && !map.isPlaceholderData && data.points.shown < data.points.count) {
    notes.push(t.map.notes.sample(formatCount(data.points.count, locale), formatCount(data.points.shown, locale)));
  }
  if (data !== undefined && !map.isPlaceholderData && data.regions.some((r) => r.reason === "PRE_2012_DISTRICT")) notes.push(t.map.notes.pre2012(data.points.sensor));

  const title = t.map.title(formatMonth(month, locale));
  const frame = (body: ReactNode) => (
    <Card className="flex flex-col gap-4">
      <CardHeader title={title} sub={t.map.sub} />
      {body}
    </Card>
  );
  // 처음부터 받지 못한 것만 에러로(범위 밖 달은 빈 지도와 안내, 5-9)
  const failed = [geo, ...(outOfRange ? [] : [map])].filter((q) => q.isError && q.data === undefined);
  const firstFailed = failed[0];
  if (firstFailed !== undefined) {
    return frame(<SectionError kind={errorKind(firstFailed.error)} onRetry={() => failed.forEach((q) => void q.refetch())} />);
  }
  // 로딩 자리는 실제 배치(전환 줄, 지도 3 : 범례 2)와 같게 그려 다 받은 뒤 높이가 출렁이지 않게 한다
  if (geo.data === undefined || (map.data === undefined && !outOfRange)) {
    return frame(
      <>
        <Skeleton className="h-10 w-full" />
        <div className={GRID}>
          <div className="flex flex-col gap-2">
            <Skeleton className="aspect-square w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </>,
    );
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
    const value = data?.regions.find((r) => r.id === h.id)?.value ?? null;
    const text = value === null ? t.map.tooltip.noValue : t.map.tooltip.cells(formatFireDays(value, locale));
    return { ...at, title: name(h.id), label: null, value: text };
  })();

  return frame(
    <>
      <MapToggles />
      <div className={GRID}>
        <div className="flex flex-col gap-2">
          <div className={`relative aspect-square w-full transition-opacity ${map.isPlaceholderData ? "opacity-60" : ""}`}>
            {/* 휠 안내 문구는 지도를 만들 때 한 번만 쓰므로 언어가 바뀌면 지도를 새로 만든다(`/`와 `/en`은 같은 자리에 그려진다) */}
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
              label={t.map.canvasLabel(title, visible.list.length, cells.length)}
              onRegionClick={(id) => id !== region.id && navigate.toRegion(id)}
              onHover={(at) => setHover(at === null ? null : { at, data: map.data })}
              onZoomChange={setZoom}
            />
            <div className="absolute top-0 right-0">
              <MapZoomControls
                state={zoom}
                onZoomIn={() => canvas.current?.zoomIn()}
                onZoomOut={() => canvas.current?.zoomOut()}
                onReset={() => canvas.current?.reset()}
              />
            </div>
            {tooltip !== null && <MapTooltip {...tooltip} />}
          </div>
          <p className="text-right text-xs text-muted">{t.map.hint}</p>
        </div>
        <MapLegend bins={meta.labels.bins} showSelected={false} notes={notes} orientation="vertical" />
      </div>
    </>,
  );
}
