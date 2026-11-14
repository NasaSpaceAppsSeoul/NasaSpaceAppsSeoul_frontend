import type { GeoFeature, GeoFeatureCollection, JudgeUnit, Level, RegionSummary, RegionType } from "../types";

/*
 * 목 JSON을 읽은 뒤 타입을 좁히는 검사. JSON import는 문자열 리터럴을 `string`으로 넓히므로
 * 단언(`as`) 대신 여기서 확인한다. 좌표 숫자 하나하나는 보지 않는다(생성 스크립트가 만든다).
 */

const LEVELS: readonly string[] = ["nat", "prov", "dist"] satisfies Level[];
const REGION_TYPES: readonly string[] = ["sufficient", "sparse", "none"] satisfies RegionType[];

export function isLevel(value: string): value is Level {
  return LEVELS.includes(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNumbers(value: unknown, length: number): boolean {
  return Array.isArray(value) && value.length === length && value.every((v) => typeof v === "number");
}

export function isRegionSummary(value: unknown): value is RegionSummary {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.label_ko === "string" &&
    isStringOrNull(value.name_en) &&
    typeof value.level === "string" &&
    isLevel(value.level) &&
    isStringOrNull(value.province) &&
    typeof value.region_type === "string" &&
    REGION_TYPES.includes(value.region_type) &&
    (value.center === null || isNumbers(value.center, 2)) &&
    (value.bbox === null || isNumbers(value.bbox, 4))
  );
}

function isGeoFeature(value: unknown): value is GeoFeature {
  if (!isObject(value) || value.type !== "Feature") return false;
  const { properties, geometry } = value;
  return (
    isObject(properties) &&
    typeof properties.id === "string" &&
    typeof properties.label_ko === "string" &&
    isStringOrNull(properties.province) &&
    isObject(geometry) &&
    (geometry.type === "Polygon" || geometry.type === "MultiPolygon") &&
    Array.isArray(geometry.coordinates)
  );
}

export function isFeatureCollection(value: unknown): value is GeoFeatureCollection {
  return (
    isObject(value) &&
    value.type === "FeatureCollection" &&
    Array.isArray(value.features) &&
    value.features.every(isGeoFeature)
  );
}

/** 검사에 실패하면 목 데이터 파일이 깨진 것이다. 조용히 넘어가지 않고 바로 알린다. */
export function expectRegions(value: unknown, source: string): RegionSummary[] {
  if (Array.isArray(value) && value.every(isRegionSummary)) return value;
  throw new Error(`목 데이터 형식이 맞지 않습니다: ${source}`);
}

export function expectFeatureCollection(value: unknown, source: string): GeoFeatureCollection {
  if (isFeatureCollection(value)) return value;
  throw new Error(`목 데이터 형식이 맞지 않습니다: ${source}`);
}

const JUDGE_UNITS: readonly string[] = ["self", "province", "nearby_province"] satisfies JudgeUnit[];

function isMockDetail(value: unknown): value is MockDetailJson {
  return (
    isObject(value) &&
    Array.isArray(value.neighbors) &&
    value.neighbors.every((n) => typeof n === "string") &&
    Array.isArray(value.risk_months) &&
    value.risk_months.every((m) => typeof m === "number") &&
    (value.risk_share === null || typeof value.risk_share === "number") &&
    typeof value.risk_from === "string" &&
    JUDGE_UNITS.includes(value.risk_from)
  );
}

/** `kor-detail.json` 한 줄(`build-mock-kor.py --detail`) */
export type MockDetailJson = { neighbors: string[]; risk_months: number[]; risk_share: number | null; risk_from: JudgeUnit };

export function expectDetails(value: unknown, source: string): Map<string, MockDetailJson> {
  if (!isObject(value)) throw new Error(`목 데이터 형식이 맞지 않습니다: ${source}`);
  const out = new Map<string, MockDetailJson>();
  for (const [id, row] of Object.entries(value)) {
    if (!isMockDetail(row)) throw new Error(`목 데이터 형식이 맞지 않습니다: ${source} (${id})`);
    out.set(id, row);
  }
  return out;
}
