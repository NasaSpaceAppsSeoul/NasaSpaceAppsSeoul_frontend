import type { GeoFeature, JudgeUnit, Level, Meta, RegionSummary } from "../types";

/** 경계 하나와 그 경계의 상위 ID. 백엔드는 `parent`를 이 값과 정확히 비교한다. */
export type MockGeo = { level: Level; parentId: string | null; feature: GeoFeature };

/** 한 나라의 목 묶음. 목에 없는 경계 단계는 `missingGeoLevels`에 적는다(목의 한계, 실제 서버와 다름). */
export type CountryMock = {
  meta: Meta;
  regions: RegionSummary[];
  geo: () => MockGeo[];
  missingGeoLevels: Level[];
  /** `/regions/{id}`의 재료. 이웃 ID(같은 단계)와, 원천에 있으면 위험 시기. 재료가 없는 ID는 `undefined` */
  detail: (id: string) => MockDetail | undefined;
};

/** 위험 시기(`risk`)가 없으면 목이 시계열에서 만든다(`detail-route.ts`) */
export type MockDetail = {
  neighbors: readonly string[];
  risk?: { months: readonly number[]; share: number | null; from: JudgeUnit };
};
