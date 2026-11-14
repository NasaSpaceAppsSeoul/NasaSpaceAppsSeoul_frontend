/*
 * 목 `/insight`의 감지 점 쪽 값(백엔드 spatial 서비스에 해당): 일별 달력, 감지 묶음, 공식 기록, 감지율, 지도 점.
 *
 * 출처: 모양과 `null` 규칙은 백엔드 `SpatialService.java`·`InsightService.java`, 분석 G-3·G-6.
 * - `main_cluster`는 2018-04 전에는 항상 `null`, `clusters`는 자료가 없어도 0으로 채운다(G-7 10).
 * - 2012-02 전 시·군·구는 값이 없어도 달력·지도에 MODIS 점이 들어온다(G-6).
 * - `detect_rate.rate`는 0~1 비율(소수 두 자리), 기록이 없으면 `null`. `window_days`는 항상 2(`SpatialService.java:376`).
 *
 * 지어낸 값: 이 파일의 모든 숫자. 그 달 값(`value`)을 날짜에 고정 규칙으로 나눠 `daily`를 만들고,
 * 나머지는 `daily`에서 셈한다. 의성군 2025-03은 `insight-route.ts`가 백엔드 기대값으로 덮는다.
 */
import type { Country, Insight, OfficialFire, RegionSummary } from "../types";
import { NOAA20_START, VIIRS_START } from "./series-gen";

export type Spatial = {
  calendar: NonNullable<Insight["calendar"]>;
  official: OfficialFire[];
  detect_rate: NonNullable<Insight["detect_rate"]>;
  map: NonNullable<Insight["map"]>;
  fire_days: number | null;
  dmax: number | null;
  dmax_date: string | null;
};

function daysIn(month: string): number {
  const year = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 그 달 값을 연속한 며칠에 나눈다. 가운데 날이 가장 많다. 합은 정수로 내린 값과 같다. */
function spread(month: string, seed: number, value: number): Record<string, number> {
  const total = Math.floor(value);
  if (total <= 0) return {};
  const length = daysIn(month);
  const span = Math.min(length, Math.max(1, Math.round(Math.sqrt(total))));
  const start = 1 + (seed % (length - span + 1));
  const weights = Array.from({ length: span }, (_, i) => 1 + Math.min(i, span - 1 - i));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.floor((total * w) / weightSum));
  const mid = Math.floor(span / 2);
  counts[mid] = (counts[mid] ?? 0) + total - counts.reduce((a, b) => a + b, 0);
  const daily: Record<string, number> = {};
  counts.forEach((count, i) => {
    if (count > 0) daily[String(start + i)] = count;
  });
  return daily;
}

const dateOf = (month: string, day: number) => `${month}-${String(day).padStart(2, "0")}`;

/** 감지 점이 있던 날의 수, 하루 최대 칸 수와 그 날(같으면 앞 날) */
export function dailyStats(month: string, daily: Record<string, number>) {
  let dmax = 0;
  let dmaxDay: number | null = null;
  for (const [day, count] of Object.entries(daily)) {
    if (count > dmax || (count === dmax && dmaxDay !== null && Number(day) < dmaxDay)) {
      dmax = count;
      dmaxDay = Number(day);
    }
  }
  return { fireDays: Object.keys(daily).length, dmax, dmaxDate: dmaxDay === null ? null : dateOf(month, dmaxDay) };
}

function mapOf(region: RegionSummary, daily: Record<string, number>, seed: number): Spatial["map"] {
  const center = region.center ?? [0, 0];
  const points: [number, number, number][] = [];
  for (const [day, count] of Object.entries(daily)) {
    for (let i = 0; i < Math.min(count, 12); i += 1) {
      const dx = (((seed >>> (i % 16)) % 100) - 50) / 1000;
      const dy = ((((seed >>> ((i + 5) % 16)) % 100) - 50) / 1000) * (Number(day) % 2 === 0 ? 1 : -1);
      points.push([Math.round((center[0] + dx) * 1000) / 1000, Math.round((center[1] + dy) * 1000) / 1000, Number(day)]);
    }
  }
  const rec = Array.from({ length: 5 }, (_, i) => ({
    lon: Math.round((center[0] + (i - 2) * 0.02) * 100) / 100,
    lat: Math.round((center[1] + ((i % 3) - 1) * 0.02) * 100) / 100,
    y: 1 + ((seed + i) % 4),
  }));
  return { center, points, rec };
}

function officialOf(country: Country, region: RegionSummary, value: number, dmaxDate: string | null): OfficialFire[] {
  if (value < 5 || dmaxDate === null) return [];
  const place = country === "KOR" ? `${region.province ?? ""} ${region.label_ko.replace(/[시군구]$/, "")}`.trim() : region.label_ko;
  return [
    {
      date: dmaxDate,
      place,
      cause: country === "KOR" ? "원인 미상" : "번개",
      area_ha: Math.round(value * 37) / 10,
      region_id: region.id,
    },
  ];
}

function detectRateOf(seed: number): Spatial["detect_rate"] {
  const n = 8 + (seed % 30);
  const detected = Math.round(n * (0.2 + (seed % 50) / 100));
  return { n, detected, rate: Math.round((detected * 100) / n) / 100, since: "2018-04", window_days: 2 };
}

/**
 * 한 지역·한 달의 감지 점 쪽 값. `value`는 그 달 판정 값(`null`이면 2012-02 전 시·군·구).
 * 2012-02 전에는 값이 없어도 MODIS 점이 작게 들어온다.
 */
export function spatialFor(country: Country, region: RegionSummary, month: string, value: number | null, neighbor: RegionSummary | null): Spatial {
  const seed = hash(`${country}/${region.id}/${month}`);
  const preDistrict = value === null && month < VIIRS_START;
  const daily = preDistrict ? { "5": 1, "12": 2 } : spread(month, seed, value ?? 0);
  const { fireDays, dmax, dmaxDate } = dailyStats(month, daily);
  const days = Object.keys(daily).map(Number);
  const first = days.length > 0 ? Math.min(...days) : null;
  const last = days.length > 0 ? Math.max(...days) : null;
  const clustered = month >= NOAA20_START && value !== null && value >= 10 && first !== null && last !== null;

  const mainCluster: Spatial["calendar"]["main_cluster"] = clustered
    ? {
        start: dateOf(month, first),
        end: dateOf(month, last),
        days: last - first + 1,
        cells: Math.round(value * 1.4),
        peak_cells: Math.round(dmax * 1.2),
        peak_date: dmaxDate ?? dateOf(month, first),
        regions: [
          { id: region.id, label_ko: region.label_ko },
          ...(value >= 30 && neighbor !== null ? [{ id: neighbor.id, label_ko: neighbor.label_ko }] : []),
        ],
      }
    : null;
  const hasEvents = month >= NOAA20_START && value !== null && value > 0;

  return {
    calendar: {
      daily,
      main_cluster: mainCluster,
      clusters: {
        fire_days: month >= NOAA20_START ? fireDays : 0,
        peak_day_cells: month >= NOAA20_START ? dmax : 0,
        events: hasEvents ? Math.max(1, Math.round(value / 15)) : 0,
        big_events: clustered ? 1 : 0,
      },
      near50: first === null ? { n: 0, first: null } : { n: Math.round((value ?? 3) * 0.8), first },
    },
    official: officialOf(country, region, value ?? 0, dmaxDate),
    detect_rate: detectRateOf(seed),
    map: mapOf(region, daily, seed),
    fire_days: preDistrict ? null : fireDays,
    dmax: preDistrict ? null : dmax,
    dmax_date: preDistrict ? null : dmaxDate,
  };
}
