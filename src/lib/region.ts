import type { Locale } from "./locale";

/*
 * 지역 이름·상위 지역·검색. `lib`은 `api`를 가져오지 않으므로 `/regions` 항목 중 쓰는 필드만 구조 타입으로 받는다.
 */

export type RegionLevel = "nat" | "prov" | "dist";

export type NamedRegion = {
  id: string;
  label_ko: string;
  name_en: string | null;
  level: RegionLevel;
  /** 소속 시·도 이름(= 시·도 ID). 시·도 자신은 자기 이름. 나라와 CAL·BC는 `null` */
  province: string | null;
};

export type RegionIndex = ReadonlyMap<string, NamedRegion>;

export function indexRegions<T extends NamedRegion>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((r) => [r.id, r]));
}

/** 그 언어의 이름 하나(시·도를 붙이지 않음). 영어 화면은 `name_en`, 없으면 `label_ko`(2026-11-14 사용자 결정). */
export function ownName(region: NamedRegion, locale: Locale): string {
  return locale === "en" ? (region.name_en ?? region.label_ko) : region.label_ko;
}

/**
 * 화면에 쓰는 지역 이름 (스킬 `burnline-api` 2번).
 * 시·군·구이고 `province`가 있을 때만 "시·도 + 이름"으로 붙인다(한국에는 같은 이름의 시·군·구가 7가지 있다).
 * 영어 화면의 시·도 이름은 그 시·도 행의 `name_en`을 찾아 쓴다.
 */
export function regionName(region: NamedRegion, index: RegionIndex, locale: Locale): string {
  const own = ownName(region, locale);
  if (region.level !== "dist" || region.province === null) return own;
  const province = index.get(region.province);
  const provinceName = province !== undefined ? ownName(province, locale) : region.province;
  return `${provinceName} ${own}`;
}

/** 이름만 아는 지역(빌린 판정의 `ref` 등). `/regions`에 있으면 그 행으로, 없으면 받은 이름 그대로. */
export function regionNameById(id: string, fallback: string, index: RegionIndex, locale: Locale): string {
  const region = index.get(id);
  return region !== undefined ? regionName(region, index, locale) : fallback;
}

/**
 * 지역 계층의 상위 지역 ID. 경로 표시와 시·군·구 목록 거르기에 쓴다.
 * 나라 → 없음, 시·도 → 나라, 시·군·구 → 소속 시·도(시·도 단계가 없는 나라는 나라).
 * 주의: `/map`·`/top`에 넘기는 `parent` 값(스킬 `burnline-api` 4번의 `parentFor`)과는 다르다. 그건 4장에서 따로 만든다.
 */
export function parentOf(region: NamedRegion, countryId: string, single: boolean): string | null {
  if (region.level === "nat") return null;
  if (region.level === "prov") return countryId;
  return single || region.province === null ? countryId : region.province;
}

/** 나라 → (시·도) → 지역 순서의 경로. 찾지 못한 단계는 건너뛴다. */
export function regionPath<T extends NamedRegion>(region: T, countryId: string, single: boolean, index: ReadonlyMap<string, T>): T[] {
  const path: T[] = [];
  let current: T | undefined = region;
  while (current !== undefined) {
    path.unshift(current);
    const parent = parentOf(current, countryId, single);
    current = parent === null ? undefined : index.get(parent);
  }
  return path;
}

/** 시·도 목록과 시·군·구 목록의 정렬: 가나다순(영어 화면은 알파벳순) (`decisions.md` 7-4). */
export function sortByName<T extends NamedRegion>(items: readonly T[], index: RegionIndex, locale: Locale): T[] {
  const collator = new Intl.Collator(locale === "ko" ? "ko" : "en");
  return [...items].sort((a, b) => collator.compare(regionName(a, index, locale), regionName(b, index, locale)));
}

export const SEARCH_LIMIT = 20;

export type SearchResult<T> = { items: T[]; truncated: boolean };

/**
 * 지역 검색 (`decisions.md` 7-3). `/regions`를 한 번 받아 프론트에서 거른다.
 * 한글 이름, 영문 이름, "시·도 + 이름"에 부분 일치, 대소문자 무시. 나라 → 시·도 → 시·군·구 순서로 최대 20곳.
 */
export function searchRegions<T extends NamedRegion>(items: readonly T[], query: string, index: RegionIndex): SearchResult<T> {
  const needle = query.trim().toLowerCase();
  if (needle === "") return { items: [], truncated: false };
  const rank: Record<RegionLevel, number> = { nat: 0, prov: 1, dist: 2 };
  const hits = items.filter((r) =>
    [r.label_ko, r.name_en ?? "", regionName(r, index, "ko"), regionName(r, index, "en")].some((text) =>
      text.toLowerCase().includes(needle),
    ),
  );
  const ordered = [...hits].sort((a, b) => rank[a.level] - rank[b.level]);
  return { items: ordered.slice(0, SEARCH_LIMIT), truncated: ordered.length > SEARCH_LIMIT };
}
