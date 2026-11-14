import { Map as MapLibreMap, setWorkerUrl, type GeoJSONSource, type MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { useEffect, useEffectEvent, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { GeoFeature } from "../../api/types";
import { boundsOf, type AgeClass, type BorderFeature, type Bounds, type FillState } from "../../lib/map";
import {
  LAYER,
  NONE_BIN,
  POINTS_FROM,
  SOURCE,
  addLayers,
  applyPointZoom,
  applyStaticPoints,
  emptyStyle,
  readMapColors,
  type MapColors,
} from "./layers";

/*
 * MapLibre 래퍼. 인스턴스는 `ref`에 두고 생성·갱신·정리에만 `useEffect`를 쓴다(명령형 라이브러리 예외).
 * 대시보드 범위(scope)를 모르고 값만 받는다(7장 월간 인사이트가 다시 쓴다).
 * 도형은 `featureKey`가 바뀔 때만 다시 넣고 맞춘다. 달이 바뀌면 `setFeatureState`로 단계만 바꾼다(E-2).
 * MapLibre는 작업자 파일을 자기 모듈 주소 옆에서 찾는데, Vite가 묶으면 그 자리가 바뀐다. 작업자 파일(의존 없음)의
 * 주소를 직접 알려 준다.
 */
setWorkerUrl(workerUrl);
export type MapCell = { lon: number; lat: number; age: AgeClass };
/** `width`·`height`는 지도 영역 크기(툴팁을 어느 쪽으로 띄울지 정한다) */
export type MapHover = ({ kind: "region"; id: string } | { kind: "point"; index: number }) & {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type ZoomState = { canZoomIn: boolean; canZoomOut: boolean; atStart: boolean };
export type MapCanvasHandle = { zoomIn: () => void; zoomOut: () => void; reset: () => void };

type MapCanvasProps = {
  features: readonly GeoFeature[];
  /** 보이는 구역이 바뀌었는지 가리는 값(정렬한 ID를 이은 것). 바뀔 때만 도형을 다시 넣는다 */
  featureKey: string;
  fills: ReadonlyMap<string, FillState>;
  /** 시·도 경계선(`lib/map`의 `provinceBorders`). 없으면 그리지 않는다(지역 지도) */
  outlines?: readonly BorderFeature[];
  selectedId: string | null;
  cells: readonly MapCell[];
  /** 보이는 구역이 없을 때 맞출 상자(나라 상자) */
  fallbackBounds: Bounds | null;
  label: string;
  /**
   * 점 모양만 다르다. 확대·끌기(Ctrl·⌘+휠·핀치·끌기)는 둘 다 같다. 만들 때 한 번만 읽는다.
   * `national`(기본, 4장): 처음엔 점 대신 연기 번짐, 확대하면 점.
   * `regional`(5장 시·도·시·군·구, 7장): 처음부터 작은 점, 확대할수록 조금 커진다(2026-11-14 사용자 결정, `plans/dashboard-sections.md` 14절).
   */
  variant?: "national" | "regional";
  /**
   * 그냥 휠을 굴렸을 때 지도 위에 잠깐 뜨는 "Ctrl+휠로 확대" 안내(나라·지역 지도). 지도를 만들 때 한 번만 쓰므로
   * 언어가 바뀌면 쓰는 쪽이 `key`로 지도를 새로 만든다(`/`와 `/en`은 같은 자리에 그려져 다시 만들어지지 않는다)
   */
  gestureHelp?: { windows: string; mac: string; mobile: string };
  /** 구역을 눌렀을 때. 없으면 누름을 받지 않는다 */
  onRegionClick?: (id: string) => void;
  onHover: (hover: MapHover | null) => void;
  onZoomChange?: (state: ZoomState) => void;
  ref?: Ref<MapCanvasHandle>;
};

const ZOOM_RANGE = 4;
const EPSILON = 0.01;
const NO_OUTLINES: readonly BorderFeature[] = [];
const collection = (features: readonly unknown[]) => ({ type: "FeatureCollection" as const, features: [...features] });

export function MapCanvas(props: MapCanvasProps) {
  const { features, featureKey, fills, outlines = NO_OUTLINES, selectedId, cells, fallbackBounds, label, ref } = props;
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const startZoom = useRef(0);
  const startBounds = useRef<Bounds | null>(null);
  const [ready, setReady] = useState(false);
  const colorsRef = useRef<MapColors | null>(null);
  // 안내 문구는 지도를 만들 때 한 번만 쓴다(언어가 바뀌면 쓰는 쪽의 `key`로 지도를 새로 만든다, `gestureHelp` 설명)
  const [gestureHelp] = useState(props.gestureHelp);
  const [regional] = useState(props.variant === "regional");

  const reportZoom = useEffectEvent((map: MapLibreMap) => {
    const zoom = map.getZoom();
    props.onZoomChange?.({
      canZoomIn: zoom < map.getMaxZoom() - EPSILON,
      canZoomOut: zoom > startZoom.current + EPSILON,
      atStart: Math.abs(zoom - startZoom.current) < EPSILON,
    });
  });
  const hover = useEffectEvent((map: MapLibreMap, e: MapMouseEvent) => {
    // 나라 지도의 처음 크기에서는 점이 투명(연기 번짐)이라 올림을 받지 않는다. 점이 나타나기 시작하는 확대 단계와 맞춘다(`applyPointZoom`)
    const pointsShown = regional || map.getZoom() >= startZoom.current + POINTS_FROM;
    const point = pointsShown ? map.queryRenderedFeatures(e.point, { layers: [LAYER.points] })[0] : undefined;
    const region = map.queryRenderedFeatures(e.point, { layers: [LAYER.fill] })[0];
    const index = point?.properties.index;
    const id = region?.properties.id;
    // 누를 수 있는 구역에만 손가락 커서(누름 콜백이 있고, 지금 선택한 지역이 아닐 때)
    const clickable = typeof id === "string" && props.onRegionClick !== undefined && id !== selectedId;
    map.getCanvas().style.cursor = clickable ? "pointer" : "";
    const box = map.getContainer();
    const at = { x: e.point.x, y: e.point.y, width: box.clientWidth, height: box.clientHeight };
    if (typeof index === "number") props.onHover({ kind: "point", index, ...at });
    else if (typeof id === "string") props.onHover({ kind: "region", id, ...at });
    else props.onHover(null);
  });
  const click = useEffectEvent((map: MapLibreMap, e: MapMouseEvent) => {
    const id = map.queryRenderedFeatures(e.point, { layers: [LAYER.fill] })[0]?.properties.id;
    if (typeof id === "string") props.onRegionClick?.(id);
  });
  const leave = useEffectEvent(() => props.onHover(null));

  const fit = useEffectEvent((map: MapLibreMap) => {
    const b = boundsOf(features) ?? fallbackBounds;
    startBounds.current = b;
    if (b === null) return;
    map.setMaxBounds(null);
    map.setMinZoom(null);
    map.setMaxZoom(null);
    map.fitBounds(b, { padding: 16, animate: false });
    startZoom.current = map.getZoom();
    map.setMinZoom(startZoom.current);
    map.setMaxZoom(startZoom.current + ZOOM_RANGE);
    // 끌어서 나라가 지도 칸 밖으로 나가지 않게, 처음 맞춘 화면 범위 안으로 묶는다
    map.setMaxBounds(map.getBounds());
    if (regional) applyStaticPoints(map, startZoom.current);
    else if (colorsRef.current !== null) applyPointZoom(map, colorsRef.current, startZoom.current);
    reportZoom(map);
  });

  // 창 크기가 바뀌면 처음 크기·확대 범위·끌기 범위를 새 크기로 다시 정한다(좁아진 창에서 나라가 잘리지 않게).
  // 사용자가 확대해 둔 상태면 보던 곳과 확대 단계를 새 범위 안에서 그대로 둔다
  const resized = useEffectEvent((map: MapLibreMap) => {
    const atStart = Math.abs(map.getZoom() - startZoom.current) < EPSILON;
    const center = map.getCenter();
    const zoom = map.getZoom();
    fit(map);
    if (!atStart) map.jumpTo({ center, zoom: Math.min(Math.max(zoom, map.getMinZoom()), map.getMaxZoom()) });
    reportZoom(map);
  });

  // 생성과 정리
  useEffect(() => {
    const el = container.current;
    if (el === null) return;
    // 지도 위 Ctrl+휠·트랙패드 핀치는 페이지가 아니라 지도를 확대한다. 그냥 휠은 페이지 스크롤로 남기고 안내만 띄운다
    // (나라·지역 지도 모두, 2026-11-14 사용자 결정으로 지역 지도도 확대한다)
    const map = new MapLibreMap({
      container: el,
      style: emptyStyle(),
      attributionControl: false,
      cooperativeGestures: gestureHelp !== undefined,
      ...(gestureHelp !== undefined && {
        locale: {
          "CooperativeGesturesHandler.WindowsHelpText": gestureHelp.windows,
          "CooperativeGesturesHandler.MacHelpText": gestureHelp.mac,
          "CooperativeGesturesHandler.MobileHelpText": gestureHelp.mobile,
        },
      }),
      dragPan: true,
      scrollZoom: true,
      touchZoomRotate: true,
      doubleClickZoom: false,
      boxZoom: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      keyboard: false,
      renderWorldCopies: false,
    });
    map.touchZoomRotate.disableRotation();
    map.on("load", () => {
      // 키로 할 수 있는 일이 없으니 캔버스는 초점을 받지 않고, 뜻은 바깥 칸의 `aria-label`이 전한다
      const canvas = map.getCanvas();
      canvas.tabIndex = -1;
      canvas.setAttribute("aria-hidden", "true");
      const colors = readMapColors();
      colorsRef.current = colors;
      addLayers(map, colors);
      setReady(true);
    });
    map.on("zoomend", () => reportZoom(map));
    map.on("mousemove", (e) => hover(map, e));
    map.on("mouseout", () => leave());
    map.on("click", (e) => click(map, e));
    map.on("resize", () => resized(map));
    // Safari 트랙패드 핀치는 휠이 아니라 gesture 이벤트라 페이지 확대를 따로 막는다
    const blockPageZoom = (e: Event) => e.preventDefault();
    el.addEventListener("gesturestart", blockPageZoom);
    el.addEventListener("gesturechange", blockPageZoom);
    mapRef.current = map;
    return () => {
      el.removeEventListener("gesturestart", blockPageZoom);
      el.removeEventListener("gesturechange", blockPageZoom);
      map.remove();
      mapRef.current = null;
    };
  }, [gestureHelp]);


  // 보이는 구역이 바뀔 때만 도형을 넣고 맞춘다
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || map === null) return;
    map.getSource<GeoJSONSource>(SOURCE.regions)?.setData(collection(features));
    fit(map);
    // `features`는 `featureKey`가 같으면 같은 구역이다(올림·달 변경으로 처음 크기로 돌아가지 않게)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, featureKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || map === null) return;
    for (const [id, state] of fills) map.setFeatureState({ source: SOURCE.regions, id }, { bin: state === "none" ? NONE_BIN : state });
  }, [ready, featureKey, fills]);

  useEffect(() => {
    if (ready) mapRef.current?.setFilter(LAYER.selected, ["==", ["get", "id"], selectedId ?? ""]);
  }, [ready, selectedId]);

  useEffect(() => {
    if (ready) mapRef.current?.getSource<GeoJSONSource>(SOURCE.outlines)?.setData(collection(outlines));
  }, [ready, outlines]);

  useEffect(() => {
    if (!ready) return;
    const points = cells.map((c, index) => ({
      type: "Feature" as const,
      properties: { age: c.age, index },
      geometry: { type: "Point" as const, coordinates: [c.lon, c.lat] },
    }));
    mapRef.current?.getSource<GeoJSONSource>(SOURCE.points)?.setData(collection(points));
  }, [ready, cells]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn(),
    zoomOut: () => mapRef.current?.zoomOut(),
    reset: () => {
      const b = startBounds.current;
      if (b !== null) mapRef.current?.fitBounds(b, { padding: 16 });
    },
  }));

  // MapLibre CSS가 지도 칸에 `position: relative`를 주므로, 바깥 칸이 자리를 잡고 안쪽은 꽉 채운다
  return (
    <div className="absolute inset-0">
      <div ref={container} role="img" aria-label={label} className="h-full w-full" />
    </div>
  );
}
