import type { Meta, RegionSummary } from "../../api/types";
import type { Country } from "../../lib/country";

/**
 * 화면이 주소와 기준 자료(`/meta`, `/regions`)를 확인한 뒤 구역들에 넘기는 "지금 보는 범위".
 * 구역은 주소를 읽지 않고 이것만 본다. `region`은 항상 시·군·구다.
 */
export type InsightScope = {
  country: Country;
  meta: Meta;
  index: Map<string, RegionSummary>;
  region: RegionSummary;
  month: string;
  /** 화면 언어의 지역 이름(한국 시·군·구는 이름만, 경로에서 시·도가 보인다) */
  name: string;
  /** "2025년 3월" / "March 2025" */
  monthLabel: string;
  /** "3월" / "March" */
  monthName: string;
  /** 그 달 나라 시계열의 `status`(집계 중 판단에 `head.reason`과 함께 쓴다). 모르면 `null` */
  countryStatus: string | null;
  /** `/insight`를 다시 받는다(구역 안내의 "다시 시도") */
  retry: () => void;
};
