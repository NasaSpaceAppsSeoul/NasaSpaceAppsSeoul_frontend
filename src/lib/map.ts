/*
 * 지도 계산 (`decisions.md` 5절, `reference/api/E-map-top.md`). 대시보드와 7장 월간 인사이트가 같이 쓴다.
 * `lib`은 `api`를 가져오지 않으므로 응답 모양은 필요한 만큼만 여기서 적는다.
 */

export type MapLevel = 0 | 1 | 2 | 3 | 4;
/** 구역 하나의 칠할 상태. `none`은 "값 없음" 빗금(2012-02 전 달, 응답에 없는 구역, 5-4·5-5) */
export type FillState = MapLevel | "none";
export type AgeClass = 0 | 1 | 2 | 3;
export type Bounds = [west: number, south: number, east: number, north: number];

type Bins = readonly [number, number, number];
type Ring = readonly (readonly [number, number])[];
type Geometry = { type: "Polygon"; coordinates: readonly Ring[] } | { type: "MultiPolygon"; coordinates: readonly (readonly Ring[])[] };
type RegionFeature = { properties: { id: string; province: string | null }; geometry: Geometry };

/** 값 → 색 단계. 경계는 "a 이상 b 미만"(E-1). `null`이면 값 없음(7장 `neighbors[].v`). */
export function binOf(value: number | null, bins: Bins): FillState {
  if (value === null) return "none";
  const [a, b, c] = bins;
  if (value === 0) return 0;
  if (value < a) return 1;
  if (value < b) return 2;
  if (value < c) return 3;
  return 4;
}

/** 보이는 구역마다 칠할 상태. 응답에 없거나 `map_bin`이 `null`이면 `none`(0과 구분한다). */
export function fillStates(
  ids: readonly string[],
  regions: readonly { id: string; map_bin: MapLevel | null }[] | undefined,
): Map<string, FillState> {
  const byId = new Map((regions ?? []).map((r) => [r.id, r.map_bin]));
  return new Map(ids.map((id): [string, FillState] => [id, byId.get(id) ?? "none"]));
}

/**
 * 지금 화면에 그릴 시·군·구 ID. 나라 → 전부, 시·도 → 그 시·도의 시·군·구, 시·군·구 → 자기 + 이웃.
 * 이웃을 아직 못 받았으면 자기만. 경계가 없는 ID(영광군 등)는 그리지 못하니 뺀다.
 */
export function visibleRegionIds(
  features: readonly RegionFeature[],
  region: { id: string; level: "nat" | "prov" | "dist" },
  neighbors: readonly string[] = [],
): string[] {
  if (region.level === "nat") return features.map((f) => f.properties.id);
  if (region.level === "prov") return features.filter((f) => f.properties.province === region.id).map((f) => f.properties.id);
  const wanted = new Set([region.id, ...neighbors]);
  return features.filter((f) => wanted.has(f.properties.id)).map((f) => f.properties.id);
}

/** 보이는 구역 안의 점만. 나라 화면은 경계 밖 점(`region_id: null`)도 남긴다(E-1). */
export function filterPoints<P extends readonly [number, number, number, string | null]>(
  items: readonly P[],
  visibleIds: ReadonlySet<string>,
  includeOutside: boolean,
): P[] {
  return items.filter((p) => (p[3] === null ? includeOutside : visibleIds.has(p[3])));
}

export type CellPoint = { lon: number; lat: number; firstDay: number; regionId: string | null };

/**
 * 같은 0.01° 칸의 점을 하나로 합쳐 그 칸의 첫 감지일을 남긴다(범례 "점은 감지된 칸의 대표 위치").
 * 대표 좌표와 구역은 가장 이른 날의 점. 7장 `/insight`의 `[lon, lat, day]` 점도 받는다.
 * 백엔드 칸은 원본 좌표를 반올림해 정하고 보내는 좌표는 잘린 값이라, 칸 경계에 걸린 점은 어긋날 수 있다.
 */
export function firstDayCells(items: readonly (readonly [number, number, number, (string | null)?])[]): CellPoint[] {
  const cells = new Map<string, CellPoint>();
  for (const [lon, lat, day, regionId] of items) {
    const key = `${Math.round(lat * 100)}_${Math.round(lon * 100)}`;
    const seen = cells.get(key);
    if (seen === undefined || day < seen.firstDay) cells.set(key, { lon, lat, firstDay: day, regionId: regionId ?? null });
  }
  return [...cells.values()];
}

/** 보이는 칸들 중 가장 이른 날(5-2). 칸이 없으면 `null`. */
export function earliestDay(cells: readonly CellPoint[]): number | null {
  return cells.reduce<number | null>((min, c) => (min === null || c.firstDay < min ? c.firstDay : min), null);
}

/** 첫 감지일 이후 경과일 → 점 색 4가지(0, +1, +2, +3일 이상) */
export function ageClass(day: number, firstDay: number): AgeClass {
  const diff = day - firstDay;
  if (diff <= 0) return 0;
  if (diff === 1) return 1;
  if (diff === 2) return 2;
  return 3;
}

function eachPosition(geometry: Geometry, visit: (lon: number, lat: number) => void): void {
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) for (const ring of polygon) for (const [lon, lat] of ring) visit(lon, lat);
}

/** 구역들의 경계 상자. 비면 `null`(그때는 나라 상자로 맞춘다. 무한대 상자를 지도에 넘기지 않는다). */
export function boundsOf(features: readonly { geometry: Geometry }[]): Bounds | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const f of features) {
    eachPosition(f.geometry, (lon, lat) => {
      west = Math.min(west, lon);
      south = Math.min(south, lat);
      east = Math.max(east, lon);
      north = Math.max(north, lat);
    });
  }
  return Number.isFinite(west) ? [west, south, east, north] : null;
}

export type BorderFeature = {
  type: "Feature";
  properties: Record<string, never>;
  geometry: { type: "MultiLineString"; coordinates: [number, number][][] };
};

type Box = [number, number, number, number];
type Indexed = { feature: RegionFeature; box: Box; polygons: readonly (readonly Ring[])[] };

/** 짝수-홀수 규칙. 다각형 하나의 모든 고리(구멍 포함)를 본다. */
function insidePolygon(x: number, y: number, polygon: readonly Ring[]): boolean {
  let hit = false;
  for (const ring of polygon) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const p = ring[i];
      const q = ring[j];
      if (p === undefined || q === undefined) continue;
      if (p[1] > y !== q[1] > y && x < ((q[0] - p[0]) * (y - p[1])) / (q[1] - p[1]) + p[0]) hit = !hit;
    }
  }
  return hit;
}

/** 점이 들어 있는 구역(`skip`은 뺀다). 없으면 `null` */
function regionAt(x: number, y: number, index: readonly Indexed[], skip: Indexed): Indexed | null {
  for (const r of index) {
    if (r === skip || x < r.box[0] || x > r.box[2] || y < r.box[1] || y > r.box[3]) continue;
    if (r.polygons.some((polygon) => insidePolygon(x, y, polygon))) return r;
  }
  return null;
}

/** 변의 양옆을 살필 거리(도, 약 150 m). 짧은 변은 길이의 1/4까지만(세 구역이 만나는 점을 넘지 않게) */
const SIDE_OFFSET = 0.0015;
/** 다른 시·도와 어긋난 경계에서 반대쪽 변이 "이미 그린 선"으로 볼 거리(도, 약 200 m) */
const PAIR_GAP = 0.002;

type Segment = [[number, number], [number, number]];

function distanceToSegment(x: number, y: number, [[ax, ay], [bx, by]]: Segment): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
}

/**
 * 시·도 경계선을 시·군·구 도형에서 만든다(시·도 원본 경계는 시·군·구와 원본이 달라 어긋난다. 2026-11-14 사용자 선택 안 B).
 * 변마다 건너편이 무엇인지 본다.
 * - 이웃과 꼭짓점까지 같은 변: 두 구역의 시·도가 다르면 남긴다.
 * - 한 구역만 쓰는 변: 변 가운데에서 양옆으로 조금 떨어진 점 중 자기 구역 밖인 쪽이 어느 구역 안인지 확인한다.
 *   건너편이 같은 시·도면 지운다. 건너편에 구역이 없으면(바다·나라 밖) 굵게 그리지 않는다(바다 위 행정 경계의 긴 직선).
 *   건너편이 다른 시·도면(꼭짓점이 어긋난 경계) 두 줄로 겹치지 않게 ID가 작은 쪽 변을 그리고, 작은 쪽 변이 틈 때문에
 *   건너편을 찾지 못한 구간은 큰 쪽 변으로 메운다.
 * 원본 경계끼리 어긋난 곳은 굵은 선이 한쪽 구역의 변을 따라가므로, 크게 확대하면 건너편의 얇은 선이 옆에 보일 수 있다.
 */
export function provinceBorders(features: readonly RegionFeature[]): BorderFeature {
  const index: Indexed[] = features.map((feature) => {
    const polygons = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    const box: Box = [Infinity, Infinity, -Infinity, -Infinity];
    for (const polygon of polygons)
      for (const ring of polygon)
        for (const [x, y] of ring) {
          box[0] = Math.min(box[0], x);
          box[1] = Math.min(box[1], y);
          box[2] = Math.max(box[2], x);
          box[3] = Math.max(box[3], y);
        }
    return { feature, box, polygons };
  });

  type Edge = { a: readonly [number, number]; b: readonly [number, number]; owners: Indexed[] };
  const edges = new Map<string, Edge>();
  for (const owner of index) {
    for (const polygon of owner.polygons) {
      for (const ring of polygon) {
        for (let i = 1; i < ring.length; i += 1) {
          const a = ring[i - 1];
          const b = ring[i];
          if (a === undefined || b === undefined || (a[0] === b[0] && a[1] === b[1])) continue;
          const ka = `${a[0]},${a[1]}`;
          const kb = `${b[0]},${b[1]}`;
          const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
          const seen = edges.get(key);
          if (seen === undefined) edges.set(key, { a, b, owners: [owner] });
          else if (!seen.owners.includes(owner)) seen.owners.push(owner);
        }
      }
    }
  }

  const lines: Segment[] = [];
  // 꼭짓점이 어긋난 다른 시·도 경계: 구역 쌍마다 작은 쪽 변과 큰 쪽 변을 모은다
  const pairs = new Map<string, { low: Segment[]; high: Segment[] }>();
  for (const { a, b, owners } of edges.values()) {
    const [first, second] = owners;
    if (first === undefined) continue;
    const province = first.feature.properties.province;
    const segment: Segment = [[a[0], a[1]], [b[0], b[1]]];
    if (second !== undefined) {
      if (owners.some((o) => o.feature.properties.province !== province)) lines.push(segment);
      continue;
    }
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const offset = Math.min(SIDE_OFFSET, length / 4);
    const nx = (-(b[1] - a[1]) / length) * offset;
    const ny = ((b[0] - a[0]) / length) * offset;
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const p1: [number, number] = [mx + nx, my + ny];
    const p2: [number, number] = [mx - nx, my - ny];
    const in1 = first.polygons.some((polygon) => insidePolygon(p1[0], p1[1], polygon));
    const in2 = first.polygons.some((polygon) => insidePolygon(p2[0], p2[1], polygon));
    const outside = in1 && !in2 ? [p2] : in2 && !in1 ? [p1] : [p1, p2];
    let other: Indexed | null = null;
    for (const [x, y] of outside) other ??= regionAt(x, y, index, first);
    if (other === null || other.feature.properties.province === province) continue;
    const lowFirst = first.feature.properties.id < other.feature.properties.id;
    const key = lowFirst ? `${first.feature.properties.id}|${other.feature.properties.id}` : `${other.feature.properties.id}|${first.feature.properties.id}`;
    const pair = pairs.get(key) ?? { low: [], high: [] };
    (lowFirst ? pair.low : pair.high).push(segment);
    pairs.set(key, pair);
  }
  for (const { low, high } of pairs.values()) {
    lines.push(...low);
    for (const segment of high) {
      const [[ax, ay], [bx, by]] = segment;
      const mx = (ax + bx) / 2;
      const my = (ay + by) / 2;
      if (!low.some((s) => distanceToSegment(mx, my, s) < PAIR_GAP)) lines.push(segment);
    }
  }
  return { type: "Feature", properties: {}, geometry: { type: "MultiLineString", coordinates: lines } };
}

/** 범례 칸 다섯. 0 / a 미만 / a–b / b–c / c 이상(2026-11-14 사용자 결정: 앞 값 이상, 뒤 값 미만) */
export type MapLegendItem =
  | { level: 0; kind: "zero" }
  | { level: 1; kind: "below"; to: number }
  | { level: 2 | 3; kind: "between"; from: number; to: number }
  | { level: 4; kind: "above"; from: number };

export function mapLegend(bins: Bins): MapLegendItem[] {
  const [a, b, c] = bins;
  return [
    { level: 0, kind: "zero" },
    { level: 1, kind: "below", to: a },
    { level: 2, kind: "between", from: a, to: b },
    { level: 3, kind: "between", from: b, to: c },
    { level: 4, kind: "above", from: c },
  ];
}

/** 달("YYYY-MM")과 일 → "YYYY-MM-DD" */
export function dayDate(month: string, day: number): string {
  return `${month}-${String(day).padStart(2, "0")}`;
}
