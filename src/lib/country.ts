/** 서버가 주는 나라 목록은 없다. 백엔드가 받는 여섯 지역을 상수로 둔다(대문자만, 백엔드 `Country.java` 순서). */
export const COUNTRIES = ["KOR", "CAL", "BC", "GRC", "CHL", "NSW"] as const;
export type Country = (typeof COUNTRIES)[number];

/** 나라를 고르지 않았을 때 쓰는 나라. */
export const DEFAULT_COUNTRY: Country = "KOR";

function isCountry(value: string): value is Country {
  return (COUNTRIES as readonly string[]).includes(value);
}

/** 주소의 나라 코드를 검사한다. `COUNTRIES`의 대문자 코드가 아니면 `null`. */
export function parseCountry(value: string | undefined): Country | null {
  return value !== undefined && isCountry(value) ? value : null;
}
