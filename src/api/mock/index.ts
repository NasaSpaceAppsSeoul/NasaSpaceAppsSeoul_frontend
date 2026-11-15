/*
 * 목 응답 (`decisions.md` 10절). `api/client.ts`의 `get()`이 목 모드일 때만 불러온다.
 * 목에 없는 요청은 백엔드와 같은 모양의 에러를 던진다(10-6):
 * - 모르는 나라 코드 → 모든 경로 404 `COUNTRY_NOT_READY` (백엔드 `CountryConverter`)
 * - 목 묶음이 없는 나라 → `/meta` 404 `COUNTRY_NOT_READY`, `/regions`·`/geo`는 200 빈 목록 (준비 안 된 나라, 2-6)
 * - 모르는 지역 ID → 404 `REGION_NOT_FOUND`
 * - 잘못된 `level` → 400 `INVALID_PARAM`
 * - `/series`·`/judgement`의 달 검사는 `series-route.ts`(지역 먼저, 달 나중)
 * - 목에 아직 없는 경로 → 404 `NOT_FOUND`, message가 "mock: not implemented"로 시작한다(경로 오타와 구분)
 */
import { parseCountry, type Country } from "../../lib/country";
import { ApiError } from "../client";
import type { GeoFeatureCollection, RegionSummary, RegionsResponse } from "../types";
import { bc } from "./bc";
import { cal } from "./cal";
import { chl } from "./chl";
import { grc } from "./grc";
import { mockBaseline } from "./baseline-route";
import { mockInsight } from "./insight-route";
import { isLevel } from "./guards";
import { kor } from "./kor";
import { nsw } from "./nsw";
import { mockLanding } from "./landing";
import { mockMap } from "./map-route";
import { mockRegionDetail } from "./detail-route";
import { mockTop } from "./top-route";
import { mockBulkJudgement, mockJudgement, mockSeries } from "./series-route";
import type { CountryMock } from "./types";

export type MockTable = Partial<Record<Country, CountryMock>>;

/** 로딩 화면이 보이도록 넣는 지연(10-7). 테스트에서는 넣지 않는다. */
const DEFAULT_DELAY_MS = import.meta.env.MODE === "test" ? 0 : 300;

function notImplemented(path: string): ApiError {
  return new ApiError(404, "NOT_FOUND", `mock: not implemented: ${path}`);
}

function wait(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/** 백엔드 `q` 검색: `label_ko`, `name_en`, "시·도 + 이름"에 부분 일치, 대소문자 무시. */
function matchesQuery(region: RegionSummary, q: string): boolean {
  const needle = q.toLowerCase();
  const haystacks = [region.label_ko, region.name_en ?? "", `${region.province ?? ""} ${region.label_ko}`];
  return haystacks.some((text) => text.toLowerCase().includes(needle));
}

function regions(mock: CountryMock | undefined, query: URLSearchParams): RegionsResponse {
  const level = query.get("level");
  if (level !== null && !isLevel(level)) throw new ApiError(400, "INVALID_PARAM", `bad level: ${level}`);
  const q = query.get("q");
  const items = (mock?.regions ?? []).filter(
    (r) => (level === null || r.level === level) && (q === null || q === "" || matchesQuery(r, q)),
  );
  return { items };
}

function geo(mock: CountryMock | undefined, query: URLSearchParams, path: string): GeoFeatureCollection {
  const levelParam = query.get("level") ?? "dist";
  if (!isLevel(levelParam)) throw new ApiError(400, "INVALID_PARAM", `bad level: ${levelParam}`);
  if (mock?.missingGeoLevels.includes(levelParam)) throw notImplemented(path);
  const parent = query.get("parent");
  const features = (mock?.geo() ?? [])
    .filter((g) => g.level === levelParam && (parent === null || g.parentId === parent))
    .map((g) => g.feature);
  return { type: "FeatureCollection", features };
}

function route(table: MockTable, path: string): unknown {
  const url = new URL(path, "http://mock.invalid");
  const [code, resource, id, ...rest] = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const country = parseCountry(code);
  if (country === null) {
    throw new ApiError(404, "COUNTRY_NOT_READY", `country not ready: ${code ?? ""}`);
  }
  const mock = table[country];
  if (rest.length > 0) throw notImplemented(path);

  if (resource === "meta" && id === undefined) {
    if (mock === undefined) throw new ApiError(404, "COUNTRY_NOT_READY", `country not ready: ${code}`);
    return mock.meta;
  }
  // 여섯 지역 모두 목이 있다(한국 밖은 기법 페이지 그림용, `api/mock/landing.ts`)
  const landing = resource === "landing" && id === undefined && mock !== undefined ? mockLanding(country) : null;
  if (landing !== null) return landing;
  if (resource === "regions" && id === undefined) return regions(mock, url.searchParams);
  if (resource === "regions" && id !== undefined) return mockRegionDetail(country, mock, id);
  if (resource === "geo" && id === undefined) return geo(mock, url.searchParams, path);
  if (resource === "series" && id !== undefined) return mockSeries(country, mock, id, url.searchParams);
  if (resource === "judgement" && id !== undefined) return mockJudgement(country, mock, id, url.searchParams);
  if (resource === "judgement" && id === undefined) return mockBulkJudgement(country, mock, url.searchParams);
  if (resource === "baseline" && id !== undefined) return mockBaseline(country, mock, id);
  if (resource === "map" && id === undefined) return mockMap(country, mock, url.searchParams);
  if (resource === "top" && id === undefined) return mockTop(country, mock, url.searchParams);
  if (resource === "insight" && id !== undefined) return mockInsight(country, mock, id, url.searchParams);
  throw notImplemented(path);
}

/** 목 묶음 표를 받아 요청 함수를 만든다. 테스트는 나라를 뺀 표로 "준비 안 된 나라"를 흉내 낸다. */
export function createMockGet(table: MockTable, delayMs = DEFAULT_DELAY_MS) {
  return async function mockGet(path: string, signal?: AbortSignal): Promise<unknown> {
    await wait(delayMs, signal);
    // 받은 쪽이 고쳐도 목 원본이 바뀌지 않게 복사해서 준다
    return structuredClone(route(table, path));
  };
}

export const mockGet = createMockGet({ KOR: kor, CAL: cal, BC: bc, GRC: grc, CHL: chl, NSW: nsw });
