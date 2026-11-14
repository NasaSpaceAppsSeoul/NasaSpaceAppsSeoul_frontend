import { get, withQuery, type GetOptions } from "./client";
import type { Country, GeoFeatureCollection, GeoParams, Meta, RegionDetail, RegionsResponse } from "./types";

/** `/meta`: 나라 하나의 설정. 나라가 준비됐는지는 이 응답으로만 판단한다(404 `COUNTRY_NOT_READY`). */
export function getMeta(country: Country, options?: GetOptions): Promise<Meta> {
  return get<Meta>(`/${country}/meta`, options);
}

/** `/regions`: 그 나라의 모든 지역. 검색·시·도별 필터는 프론트에서 한다. */
export function getRegions(country: Country, options?: GetOptions): Promise<RegionsResponse> {
  return get<RegionsResponse>(`/${country}/regions`, options);
}

/** `/regions/{id}`: 한 지역의 이웃(`neighbors`, 같은 단계)과 위험 시기(`risk_months`). 이웃의 `province` 키는 다른 시·도일 때만 온다. */
export function getRegionDetail(country: Country, id: string, options?: GetOptions): Promise<RegionDetail> {
  return get<RegionDetail>(`/${country}/regions/${encodeURIComponent(id)}`, options);
}

/** `/geo`: 경계. 전체 경계는 `parent` 없이 부른다. 한글 시·도 ID는 `withQuery`가 인코딩한다. */
export function getGeo(country: Country, params: GeoParams = {}, options?: GetOptions): Promise<GeoFeatureCollection> {
  return get<GeoFeatureCollection>(withQuery(`/${country}/geo`, { level: params.level, parent: params.parent }), options);
}
