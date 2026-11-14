import type { CanvasSource, Map as MapLibreMap } from "maplibre-gl";

/*
 * 지역 색 그라데이션 (2026-11-15 사용자): 지역마다 경계 쪽은 연하고 안쪽으로 갈수록 본래 단계 색이 되는 부드러운 면.
 * MapLibre의 면 칠하기는 한 면에 한 색뿐이라, 화면 크기 캔버스에 직접 그려 지도 위(면 위, 경계선 아래)에 얹는다.
 * 단계(1~4)마다: 그 단계 지역들의 경계를 밝은 같은 색 굵은 선으로 그리고 크게 흐린 뒤, 그 단계 지역 모양으로 잘라 낸다
 * (이웃 지역으로 번지지 않는다). 0단계(회색)·값 없음은 그리지 않는다.
 * 캔버스는 지금 화면과 그 둘레 여백을 덮고, 옮기기·확대가 끝날 때마다 다시 그린다(그 사이에는 지도와 함께 늘어나며 따라간다).
 * 다시 그릴 때 뚝 끊기지 않게(2026-11-15 사용자) 캔버스 두 장을 번갈아 쓴다: 쉬던 쪽에 새로 그리고, 새 것은 서서히 나타나고
 * 이전 것은 서서히 사라진다(`raster-opacity` 전환 0.3초).
 */

/** 번갈아 쓰는 두 장의 소스·층 이름 */
export const GLOW_LAYERS = [
  { source: "region-glow-canvas-a", layer: "region-glow-a" },
  { source: "region-glow-canvas-b", layer: "region-glow-b" },
] as const;
export const GLOW_OPACITY = 0.85;
/** 새 그림이 나타나고 이전 그림이 사라지는 시간(ms) */
export const GLOW_FADE_MS = 300;

type Ring = readonly (readonly [number, number])[];
type Geometry = { type: "Polygon"; coordinates: readonly Ring[] } | { type: "MultiPolygon"; coordinates: readonly (readonly Ring[])[] };
export type GlowLevel = 1 | 2 | 3 | 4;
export type GlowRegion = { geometry: Geometry; level: GlowLevel };

/** 처음 크기에서 흐림 반경(px). 작은 지역(광역시의 구 등)도 가운데가 단계 색에 가깝게 작게. 확대할수록 커진다 */
const BASE_BLUR = 9;
const MAX_BLUR = 48;

/**
 * 그림은 화면보다 넓게, 상하좌우로 화면 크기의 이 비율만큼 더 그린다. 움직이는 동안 그림은 지도에 붙어 함께 움직이고,
 * 끌기·한 단계 축소에도 그림의 사각 경계가 화면 안으로 들어오지 않는다(2026-11-15 사용자: 사각형이 보임, 사라졌다
 * 다시 생기는 것도 싫음). 멈추면 새 그림으로 서서히 맞바꾼다
 */
const MARGIN = 0.5;

/** 그림이 덮을 영역 네 모서리(왼위, 오른위, 오른아래, 왼아래). 화면 밖 여백까지 */
function coverCorners(map: MapLibreMap, w: number, h: number): [[number, number], [number, number], [number, number], [number, number]] {
  const at = (x: number, y: number): [number, number] => {
    const p = map.unproject([x, y]);
    return [p.lng, p.lat];
  };
  const [x0, y0, x1, y1] = [-w * MARGIN, -h * MARGIN, w * (1 + MARGIN), h * (1 + MARGIN)];
  return [at(x0, y0), at(x1, y0), at(x1, y1), at(x0, y1)];
}

function tracePath(path: Path2D, geometry: Geometry, shift: [number, number], map: MapLibreMap): void {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      ring.forEach(([lon, lat], i) => {
        const p = map.project([lon, lat]);
        if (i === 0) path.moveTo(p.x + shift[0], p.y + shift[1]);
        else path.lineTo(p.x + shift[0], p.y + shift[1]);
      });
      path.closePath();
    }
  }
}

/** 두 장의 캔버스와 지금 보이는 쪽 */
export type GlowState = { canvases: [HTMLCanvasElement, HTMLCanvasElement]; scratch: HTMLCanvasElement; front: 0 | 1 };

/**
 * 쉬던 캔버스에 그라데이션을 그리고, 그 소스를 지금 화면 위치로 옮긴 뒤 이전 그림과 맞바꿔 서서히 보인다.
 * `colors`는 단계 1~4의 밝은 색(경계 쪽 색). 그릴 수 없는 환경(테스트의 가짜 지도·캔버스)에서는 아무것도 하지 않는다.
 */
export function redrawGlow(
  map: MapLibreMap,
  state: GlowState,
  regions: readonly GlowRegion[],
  colors: Readonly<Record<GlowLevel, string>>,
  startZoom: number,
): void {
  // 가짜 지도(jsdom)는 좌표 변환이 없다. 캔버스 그리기도 없어 여기서 멈춘다
  if (typeof map.project !== "function") return;
  const next = state.front === 0 ? 1 : 0;
  const canvas = state.canvases[next];
  const scratch = state.scratch;
  const target = GLOW_LAYERS[next];
  const previous = GLOW_LAYERS[state.front];
  const source = map.getSource<CanvasSource>(target.source);
  const ctx = canvas.getContext("2d");
  const sctx = scratch.getContext("2d");
  if (source === undefined || ctx === null || sctx === null) return;

  // 지도 캔버스의 지금 크기(창 크기를 바꾼 직후에도 `project`가 쓰는 크기와 같게)
  // 그라데이션은 원래 부드러운 그림이라 장치 픽셀 비율을 곱하지 않는다(화면보다 넓게 그리는 만큼 가볍게)
  const mapCanvas = map.getCanvas();
  const viewW = mapCanvas.clientWidth;
  const viewH = mapCanvas.clientHeight;
  // 지도 칸이 아직 자리를 잡지 못했으면(크기 0, 화면 전환 중 등) 그리지 않는다. 다음 `moveend`·`resize`가 다시 그린다
  if (viewW === 0 || viewH === 0) return;
  const shift: [number, number] = [viewW * MARGIN, viewH * MARGIN];
  const width = Math.max(1, Math.round(viewW * (1 + 2 * MARGIN)));
  const height = Math.max(1, Math.round(viewH * (1 + 2 * MARGIN)));
  for (const c of [canvas, scratch]) {
    if (c.width !== width) c.width = width;
    if (c.height !== height) c.height = height;
  }
  ctx.clearRect(0, 0, width, height);

  // 확대 한 단계마다 약 1.4배(지역이 2배 커질 때 그라데이션 폭도 넓어지게, 너무 퍼지지 않게 상한)
  const blur = Math.min(MAX_BLUR, BASE_BLUR * Math.SQRT2 ** Math.max(0, map.getZoom() - startZoom));
  // 흐린 빛을 화면 밖에서 그리고 그림자만 화면에 떨어뜨린다. Safari는 캔버스 `filter: blur`가 꺼져 있어
  // 모든 브라우저가 지원하는 `shadowBlur`로 흐린다(그림자 흐림은 표준편차의 약 2배 값을 받는다)
  const away = width + blur * 6;

  for (const level of [1, 2, 3, 4] as const) {
    const group = regions.filter((r) => r.level === level);
    if (group.length === 0) continue;
    // 꼭짓점 좌표 변환은 단계마다 한 번만(선 그리기·잘라내기에 같은 경로를 쓴다)
    const path = new Path2D();
    for (const r of group) tracePath(path, r.geometry, shift, map);
    sctx.clearRect(0, 0, width, height);
    // 1) 경계를 밝은 색 굵은 선으로 그리고 흐린다(경계에서 안쪽으로 서서히 옅어지는 빛)
    sctx.save();
    sctx.translate(-away, 0);
    sctx.shadowColor = colors[level];
    sctx.shadowBlur = blur * 2;
    sctx.shadowOffsetX = away;
    sctx.strokeStyle = colors[level];
    sctx.lineWidth = blur * 1.6;
    sctx.lineJoin = "round";
    sctx.stroke(path);
    sctx.restore();
    // 2) 그 단계 지역 모양만 남긴다(바깥·이웃으로 번진 빛을 지운다)
    sctx.save();
    sctx.globalCompositeOperation = "destination-in";
    sctx.fill(path, "evenodd");
    sctx.restore();
    ctx.drawImage(scratch, 0, 0);
  }

  const corners = coverCorners(map, viewW, viewH);
  // 지도가 아직 위치를 못 잡아 좌표가 무한대면 넘기지 않는다(MapLibre가 예외를 낸다)
  if (!corners.every(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat))) return;
  source.setCoordinates(corners);
  // 정지 소스는 그린 뒤 한 번 다시 읽게 하고 바로 멈춘다(움직이는 동안 매 프레임 올리지 않게)
  source.play();
  requestAnimationFrame(() => source.pause());
  // 새 그림은 서서히 나타나고 이전 그림은 서서히 사라진다(전환 시간은 층을 만들 때 `raster-opacity-transition`)
  map.setPaintProperty(target.layer, "raster-opacity", GLOW_OPACITY);
  map.setPaintProperty(previous.layer, "raster-opacity", 0);
  state.front = next;
}
