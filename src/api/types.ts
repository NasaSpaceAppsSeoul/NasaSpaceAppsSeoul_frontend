// Burnline API 응답 타입. 이 파일이 원본이다(`.claude/reference/api-types.ts`에서 옮김, 2026-11-14).
// 백엔드 커밋 7dff960의 코드를 읽고 작성했다(PR #13 필드 반영). 실제 응답으로 확인한 것이 아니다.
// 서버가 켜지면 화면마다 실제 응답과 대조하고(roadmap 9장), 다르면 이 파일을 고친다.

import type { Country } from "../lib/country";

/** 나라 코드의 원본은 `lib/country`다(주소 검사와 같은 목록을 쓴다). */
export type { Country };
export type Level = "nat" | "prov" | "dist";
export type RegionType = "sufficient" | "sparse" | "none";
export type JudgeUnit = "self" | "province" | "nearby_province";
export type Basis = "harmonized_25y" | "viirs_2012";
export type Chip = "record" | "above" | "normal" | "below";
export type Quality = "high" | "medium" | "low";
export type Status = "final" | "partial" | "nrt";
export type Reason = "PRE_2012_DISTRICT" | "NO_DETECTION" | "ZERO_BASELINE" | "IN_PROGRESS" | "NO_RECORD";
export type Source = "NOAA-20" | "S-NPP→NOAA-20" | "MODIS→NOAA-20" | "Terra→NOAA-20";
export interface ErrorBody { code: ErrorCode; message: string }   // 터널 에러는 이 모양이 아닐 수 있다
export type ClientErrorCode = "TIMEOUT" | "NETWORK" | "BAD_BODY" | "UNKNOWN";   // 프론트가 만드는 코드
export type ErrorCode =
  | "COUNTRY_NOT_READY" | "REGION_NOT_FOUND" | "MONTH_OUT_OF_RANGE" | "INVALID_PARAM"
  | "NOT_FOUND" | "UPSTREAM_UNAVAILABLE" | "INTERNAL";

// ---- /meta
export interface Meta {
  country: Country;
  data_version: string | null;          // "2026-11-11" (형태는 실제 응답으로 확인)
  generated_at: string | null;          // ISO, 시각 포함. 원천에 generated_at·generated가 다 없으면 null (CatalogService.java:38)
  data_end: string | null;              // "YYYY-MM-DD"
  unit: string;
  data_range: Record<"modis" | "viirs_snpp" | "noaa20" | "noaa21", [string, string] | null>;
  judgement_params: { band_q: [number, number]; band_noise: number; min_annual: number; risk_share: number };
  calibration: { chain: string; modis_to_snpp_by_month: Record<string, number> };
  validation: {
    break_test_ratio: number | null;
    break_test_ci95: [number, number] | null;
    official_break: { before: number; after: number; inconclusive: boolean } | null;
  };
  labels: {
    country: string; short: string; lv1: string; lv2: string;
    single: boolean; official: string; boundary: string; bins: [number, number, number];
    season_start: number;               // 시즌(누적) 시작 달. 북반구 1, 남반구 CHL·NSW 7 (백엔드 Country.seasonStart)
  };
  sources: string[];
  time_basis: { code: "UTC+9" | "solar"; label_ko: string };
  external_validation: { available: boolean; source: string | null; records: number | null; period: unknown };
  filters: unknown[];                   // 원본 그대로인 배열. 화면에서 쓰지 않는다
  source_products: unknown;             // 화면에서 쓰지 않는다
}

// ---- /regions, /regions/{id}
export interface RegionSummary {
  id: string;
  label_ko: string;                     // CAL·BC는 영문. 한국은 시·도 없이 "의성군"
  name_en: string | null;
  level: Level;
  province: string | null;              // 시·도 이름(= 시·도 ID). CAL·BC는 null
  region_type: RegionType;
  center: [number, number] | null;      // [lon, lat]
  bbox: [number, number, number, number] | null;
}
export interface RegionDetail extends RegionSummary {
  neighbors: { id: string; label_ko: string; province?: string }[];   // province 키가 없을 수 있음
  judge_unit: JudgeUnit;
  ref_province: string | null;
  basis: Basis;
  risk_months: number[];
  risk_share: number | null;
  risk_from: JudgeUnit;
}
export interface RegionsResponse { items: RegionSummary[] }
export interface GeoProps { id: string; label_ko: string; province: string | null }   // /geo 지형 속성

// ---- /geo?level=&parent=   (GeoJSON. 의존성을 늘리지 않으려고 쓰는 모양만 정의한다)
export type Position = [lon: number, lat: number];
export interface GeoPolygon { type: "Polygon"; coordinates: Position[][] }
export interface GeoMultiPolygon { type: "MultiPolygon"; coordinates: Position[][][] }
export interface GeoFeature { type: "Feature"; properties: GeoProps; geometry: GeoPolygon | GeoMultiPolygon }
export interface GeoFeatureCollection { type: "FeatureCollection"; features: GeoFeature[] }
/** 값이 없으면 키를 뺀다. `level` 기본값은 `dist`, `parent`는 저장된 상위 ID와 정확히 같아야 한다 */
export interface GeoParams { level?: Level; parent?: string }

// ---- /judgement/{id}?month=
export interface JudgementRef {
  id: string; label_ko: string; value: number | null; chip: Chip | null;
  rank: number | null; n: number | null; ratio_to_median: number | null; basis: Basis;
}
export interface Judgement {
  id: string; label_ko: string; month: string;
  value: number | null;
  region_type: RegionType;
  chip: Chip | null;
  judge_unit: JudgeUnit;
  ref_id: string | null; ref_chip: Chip | null;
  rank: number | null; n: number | null; rank_period: [number, number] | null;
  median: number | null; band_low: number | null; band_high: number | null;
  ratio_to_median: number | null;
  ytd_sum: number | null;               // 반올림 안 됨. 표시할 때 소수 한 자리로
  // 누적 평년: 시즌 시작 달~그 달의 해마다 누적 합의 중앙값(소수 한 자리, PR #17). 자체 판정이 아니면 null.
  // 판정 서비스가 옛 빌드면 오지 않는다(2026-11-15) → 화면은 `ytd_sum ÷ ytd_ratio`로 대신한다
  ytd_median?: number | null;
  ytd_ratio: number | null;             // ytd_sum ÷ ytd_median
  // 평소 누적 범위: 해마다 누적 합의 15·85 퍼센타일 ∓ 2√중앙값. 자체 판정이 아니거나 누적 합이 3개 미만이거나 ≤ 0이면 null
  ytd_lo: number | null; ytd_hi: number | null;
  quality: Quality | null; estimated: boolean; status: Status;
  reason: Reason | null;                // 하나만 온다. value·status·region_type·median 을 직접 본다
  ref: JudgementRef | null;
}

// ---- /judgement?month=   (지도용 일괄 판정, 시·군·구만)
// 그 달 series 줄이 있는 시·군·구만 온다(전체 목록이 아닐 수 있음).
// chip: 자체 판정이고 값이 있을 때만(값 0이어도, 집계 중인 달에도 온다). ratio_to_median: 그중 값·평년이 0보다 클 때만.
// 드문 구역은 chip이 null이고 빌려 쓴 지역의 판정을 ref_id·ref_chip으로 준다(JudgeService.bulkMap)
export interface BulkJudgementRegion {
  id: string; chip: Chip | null; ratio_to_median: number | null;
  judge_unit: JudgeUnit; ref_id: string | null; ref_chip: Chip | null;
}
export interface BulkJudgement { month: string; regions: BulkJudgementRegion[] }

// ---- /series/{id}?from=&to= , /baseline/{id}
export interface SeriesMonth {
  month: string; value: number | null;
  raw_before: number | null;            // 보정 전 값(척도가 value와 다름). 시·도는 늘 null, 원자료에 없으면 모두 null
  source: Source | null; quality: Quality | null;
  estimated: boolean; status: Status; rank: number | null; n: number | null; ratio_to_median: number | null;
}
export interface SeriesResponse { id: string; level: Level; months: SeriesMonth[] }
export interface BaselineMonth { month: number; median: number | null; band_low: number | null; band_high: number | null }
export interface BaselineResponse {
  id: string; period: [number, number]; by_month: BaselineMonth[];   // 항상 12줄
  heat_bins: number[];                                                 // 길이 3 또는 0
}

// ---- /map?month=&parent= , /top?month=&parent=
export type MapBin = 0 | 1 | 2 | 3 | 4;
export type MapPoint = [lon: number, lat: number, day: number, regionId: string | null];
export interface MapRegion { id: string; value: number | null; map_bin: MapBin | null; reason?: "PRE_2012_DISTRICT" }
export interface MapResponse {
  month: string; parent: string; regions: MapRegion[];
  points: { sensor: "MODIS" | "S-NPP" | "NOAA-20"; count: number; shown: number; items: MapPoint[] };
}
export interface TopItem { id: string; label_ko: string; value: number; rank: number | null; n: number | null }
export interface TopResponse { month: string; parent: string; data_version: string; items: TopItem[] }

// ---- /events , /official-fires
export interface FireEvent {
  id: number; start: string; end: string; days: number; cells: number;
  peak_cells: number; peak_date: string; lat: number | null; lon: number | null;
  frp_mw: number | null; regions: string[];
}
export interface EventsResponse { items: FireEvent[] }
export interface OfficialFire { date: string; place: string; cause: string; area_ha: number; region_id: string | null }
export interface OfficialFiresResponse { source: string; count: number; items: OfficialFire[] }   // area_ha 0 = 모름일 수 있음

// ---- /insight/{id}?month=   (시·군·구만)
export type Unavailable = "judge" | "spatial" | "series" | "series_ref" | "prov" | "neighbors";
// 자기 시·도 판정. catalog 응답에 없으면 label_ko·basis가 null이다
export type InsightProv = Omit<JudgementRef, "label_ko" | "basis"> & { label_ko: string | null; basis: Basis | null };
export interface InsightHead {
  value: number | null; chip: Chip | null; region_type: RegionType; judge_unit: JudgeUnit;
  rank: number | null; n: number | null; reason: Reason | null;
  fire_days: number | null; dmax: number | null; dmax_date: string | null;
  annual: number | null; annual_all: number | null;
}
export interface InsightCluster {
  start: string; end: string; days: number; cells: number; peak_cells: number; peak_date: string;
  regions: { id: string; label_ko: string | null }[];
  region_days: number[];                // 묶음 기간 안에서 이 지역에 감지가 있던 날(일, 오름차순)
}
export interface Insight {
  id: string; country: Country; month: string; label_ko: string; province: string | null;
  data_version: string | null;
  head: InsightHead;
  prov: InsightProv | null;
  ref: JudgementRef | null;
  calendar: {
    daily: Record<string, number>;                        // 키 = 일
    main_cluster: InsightCluster | null;                  // 묶음 전체의 값. 이 지역 값이 아님
    clusters: { fire_days: number; peak_day_cells: number; events: number; big_events: number } | null;
    near50: { n: number; first: number | null };          // first = 일
  } | null;
  years: {
    strip: { year: number; v: number }[] | null;          // 2012~2025. 2026년은 없음
    median: number | null; band_low: number | null; band_high: number | null;
    yrs_fire: number | null;
    longterm: { fire_cells_2001_2025: number; annual_avg: number; quality: Quality } | null;   // 키 이름은 원천 그대로라 실제 응답으로 확인
  };
  rank: { top_years: { year: number; v: number; rank: number; tied: boolean }[] | null };
  season: {
    own_mt: number[] | null; ref_mt: number[] | null;     // 12개, 월별 합계(비중 아님)
    ref_id: string | null; risk_months: number[]; risk_share: number | null; risk_from: JudgeUnit;
  };
  official: OfficialFire[] | null;
  detect_rate: { n: number; detected: number; rate: number | null; since: string; window_days: number } | null;
  map: {
    center: [number, number];
    points: [lon: number, lat: number, day: number][];
    rec: { lat: number; lon: number; y: number }[];
  } | null;
  neighbors: {
    id: string; label_ko: string; province: string | null;
    region_type: RegionType; v: number | null; rank: number | null; n: number | null;
  }[];
  unavailable: Unavailable[];                             // 비어 있지 않으면 일부 필드가 null. 이름으로 카드를 숨기지 말고 필드별로 본다
}

// ---- /landing
export type LandingStat =
  | { key: "burned_area_record"; year: number | null; value: number | null; source: string; unit: "ha" }
  | { key: "case_month_ratio"; month: string; value: number | null; cells: number | null; rank: number | null; n: number | null }
  | { key: "risk_share"; value: number | null; months: number[] };
export interface BreakRatio { ratio: number | null; ci95: [number, number] | null }
export interface Landing {
  country: Country; data_version: string | null; labels: Meta["labels"];
  stats: LandingStat[];                                   // key로 찾아 쓴다
  annual: { years: number[]; before: number[]; after: number[] };   // 자료 없는 해는 0
  official_break: { source: string; before: number | null; after: number | null; inconclusive: boolean };
  break_test: { before: BreakRatio; after: BreakRatio; jump_raw: number | null };
  detect_by_size: { bin: string; n: number; detected: number | null; chance: number | null }[];
  detect_n: number;
}
