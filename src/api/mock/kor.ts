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
 * - 시·도 경계(`/geo?level=prov`)는 아직 없다(4장에서 넣는다). 실제 서버는 17곳을 준다.
 *
 * 지어낸 값: `/meta`의 `data_version`, `generated_at`, `data_range`, `calibration.modis_to_snpp_by_month`
 * (옛 MODIS 파이프라인 계수), `validation`, `external_validation`.
 */
import type { Meta } from "../types";
import korGeo from "./data/kor-dist.geo.json";
import korRegions from "./data/kor-regions.json";
import { expectFeatureCollection, expectRegions } from "./guards";
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
      "1": 3.32, "2": 2.162, "3": 1.847, "4": 1.76, "5": 1.568, "6": 3.248,
      "7": 0.786, "8": 0.812, "9": 2.201, "10": 1.725, "11": 1.543, "12": 4.712,
    },
  },
  validation: {
    break_test_ratio: 0.97,
    break_test_ci95: [0.89, 1.05],
    official_break: { before: 1.82, after: 0.97, inconclusive: false },
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
  },
  sources: ["NASA FIRMS", "geoBoundaries (CC BY 3.0)", "산림청"],
  time_basis: { code: "UTC+9", label_ko: "한국 표준시 (UTC+9)" },
  external_validation: { available: true, source: "산림청", records: 6213, period: ["2012", "2025"] },
  filters: [],
  source_products: null,
};

function korGeoList(): MockGeo[] {
  const collection = expectFeatureCollection(korGeo, "kor-dist.geo.json");
  return collection.features.map((feature) => ({
    level: "dist",
    parentId: feature.properties.province,
    feature,
  }));
}

export const kor: CountryMock = {
  meta: korMeta,
  regions: expectRegions(korRegions, "kor-regions.json"),
  geo: korGeoList,
  missingGeoLevels: ["prov"],
};
