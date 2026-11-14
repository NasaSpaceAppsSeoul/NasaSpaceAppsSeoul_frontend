/*
 * 칠레 목 (`decisions.md` 10-5a, 9장). 숫자는 한국 목과 같은 값을 쓰고, 구조만 이 나라대로 넣는다.
 * - `labels`, `sources`, `time_basis`: 백엔드 `Country.java`(`abfd9fe`)의 값.
 * - 시군 6곳: 이름은 실제 시군(코무나)이지만 ID 숫자와 도형(사각형), `region_type`은 지어낸 값이다.
 *   ID는 서버 `/regions`의 모양(`31580391B…`)을 흉내 냈다. 남북으로 긴 나라라 상자도 세로로 길다.
 * - 백엔드는 주 단계가 있지만(`single: false`) 목 생성기는 한 단계만 만든다.
 *   주 행이 없는 목에 `single: false`를 주면 선택 줄·지도가 비므로 목은 `true`로 둔다. 두 단계 화면은 서버로 확인한다.
 */
import { korMeta } from "./kor";
import { singleLevelCountry } from "./grid";
import type { CountryMock } from "./types";

const { regions, geo, detail } = singleLevelCountry(
  "CHL",
  { labelKo: "칠레", nameEn: "Chile", box: [-75.7, -56.0, -66.4, -17.5] },
  [
    { id: "31580391B10000000000001", name: "Antofagasta", regionType: "none" },
    { id: "31580391B10000000000002", name: "Valparaíso", regionType: "sufficient" },
    { id: "31580391B10000000000003", name: "Santiago", regionType: "sparse" },
    { id: "31580391B10000000000004", name: "Concepción", regionType: "sufficient" },
    { id: "31580391B10000000000005", name: "Temuco", regionType: "sufficient" },
    { id: "31580391B10000000000006", name: "Puerto Montt", regionType: "sparse" },
  ],
);

export const chl: CountryMock = {
  meta: {
    ...korMeta,
    country: "CHL",
    data_end: "2026-11-14",
    labels: {
      country: "칠레",
      short: "칠레",
      lv1: "주",
      lv2: "시군",
      single: true,
      official: "CONAF",
      boundary: "geoBoundaries CHL (칠레 국회도서관 BCN, CC BY 3.0 IGO)",
      bins: [1, 2, 5],
    },
    sources: ["NASA FIRMS", "geoBoundaries (BCN, CC BY 3.0 IGO)", "CONAF"],
    time_basis: { code: "solar", label_ko: "픽셀 경도 기준 태양시" },
    external_validation: { ...korMeta.external_validation, source: "CONAF" },
  },
  regions,
  geo,
  detail,
  missingGeoLevels: [],
};
