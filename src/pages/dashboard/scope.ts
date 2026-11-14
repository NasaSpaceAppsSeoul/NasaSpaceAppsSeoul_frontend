import type { Meta, RegionSummary, SeriesResponse } from "../../api/types";
import type { Country } from "../../lib/country";
import type { MonthRange } from "../../lib/month";

/**
 * 화면이 주소와 기준 자료(`/meta`, `/regions`, 나라 시계열)를 확인한 뒤 구역들에 넘기는 "지금 보는 범위".
 * 구역은 주소를 읽지 않고 이것만 본다.
 */
export type DashboardScope = {
  country: Country;
  meta: Meta;
  regions: RegionSummary[];
  index: Map<string, RegionSummary>;
  /** 지금 지역. 나라 단계면 나라 행 */
  region: RegionSummary;
  /** 지금 지역이 속한 시·도(한국의 시·도·시·군·구 단계). 없으면 `null` */
  province: RegionSummary | null;
  month: string;
  range: MonthRange;
  countrySeries: SeriesResponse;
  /** 화면 언어의 단위 이름 */
  levelNames: { lv1: string; lv2: string };
};

/** 화면이 넘기는 이동. 구역은 주소를 만들지 않고 이것만 부른다. */
export type DashboardNavigate = {
  /** 같은 나라 안의 지역으로(`null`이면 나라). 달은 유지(7-5) */
  toRegion: (regionId: string | null) => void;
  /** 달만 바꾼다 */
  toMonth: (month: string) => void;
  /** 다른 나라로. 달은 빼고 그 나라의 마지막 달로 간다(나라마다 범위가 다르다) */
  toCountry: (country: Country) => void;
  /** 같은 나라 안 지역의 링크 주소(경로 표시용). 달은 유지 */
  regionHref: (regionId: string | null) => string;
  /** 같은 나라 시·군·구의 월간 인사이트 주소. 달은 유지 */
  insightHref: (regionId: string) => string;
  /** 공유 대화상자를 연다(지난 복사 결과는 비운다). 복사는 대화상자 안 "링크 복사"에서 한다(13절) */
  share: () => void;
};

export type ControlsDialog = "province" | "district" | "search" | "month" | "share" | null;
