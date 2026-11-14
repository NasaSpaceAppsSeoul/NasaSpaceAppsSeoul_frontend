import type { Country } from "./country";
import { localizePath, type Locale } from "./locale";

/**
 * 월간 인사이트 주소 (`/insight/:country/:regionId?month=`). 시·군·구만 들어간다.
 * 지역은 경로(인코딩), 달은 쿼리. 달이 없으면 쿼리를 붙이지 않는다(화면이 마지막 달로 채운다).
 */
export function insightPath(locale: Locale, country: Country, regionId: string, month?: string | null): string {
  const query = month !== undefined && month !== null ? `?month=${month}` : "";
  return `${localizePath(`/insight/${country}/${encodeURIComponent(regionId)}`, locale)}${query}`;
}
