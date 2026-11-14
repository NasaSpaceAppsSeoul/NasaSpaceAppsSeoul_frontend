/*
 * 목 `/map?month=&parent=` (`reference/api/E-map-top.md` E-1, E-2).
 * 검사 순서는 백엔드 `SpatialService.map`과 같다: `month` 없음·형식(400 `INVALID_PARAM`) → 달 범위(400
 * `MONTH_OUT_OF_RANGE`) → `parent`가 나라·시·도가 아님(404 `REGION_NOT_FOUND`).
 *
 * 백엔드 그대로인 것
 * - `regions[].value`는 `/series`와 같은 생성기 값이다(숫자 카드·히트맵과 맞는다). `map_bin`은 `meta.labels.bins`로.
 * - 2012-02 전 달은 `value`·`map_bin`이 `null`이고 `reason: "PRE_2012_DISTRICT"` 키가 있다. 그 밖의 달에는 키가 없다.
 * - 점이 상한(4,000)을 넘으면 무작위로 상한만큼 뽑아 날짜순으로 보낸다. 넘지 않으면 만든 순서 그대로다.
 * - `sensor`: 2012-02 전 MODIS, 2018-04 전 S-NPP, 그 뒤 NOAA-20.
 *
 * 지어낸 값
 * - 감지 점 전부. 시·군·구마다 그 달 값(반올림)만큼 점을 그 구역 도형 안에 뿌린다. 한 위치에 1~3일 연달아
 *   점을 찍어 같은 칸이 여러 날 감지된 경우를 만든다. 좌표는 소수 셋째 자리(백엔드도 잘라서 보낸다).
 * - 2012-02 전 달은 값이 `null`이라, 같은 달 이름의 2013년 값의 절반만큼 점을 찍는다(MODIS가 덜 잡는다고 가정).
 * - 감지 점의 마지막 달은 나라 달 범위(`timeline().last`)보다 한 달 앞이다. 백엔드는 `/map` 달 범위를 감지 점으로
 *   따로 검사해서(`SpatialService.java:473-486`) `/series`의 마지막 달이 400일 수 있다. 그 경우(5-9)를 보이게 한다.
 * - 2025-03은 울릉군을 `regions`에서 뺀다. `/geo`에 있는데 값이 안 온 구역(5-5, E-2 8번)을 보이게 하려는 것이다.
 * - 한국은 달마다 바다 위 점 2개(`region_id: null`)를 넣는다(경계 밖 점, E-1).
 */
import type { Country } from "../../lib/country";
import { ApiError } from "../client";
import type { GeoFeature, MapBin, MapPoint, MapRegion, MapResponse, Position, RegionSummary } from "../types";
import { FIRST_MONTH, NOAA20_START, VIIRS_START, monthIndex, regionValues, timeline } from "./series-gen";
import type { CountryMock } from "./types";

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
export const POINT_CAP = 4000;
const ULLEUNG = "91817680B98862203953263";
const DROPPED: Readonly<Record<string, readonly string[]>> = { "2025-03": [ULLEUNG] };
const SEA_POINTS: readonly Position[] = [
  [124.903, 36.512],
  [129.874, 35.104],
];

/** 감지 점이 있는 마지막 달(나라 달 범위보다 한 달 앞) */
export function lastPointMonth(country: Country): string {
  const [y, m] = timeline(country).last.split("-").map(Number);
  const year = y ?? 2026;
  const month = m ?? 1;
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, "0")}`;
}

/** `/map`·`/top`의 달 검사: 없음·형식(400 `INVALID_PARAM`) → 감지 점 달 범위(400 `MONTH_OUT_OF_RANGE`) */
export function checkSpatialMonth(country: Country, month: string | null): string {
  if (month === null || month === "") throw new ApiError(400, "INVALID_PARAM", "month is required");
  if (!MONTH.test(month)) throw new ApiError(400, "INVALID_PARAM", `month: expected YYYY-MM, got '${month}'`);
  const lastMonth = lastPointMonth(country);
  if (month < FIRST_MONTH || month > lastMonth) {
    throw new ApiError(400, "MONTH_OUT_OF_RANGE", `month '${month}' is outside ${FIRST_MONTH}..${lastMonth}`);
  }
  return month;
}

/** FNV-1a 32비트 + mulberry32: 같은 달·구역이면 같은 점을 만든다 */
function rng(text: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mapBin(value: number, bins: readonly [number, number, number]): MapBin {
  const [a, b, c] = bins;
  if (value === 0) return 0;
  if (value < a) return 1;
  if (value < b) return 2;
  if (value < c) return 3;
  return 4;
}

function sensorOf(month: string): MapResponse["points"]["sensor"] {
  if (month < VIIRS_START) return "MODIS";
  if (month < NOAA20_START) return "S-NPP";
  return "NOAA-20";
}

function outerRings(feature: GeoFeature): Position[][] {
  const g = feature.geometry;
  return g.type === "Polygon" ? [g.coordinates[0] ?? []] : g.coordinates.map((poly) => poly[0] ?? []);
}

/** 짝수-홀수 규칙. 바깥 고리만 본다(목이라 구멍은 무시한다). */
function inside(point: Position, rings: readonly Position[][]): boolean {
  const [x, y] = point;
  let hit = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const pi = ring[i];
      const pj = ring[j];
      if (pi === undefined || pj === undefined) continue;
      if (pi[1] > y !== pj[1] > y && x < ((pj[0] - pi[0]) * (y - pi[1])) / (pj[1] - pi[1]) + pi[0]) hit = !hit;
    }
  }
  return hit;
}

function randomInside(feature: GeoFeature, next: () => number): Position | null {
  const rings = outerRings(feature);
  const xs = rings.flatMap((r) => r.map((p) => p[0]));
  const ys = rings.flatMap((r) => r.map((p) => p[1]));
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  for (let tries = 0; tries < 50; tries += 1) {
    const p: Position = [x0 + (x1 - x0) * next(), y0 + (y1 - y0) * next()];
    if (inside(p, rings)) return p;
  }
  return null;
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;

function daysIn(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y ?? 2000, m ?? 1, 0)).getUTCDate();
}

/** 구역 하나의 점. 시작 날 하나에 몰리고, 한 위치에 1~3일 연달아 찍는다. */
function districtPoints(month: string, region: RegionSummary, feature: GeoFeature, count: number): MapPoint[] {
  const next = rng(`${month}/${region.id}`);
  const last = daysIn(month);
  const start = 1 + Math.floor(next() * last);
  const points: MapPoint[] = [];
  while (points.length < count) {
    const at = randomInside(feature, next);
    if (at === null) break;
    const firstDay = Math.min(last, start + Math.floor(next() * next() * 5));
    const runs = 1 + Math.floor(next() * 3);
    for (let k = 0; k < runs && points.length < count; k += 1) {
      points.push([r3(at[0]), r3(at[1]), Math.min(last, firstDay + k), region.id]);
    }
  }
  return points;
}

function pointCount(country: Country, region: RegionSummary, month: string, value: number | null): number {
  if (value !== null) return Math.round(value);
  if (month >= VIIRS_START) return 0;
  const { values } = regionValues(country, region);
  const later = values[monthIndex(`2013-${month.slice(5, 7)}`)] ?? null;
  return later === null ? 0 : Math.round(later / 2);
}

/** 표본: 씨앗 고정 무작위로 `cap`개를 뽑고 날짜순 정렬 */
function sample(points: MapPoint[], cap: number, month: string): MapPoint[] {
  if (points.length <= cap) return points;
  const next = rng(`sample/${month}`);
  const pool = [...points];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    const a = pool[i];
    const b = pool[j];
    if (a === undefined || b === undefined) continue;
    pool[i] = b;
    pool[j] = a;
  }
  return pool.slice(0, cap).sort((p, q) => p[2] - q[2]);
}

export function mockMap(
  country: Country,
  mock: CountryMock | undefined,
  query: URLSearchParams,
  cap: number = POINT_CAP,
): MapResponse {
  const month = checkSpatialMonth(country, query.get("month"));
  const all = mock?.regions ?? [];
  const parent = query.get("parent");
  // 빈 `parent=`는 백엔드처럼 404(`SpatialService.childrenOf`). 프론트는 빈 값을 보내지 않는다
  const national = parent === null || parent === country;
  const province = national ? undefined : all.find((r) => r.level === "prov" && r.id === parent);
  if (!national && province === undefined) {
    throw new ApiError(404, "REGION_NOT_FOUND", `region not found: ${country}/${parent ?? ""}`);
  }

  const bins = mock?.meta.labels.bins ?? [1, 2, 3];
  const index = monthIndex(month);
  const dropped = DROPPED[month] ?? [];
  const geoById = new Map(
    (mock?.geo() ?? []).filter((g) => g.level === "dist").map((g) => [g.feature.properties.id, g.feature]),
  );
  const districts = all.filter(
    (r) => r.level === "dist" && (province === undefined || r.province === province.id) && !dropped.includes(r.id),
  );

  const regions: MapRegion[] = [];
  const points: MapPoint[] = [];
  for (const region of districts) {
    const value = regionValues(country, region).values[index] ?? null;
    regions.push(
      value === null
        ? { id: region.id, value: null, map_bin: null, reason: "PRE_2012_DISTRICT" }
        : { id: region.id, value, map_bin: mapBin(value, bins) },
    );
    const feature = geoById.get(region.id);
    const count = pointCount(country, region, month, value);
    if (feature !== undefined && count > 0) points.push(...districtPoints(month, region, feature, count));
  }
  if (country === "KOR" && national) {
    SEA_POINTS.forEach(([lon, lat], i) => points.push([lon, lat, 1 + i * 7, null]));
  }
  regions.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  return {
    month,
    parent: national ? country : (province?.id ?? country),
    regions,
    points: { sensor: sensorOf(month), count: points.length, shown: Math.min(points.length, cap), items: sample(points, cap, month) },
  };
}
