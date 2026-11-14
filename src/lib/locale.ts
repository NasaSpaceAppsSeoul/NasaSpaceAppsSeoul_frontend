export const LOCALES = ["ko", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ko";

/** 기본 언어(한글)는 주소에 접두사가 없고, 영어는 `/en`으로 시작한다. */
const PREFIX: Record<Locale, string> = { ko: "", en: "/en" };

function hasPrefix(pathname: string, prefix: string): boolean {
  return prefix !== "" && (pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** 주소에서 언어를 읽는다. 접두사가 없으면 기본 언어다. */
export function localeFromPath(pathname: string): Locale {
  return LOCALES.find((locale) => hasPrefix(pathname, PREFIX[locale])) ?? DEFAULT_LOCALE;
}

/** 언어 접두사를 뗀 경로. 항상 `/`로 시작한다. */
export function stripLocale(pathname: string): string {
  const prefix = PREFIX[localeFromPath(pathname)];
  const rest = prefix === "" ? pathname : pathname.slice(prefix.length);
  return rest.startsWith("/") ? rest : `/${rest}`;
}

/** 접두사 없는 경로(`/dashboard/KOR`)에 언어 접두사를 붙인다. */
export function localizePath(path: string, locale: Locale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const prefix = PREFIX[locale];
  if (prefix === "") return normalized;
  return normalized === "/" ? prefix : `${prefix}${normalized}`;
}

/** 지금 주소를 같은 화면의 다른 언어 주소로 바꾼다. */
export function switchLocalePath(pathname: string, locale: Locale): string {
  return localizePath(stripLocale(pathname), locale);
}
