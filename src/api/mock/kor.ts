/*
 * 한국 목 (`decisions.md` 10-3·10-4).
 *
 * 출처
 * - `/regions`, `/geo?level=dist`: `data/*.json`. `.claude/reference/scripts/build-mock-kor.py`가
 *   파이프라인 경계 파일(`data_jjya/output/KOR/regions.geojson`, 228곳)과 백엔드 한글 이름표
 *   (`KOR_district_ko.csv`)로 만들었다. 정렬·중심·상자는 백엔드 `CatalogLoader` 규칙을 따른다.
 * - `/meta`의 `labels`, `sources`, `time_basis`, `unit`, `calibration.chain`, `judgement_params`:
 *   백엔드 `Country.java`·`CatalogService.java`(6c52daf)와 분석 파일 B-1의 값.
 *
 * 목의 한계 (실제 서버와 다름)
 * - 영광군(`PATCH-KOR-Yeonggwang`)은 경계 파일에 도형이 없어 `/geo`에 없고, `/regions`의 `center`·`bbox`가
 *   `null`, `region_type`은 지어낸 값(`sparse`)이다. 실제 서버에는 도형이 있다.
 * - `/regions/{id}`의 이웃·위험 시기: `data/kor-detail.json`. 같은 스크립트의 `--detail`이 파이프라인
 *   `regions.geojson`(시·군·구), `calendar_by_province.json`(시·도), `meta.json` `national_risk`(나라)에서 뽑았다(5장).
 *   영광군은 경계 파일에 없어 이웃·위험 시기가 없다.
 * - 시·도 경계(`/geo?level=prov`): `data/kor-prov.geo.json`. `.claude/reference/scripts/build-mock-kor-prov.py`가
 *   geoBoundaries ADM1 17곳의 영문 이름을 백엔드 시·도 ID(`경북` 등)로 바꿔 만들었다(4장).
 * - 의성군의 `region_type`은 경계 원천에서 `sufficient`로 나오지만 백엔드 기대값(`spec_test.py`, 명세 7-2)은
 *   `sparse`라 읽을 때 `sparse`로 바꾼다. `/regions`와 `/judgement`가 같은 값을 주게 하려는 것이다.
 *
 * 지어낸 값: `/meta`의 `data_version`, `generated_at`, `data_range`, `calibration.modis_to_snpp_by_month`
 * (옛 MODIS 파이프라인 계수, 3월만 백엔드 기대값 1.721), `external_validation`.
 * `validation`은 백엔드 `spec_test.py` 기대값(0.99, [0.92, 1.05], 2.67 → 1.04).
 */
import type { Meta, RegionSummary } from "../types";
import korGeo from "./data/kor-dist.geo.json";
import korProvGeo from "./data/kor-prov.geo.json";
import korDetail from "./data/kor-detail.json";
import korRegions from "./data/kor-regions.json";
import { expectDetails, expectFeatureCollection, expectRegions, type MockDetailJson } from "./guards";
import { UISEONG } from "./series-overrides";
import type { CountryMock, MockGeo } from "./types";

export const korMeta: Meta = {
  country: "KOR",
  data_version: "2026-11-11",
  generated_at: "2026-11-11T02:10:00+09:00",
  data_end: "2026-10-31",
  unit: "NOAA-20 기준 화재 칸 (0.01° 칸 × 현지 하루)",
  data_range: {
    modis: ["2000-11-02", "2026-10-31"],
    viirs_snpp: ["2012-01-24", "2026-10-30"],
    noaa20: ["2018-04-01", "2026-10-31"],
    noaa21: ["2024-01-17", "2026-10-31"],
  },
  judgement_params: { band_q: [0.15, 0.85], band_noise: 2, min_annual: 11.1, risk_share: 0.5 },
  calibration: {
    chain: "Terra → MODIS → S-NPP → NOAA-20",
    modis_to_snpp_by_month: {
      "1": 3.32, "2": 2.162, "3": 1.721, "4": 1.76, "5": 1.568, "6": 3.248,
      "7": 0.786, "8": 0.812, "9": 2.201, "10": 1.725, "11": 1.543, "12": 4.712,
    },
  },
  validation: {
    break_test_ratio: 0.99,
    break_test_ci95: [0.92, 1.05],
    official_break: { before: 2.67, after: 1.04, inconclusive: false },
  },
  labels: {
    country: "대한민국",
    short: "전국",
    lv1: "시·도",
    lv2: "시·군·구",
    single: false,
    official: "산림청",
    boundary: "geoBoundaries (CC BY 3.0) + 영광군 보강",
    bins: [3, 10, 30],
    season_start: 1,
  },
  sources: ["NASA FIRMS", "geoBoundaries (CC BY 3.0)", "산림청"],
  time_basis: { code: "UTC+9", label_ko: "한국 표준시 (UTC+9)" },
  external_validation: { available: true, source: "산림청", records: 6213, period: ["2012", "2025"] },
  filters: [],
  source_products: null,
  // 서버 `/KOR/meta` 응답(2026-11-15, 백엔드 dfea737) 그대로
  method_stats: {
    grid_sensitivity: [
      { "월별 R²": 0.74, "격자(도)": 0.1, "연간 오차 %": 16.3 },
      { "월별 R²": 0.784, "격자(도)": 0.05, "연간 오차 %": 15.8 },
      { "월별 R²": 0.891, "격자(도)": 0.02, "연간 오차 %": 14.4 },
      { "월별 R²": 0.923, "격자(도)": 0.01, "연간 오차 %": 14.9 },
    ],
    loocv_annual_error_pct: 14.9,
    calibration_error_pct: { terra_to_modis: 11.2, snpp_to_noaa20: 6.2, noaa21_to_noaa20: 23.4 },
    rank_corr: { annual_vs_count: 0.69, annual_vs_area: 0.54, big_fires_vs_cells: 0.75 },
  },
};

function korGeoList(): MockGeo[] {
  const collection = expectFeatureCollection(korGeo, "kor-dist.geo.json");
  return collection.features.map((feature) => ({
    level: "dist",
    parentId: feature.properties.province,
    feature,
  }));
}

function korProvGeoList(): MockGeo[] {
  const collection = expectFeatureCollection(korProvGeo, "kor-prov.geo.json");
  return collection.features.map((feature) => ({ level: "prov", parentId: "KOR", feature }));
}

export const kor: CountryMock = {
  meta: korMeta,
  regions: expectRegions(korRegions, "kor-regions.json").map((r): RegionSummary =>
    r.id === UISEONG ? { ...r, region_type: "sparse" } : r,
  ),
  geo: () => [...korGeoList(), ...korProvGeoList()],
  missingGeoLevels: [],
  detail: (id) => {
    const row = korDetails().get(id);
    if (row === undefined) return undefined;
    return { neighbors: row.neighbors, risk: { months: row.risk_months, share: row.risk_share, from: row.risk_from } };
  },
};

let details: Map<string, MockDetailJson> | null = null;
/** 처음 부를 때 한 번만 읽는다 */
function korDetails(): Map<string, MockDetailJson> {
  details ??= expectDetails(korDetail, "kor-detail.json");
  return details;
}
