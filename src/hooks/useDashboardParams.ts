import { useParams, useSearchParams } from "react-router-dom";
import { parseCountry, type Country } from "../lib/country";
import { parseMonthParam } from "../lib/month";

export type DashboardParams =
  | { valid: true; country: Country; regionId: string | undefined; month: string | undefined }
  | { valid: false };

/**
 * 대시보드·월간 인사이트 주소를 한 곳에서 읽고 검사한다(`decisions.md` 1-5).
 * **화면(`pages`)에서만 부른다.** 구역과 컴포넌트는 여기서 나온 값을 props로 받는다.
 */
export function useDashboardParams(): DashboardParams {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const country = parseCountry(params.country);
  const month = parseMonthParam(searchParams.get("month"));
  if (country === null || !month.valid) return { valid: false };
  return { valid: true, country, regionId: params.regionId, month: month.month };
}
