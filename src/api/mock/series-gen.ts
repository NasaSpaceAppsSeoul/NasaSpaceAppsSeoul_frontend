/*
 * 목 월값 생성기 (`decisions.md` 10-5, 2026-11-14 결정: 모든 지역에 지어낸 시계열).
 * `/series`와 `/judgement`는 모두 이 파일의 `regionValues`에서 값을 받는다. 같은 지역·같은 달이면 두 응답의 값이 같다.
 *
 * 출처
 * - 달 경계 2012-02(S-NPP)·2018-04(NOAA-20), 시·군·구의 2012-02 전 `null`: 백엔드 `Rules.java`, 분석 C-6·D-1.
 * - `nrt` 시작 달: 백엔드 `spec_test.py`의 `status_nrt`(KOR 2026-09, CAL 2026-08). BC·GRC·CHL·NSW는 KOR과 같게 둔다.
 *
 * 지어낸 값
 * - 모든 월값. 지역 ID를 씨앗으로 한 고정 의사난수(같은 입력이면 항상 같은 값)에 계절 가중치와
 *   지역 성격(`region_type`)별 크기를 곱해 만든다. 나라·시·도·시·군·구 값의 합은 서로 맞추지 않는다.
 * - 달 범위 2001-01~2026-11(모든 지역 같음), 마지막 달은 집계 중이라 값을 줄여 둔다.
 * - 2018-04 전 값은 보정값처럼 소수 한 자리, 그 뒤는 정수.
 * - 백엔드 기대값이 있는 지역·달은 `series-overrides.ts`의 값으로 덮는다.
 */
import type { Country, RegionSummary } from "../types";
import { overridesFor } from "./series-overrides";

export const FIRST_MONTH = "2001-01";
export const VIIRS_START = "2012-02";
export const NOAA20_START = "2018-04";

/** `seasonStart`: 누적(ytd) 시즌 시작 달, 목 `meta.labels.season_start`와 같은 값(백엔드 `Country.seasonStart`) */
type CountryTimeline = { last: string; nrtFrom: string; season: readonly number[]; nationScale: number; seasonStart: number };

/** 계절 가중치(1~12월). 한국은 3~4월, 캘리포니아는 7~10월, BC는 7~8월, 그리스는 7~8월, 칠레는 1~2월, NSW는 10~1월이 높다. */
const TIMELINES: Record<Country, CountryTimeline> = {
  KOR: {
    last: "2026-11",
    nrtFrom: "2026-09",
    season: [0.6, 0.9, 2.6, 2.2, 1.0, 0.3, 0.15, 0.15, 0.2, 0.5, 0.8, 0.5],
    nationScale: 70,
    seasonStart: 1,
  },
  CAL: {
    last: "2026-11",
    nrtFrom: "2026-08",
    season: [0.2, 0.2, 0.3, 0.4, 0.6, 1.2, 2.0, 2.4, 2.0, 1.6, 0.8, 0.3],
    nationScale: 250,
    seasonStart: 1,
  },
  BC: {
    last: "2026-11",
    nrtFrom: "2026-09",
    season: [0.1, 0.1, 0.2, 0.5, 0.9, 1.4, 2.8, 3.0, 1.6, 0.6, 0.2, 0.1],
    nationScale: 200,
    seasonStart: 1,
  },
  GRC: {
    last: "2026-11",
    nrtFrom: "2026-09",
    season: [0.3, 0.4, 0.6, 0.5, 0.5, 0.9, 2.4, 2.8, 1.4, 0.7, 0.4, 0.3],
    nationScale: 40,
    seasonStart: 1,
  },
  CHL: {
    last: "2026-11",
    nrtFrom: "2026-09",
    season: [2.6, 2.4, 1.6, 0.8, 0.4, 0.2, 0.1, 0.2, 0.3, 0.6, 1.2, 2.0],
    nationScale: 120,
    seasonStart: 7,
  },
  NSW: {
    last: "2026-11",
    nrtFrom: "2026-09",
    season: [1.8, 0.9, 0.7, 0.6, 0.5, 0.5, 0.6, 0.9, 1.2, 1.8, 2.4, 2.6],
    nationScale: 300,
    seasonStart: 7,
  },
};

export function timeline(country: Country): CountryTimeline {
  return TIMELINES[country];
}

/** "YYYY-MM" → 2001-01부터 센 번호 */
export function monthIndex(month: string): number {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return (year - 2001) * 12 + (m - 1);
}

export function monthAt(index: number): string {
  const year = 2001 + Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${year}-${String(m).padStart(2, "0")}`;
}

/** 나라의 달 목록(시간순) */
export function monthsOf(country: Country): string[] {
  const count = monthIndex(timeline(country).last) + 1;
  return Array.from({ length: count }, (_, i) => monthAt(i));
}

/** FNV-1a 32비트. 문자열을 씨앗 숫자로 바꾼다. */
function hashSeed(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: 씨앗이 같으면 같은 수열을 주는 작은 의사난수 */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shape(month: string, raw: number): number {
  return month < NOAA20_START ? Math.round(raw * 10) / 10 : Math.round(raw);
}

/** 한 달 값. 의사난수를 달마다 정확히 두 번 써서, 앞 달의 분기와 상관없이 같은 달은 같은 수를 받는다. */
function draw(region: RegionSummary, country: Country, month: string, u1: number, u2: number): number {
  const { season, nationScale } = timeline(country);
  const weight = season[Number(month.slice(5, 7)) - 1] ?? 1;
  // Box-Muller로 정규분포 하나를 만들어 로그정규 잡음으로 쓴다
  const gauss = Math.sqrt(-2 * Math.log(1 - u1)) * Math.cos(2 * Math.PI * u2);
  const noise = Math.exp(0.7 * gauss);

  if (region.level === "nat") return shape(month, nationScale * weight * noise);
  if (region.region_type === "none") return u1 < 0.004 ? 1 : 0;
  if (region.level === "prov") {
    const scale = region.region_type === "sufficient" ? 9 : 1.2;
    return shape(month, scale * weight * noise);
  }
  if (region.region_type === "sufficient") return shape(month, 5 * weight * noise);
  // 드문 시·군·구: 대부분 0, 가끔 작은 값
  const chance = Math.min(0.6, 0.12 * weight);
  return u1 < chance ? 1 + Math.floor(u2 * 4 * weight) : 0;
}

export type RegionValues = { months: string[]; values: (number | null)[] };

function generate(country: Country, region: RegionSummary): RegionValues {
  const months = monthsOf(country);
  const { last } = timeline(country);
  const rng = mulberry32(hashSeed(`${country}/${region.id}`));
  const overrides = overridesFor(country, region.id);
  const values = months.map((month): number | null => {
    const u1 = rng();
    const u2 = rng();
    const fixed = overrides.get(month);
    if (fixed !== undefined) return fixed;
    if (region.level === "dist" && month < VIIRS_START) return null;
    const value = draw(region, country, month, u1, u2);
    // 집계 중인 달은 달이 덜 찬 값
    return month === last ? shape(month, value * 0.35) : value;
  });
  return { months, values };
}

const cache = new Map<string, RegionValues>();

/** 요청한 지역만 계산하고 지역별로 캐시한다. */
export function regionValues(country: Country, region: RegionSummary): RegionValues {
  const key = `${country}/${region.id}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const made = generate(country, region);
  cache.set(key, made);
  return made;
}
