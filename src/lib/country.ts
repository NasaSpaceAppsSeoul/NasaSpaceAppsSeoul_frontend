/** 서버가 주는 나라 목록은 없다. 백엔드가 받는 세 나라를 상수로 둔다(대문자만). */
export const COUNTRIES = ["KOR", "CAL", "BC"] as const;
export type Country = (typeof COUNTRIES)[number];

/** 나라를 고르지 않았을 때 쓰는 나라. */
export const DEFAULT_COUNTRY: Country = "KOR";

function isCountry(value: string): value is Country {
  return (COUNTRIES as readonly string[]).includes(value);
}

/** 주소의 나라 코드를 검사한다. 대문자 `KOR`·`CAL`·`BC`가 아니면 `null`. */
export function parseCountry(value: string | undefined): Country | null {
  return value !== undefined && isCountry(value) ? value : null;
}
