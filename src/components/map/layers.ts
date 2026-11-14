import type { ExpressionSpecification, Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import { GLOW_FADE_MS, GLOW_LAYERS } from "./regionGlow";

/*
 * MapLibre 스타일·층·빗금 그림. 색은 `styles/index.css` 토큰에서 읽는다(스킬 react-architecture).
 * 배경 지도 없이 경계만 그린다(5-1): 타일·글꼴 없는 빈 스타일.
 */

export const SOURCE = { regions: "regions", outlines: "outlines", points: "points" } as const;
export const LAYER = {
  fill: "region-fill",
  hatch: "region-hatch",
  line: "region-line",
  outline: "outline-line",
  selected: "selected-line",
  /** 처음 크기에서 감지 위치를 연기처럼 번지게 그리는 층 */
  heat: "points-heat",
  /** 점 뒤 같은 색 빛번짐 */
  halo: "points-halo",
  points: "points",
} as const;
const HATCH_IMAGE = "hatch";
/** 칠할 상태를 feature-state `bin`에 둔다. `none`(값 없음)과 아직 모르는 구역은 -1 */
export const NONE_BIN = -1;

export type MapColors = {
  bins: [string, string, string, string, string];
  dots: [string, string, string, string];
  ink: string;
  /** 경계선·점 테두리(시안 v9 지도 선 `--color-map-line`) */
  line: string;
  selection: string;
  hatchLine: string;
  hatchBase: string;
};

const FALLBACK = "#808080";

/** 토큰을 읽는다. 값이 없으면(테스트 환경) 회색 */
export function readMapColors(): MapColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim() || FALLBACK;
  return {
    bins: [read("--color-map-0"), read("--color-map-1"), read("--color-map-2"), read("--color-map-3"), read("--color-map-4")],
    dots: [read("--color-dot-0"), read("--color-dot-1"), read("--color-dot-2"), read("--color-dot-3")],
    ink: read("--color-ink"),
    line: read("--color-map-line"),
    selection: read("--color-selection"),
    hatchLine: read("--color-heat-hatch"),
    hatchBase: read("--color-border"),
  };
}

export function emptyStyle(): StyleSpecification {
  return { version: 8, sources: {}, layers: [] };
}

function rgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (m === null) return [128, 128, 128];
  return [parseInt(m[1] ?? "80", 16), parseInt(m[2] ?? "80", 16), parseInt(m[3] ?? "80", 16)];
}

/** 8×8 빗금(135°) 그림. 바탕은 border, 선은 히트맵 "관측 자료 없음"과 같은 색 */
function hatchImage(colors: MapColors): { width: number; height: number; data: Uint8Array } {
  const size = 8;
  const data = new Uint8Array(size * size * 4);
  const base = rgb(colors.hatchBase);
  const line = rgb(colors.hatchLine);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = (x + y) % size === 0 ? line : base;
      const i = (y * size + x) * 4;
      data.set([r, g, b, 255], i);
    }
  }
  return { width: size, height: size, data };
}

const EMPTY = { type: "FeatureCollection" as const, features: [] };

/** `#rrggbb`를 흰색과 섞는다(t = 흰색 비율). 지역 그라데이션의 경계 쪽 색 */
export function lighten(hex: string, t: number): string {
  const [r, g, b] = rgb(hex).map((v) => Math.round(v + (255 - v) * t));
  return `rgb(${r},${g},${b})`;
}

/**
 * 소스와 층을 아래에서 위 순서로 더한다: 면 → 빗금 → 지역 그라데이션(캔버스, `regionGlow.ts`) → 시·군·구 선 → 시·도 선
 * → 선택 선 → 점 빛번짐 → 점.
 */
export function addLayers(map: MapLibreMap, colors: MapColors, glowCanvases: readonly [HTMLCanvasElement, HTMLCanvasElement]): void {
  map.addImage(HATCH_IMAGE, hatchImage(colors));
  map.addSource(SOURCE.regions, { type: "geojson", data: EMPTY, promoteId: "id" });
  map.addSource(SOURCE.outlines, { type: "geojson", data: EMPTY });
  map.addSource(SOURCE.points, { type: "geojson", data: EMPTY });

  const bin: ExpressionSpecification = ["coalesce", ["feature-state", "bin"], NONE_BIN];
  const [c0, c1, c2, c3, c4] = colors.bins;
  map.addLayer({
    id: LAYER.fill,
    type: "fill",
    source: SOURCE.regions,
    paint: {
      "fill-color": ["match", bin, 0, c0, 1, c1, 2, c2, 3, c3, 4, c4, colors.hatchBase],
    },
  });
  map.addLayer({
    id: LAYER.hatch,
    type: "fill",
    source: SOURCE.regions,
    paint: { "fill-pattern": HATCH_IMAGE, "fill-opacity": ["case", ["==", bin, NONE_BIN], 1, 0] },
  });
  // 지역 그라데이션: 캔버스 두 장을 번갈아 쓴다(쉬던 쪽에 새로 그리고 서서히 맞바꾼다, `regionGlow.ts`).
  // 소스는 지도를 만들 때 한 번 넣고, 그림은 `redrawGlow`가 화면이 멈출 때마다 다시 그린다. 처음에는 둘 다 투명
  GLOW_LAYERS.forEach(({ source, layer }, i) => {
    map.addSource(source, { type: "canvas", canvas: glowCanvases[i] ?? glowCanvases[0], coordinates: [[0, 1], [1, 1], [1, 0], [0, 0]], animate: false });
    map.addLayer({
      id: layer,
      type: "raster",
      source,
      paint: { "raster-opacity": 0, "raster-opacity-transition": { duration: GLOW_FADE_MS, delay: 0 }, "raster-fade-duration": 0 },
    });
  });
  map.addLayer({
    id: LAYER.line,
    type: "line",
    source: SOURCE.regions,
    paint: { "line-color": colors.line, "line-opacity": 0.6, "line-width": 0.6 },
  });
  map.addLayer({
    id: LAYER.outline,
    type: "line",
    source: SOURCE.outlines,
    paint: { "line-color": colors.line, "line-opacity": 0.85, "line-width": 1.6 },
  });
  map.addLayer({
    id: LAYER.selected,
    type: "line",
    source: SOURCE.regions,
    filter: ["==", ["get", "id"], ""],
    // 은은하게(2026-11-15 사용자: 너무 쨍함 → 굵기 2.5 → 1.5, 살짝 흐림. 70%는 잘 안 보여 85%)
    paint: { "line-color": colors.selection, "line-width": 1.5, "line-opacity": 0.85, "line-blur": 0.5 },
  });
  map.addLayer({
    id: LAYER.heat,
    type: "heatmap",
    source: SOURCE.points,
    paint: { "heatmap-opacity": 0 },
  });
  const dotColor: ExpressionSpecification = ["match", ["get", "age"], 0, colors.dots[0], 1, colors.dots[1], 2, colors.dots[2], colors.dots[3]];
  // 점 뒤 같은 색 빛번짐(우주 배경의 별처럼). 크기·투명도는 점과 함께 `applyPointZoom`·`applyStaticPoints`가 정한다
  map.addLayer({
    id: LAYER.halo,
    type: "circle",
    source: SOURCE.points,
    paint: { "circle-color": dotColor, "circle-blur": 1, "circle-opacity": 0 },
  });
  map.addLayer({
    id: LAYER.points,
    type: "circle",
    source: SOURCE.points,
    // 처음엔 투명. 첫 맞춤 뒤 `applyPointZoom`·`applyStaticPoints`가 보이게 한다(지도를 새로 만들 때, 예를 들어 언어를
    // 바꿀 때 숨겨야 할 점이 잠깐 보였다 사라지지 않게, 2026-11-15 사용자 지적)
    paint: {
      "circle-color": dotColor,
      "circle-stroke-color": colors.line,
      "circle-stroke-width": 0.5,
      "circle-opacity": 0,
      "circle-stroke-opacity": 0,
    },
  });
}

/*
 * 감지 점 표시(2026-11-14 사용자 선택 안 B). 점이 몰린 곳이 징그럽게 보여 디자인의 "반지름 4 + 진한 테두리" 대신:
 * - 처음 크기: 점 대신 감지 위치를 연기처럼 번지게(진한 글자색 반투명 밀도) 그린다.
 * - 1 ~ 1.5단계 확대 사이에 번짐이 사라지고 작은 점(경과일 4색, 옅은 테두리)이 나타난다. 점은 확대할수록 커진다.
 * 확대 단계는 지도마다 다르므로 처음 맞춘 확대값(`startZoom`)을 기준으로 정한다. 맞출 때마다 다시 부른다.
 * 테두리는 지도 선 색을 낮은 불투명도로 쓴다(첫 감지일 점이 흰색이라 흰 테두리는 밝은 면 위에서 사라진다).
 * 번짐은 +2일 점 색(앰버)이라 우주 테마의 불빛처럼 보인다(2026-11-15 사용자: 흰 연기는 회색 면 위에서 탁해 보였다).
 * 점 뒤에는 같은 색 빛번짐(`LAYER.halo`)을 점의 2.6배 크기로 옅게 깐다.
 */
/** 처음 맞춘 확대값에서 몇 단계 더 확대하면 점이 나타나기 시작하는지 */
export const POINTS_FROM = 1;

export function applyPointZoom(map: MapLibreMap, colors: MapColors, startZoom: number): void {
  const z = (stops: number[]): ExpressionSpecification => {
    const pairs = stops.flatMap((v, i) => (i % 2 === 0 ? [startZoom + v] : [v]));
    return ["interpolate", ["linear"], ["zoom"], ...pairs] as ExpressionSpecification;
  };
  const [r, g, b] = rgb(colors.dots[2]);
  const smoke = (a: number) => `rgba(${r},${g},${b},${a})`;
  // 점 크기(2026-11-15 사용자: 너무 작다 → 키움)
  map.setPaintProperty(LAYER.points, "circle-radius", z([0, 2.5, 4, 6]));
  map.setPaintProperty(LAYER.points, "circle-opacity", z([POINTS_FROM, 0, POINTS_FROM + 0.5, 0.95]));
  map.setPaintProperty(LAYER.points, "circle-stroke-opacity", z([POINTS_FROM, 0, POINTS_FROM + 0.5, 0.3]));
  map.setPaintProperty(LAYER.halo, "circle-radius", z([0, 6, 4, 15]));
  map.setPaintProperty(LAYER.halo, "circle-opacity", z([POINTS_FROM, 0, POINTS_FROM + 0.5, 0.35]));
  map.setPaintProperty(LAYER.heat, "heatmap-color", [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    smoke(0),
    0.2,
    smoke(0.18),
    0.6,
    smoke(0.38),
    1,
    smoke(0.55),
  ]);
  map.setPaintProperty(LAYER.heat, "heatmap-radius", z([0, 10, 1.5, 18]));
  map.setPaintProperty(LAYER.heat, "heatmap-intensity", z([0, 0.8, 1.5, 1.2]));
  map.setPaintProperty(LAYER.heat, "heatmap-opacity", z([0, 0.8, 1, 0.6, 1.5, 0]));
}

/**
 * 지역 지도(시·도, 시·군·구 + 맞닿은 지역, 7장 월간 인사이트)의 점. 처음부터 작은 점(경과일 4색)으로 그리고
 * 번짐은 쓰지 않는다(디자인 `06-maps-regional`, 2026-11-14 사용자 결정). 확대할수록 조금 커진다
 * (겹친 점은 좌표가 벌어지며 떨어지고, 크기는 올려 보기 쉽게만. `plans/dashboard-sections.md` 14절).
 * 확대 단계는 지도마다 다르므로 처음 맞춘 확대값(`startZoom`)을 기준으로 정한다. 맞출 때마다 다시 부른다.
 * 테두리는 나라 지도보다 진하게 한다(주황 면 위의 +2일 주황 점이 묻히지 않게, review-ui).
 */
export function applyStaticPoints(map: MapLibreMap, startZoom: number): void {
  map.setPaintProperty(LAYER.heat, "heatmap-opacity", 0);
  // 점 크기(2026-11-15 사용자: 너무 작다 → 키움)
  map.setPaintProperty(LAYER.points, "circle-radius", ["interpolate", ["linear"], ["zoom"], startZoom, 4.5, startZoom + 4, 7]);
  map.setPaintProperty(LAYER.points, "circle-opacity", 0.95);
  map.setPaintProperty(LAYER.points, "circle-stroke-opacity", 0.55);
  // 점 뒤 빛번짐(점의 약 2.6배). 점이 몰린 곳은 빛이 겹쳐 밝아진다
  map.setPaintProperty(LAYER.halo, "circle-radius", ["interpolate", ["linear"], ["zoom"], startZoom, 11, startZoom + 4, 17]);
  map.setPaintProperty(LAYER.halo, "circle-opacity", 0.3);
}
