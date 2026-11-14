import type { Country } from "./country";
import { localizePath, type Locale } from "./locale";

/**
 * 대시보드 주소 (`/dashboard/:country[/:regionId]?month=`). 지역은 경로, 달은 쿼리.
 * 나라 자신(지역 ID가 나라 ID)이면 지역을 붙이지 않는다. 한글 시·도 ID는 인코딩한다.
 */
export function dashboardPath(locale: Locale, country: Country, regionId?: string | null, month?: string | null): string {
  const region = regionId !== undefined && regionId !== null && regionId !== country ? `/${encodeURIComponent(regionId)}` : "";
  const query = month !== undefined && month !== null ? `?month=${month}` : "";
  return `${localizePath(`/dashboard/${country}${region}`, locale)}${query}`;
}
