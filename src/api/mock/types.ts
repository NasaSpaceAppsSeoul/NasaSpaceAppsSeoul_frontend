import type { GeoFeature, Level, Meta, RegionSummary } from "../types";

/** 경계 하나와 그 경계의 상위 ID. 백엔드는 `parent`를 이 값과 정확히 비교한다. */
export type MockGeo = { level: Level; parentId: string | null; feature: GeoFeature };

/** 한 나라의 목 묶음. 목에 없는 경계 단계는 `missingGeoLevels`에 적는다(목의 한계, 실제 서버와 다름). */
export type CountryMock = {
  meta: Meta;
  regions: RegionSummary[];
  geo: () => MockGeo[];
  missingGeoLevels: Level[];
};
