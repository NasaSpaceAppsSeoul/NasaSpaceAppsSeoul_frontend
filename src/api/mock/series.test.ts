import { describe, expect, it } from "vitest";
import type { BaselineResponse, Judgement, SeriesMonth, SeriesResponse } from "../types";
import { mockGet } from "./index";
import { GOSEONG_GANGWON, GUNPO, UISEONG } from "./series-overrides";

const FRESNO = "52423323B10000000000004";
const BUTTE = "52423323B10000000000002";

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (e) {
    return e;
  }
  throw new Error("실패해야 하는데 성공했다");
}

// 목 응답 모양은 이 파일이 검사하는 대상이라 기존 목 테스트처럼 단언으로 받는다
async function series(country: string, id: string, query = ""): Promise<SeriesResponse> {
  return (await mockGet(`/${country}/series/${encodeURIComponent(id)}${query}`)) as SeriesResponse;
}

async function judge(country: string, id: string, month: string): Promise<Judgement> {
  return (await mockGet(`/${country}/judgement/${encodeURIComponent(id)}?month=${month}`)) as Judgement;
}

function at(months: SeriesMonth[], month: string): SeriesMonth {
  const row = months.find((m) => m.month === month);
  if (row === undefined) throw new Error(`없는 달: ${month}`);
  return row;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const upper = s[mid] ?? 0;
  return s.length % 2 === 1 ? upper : ((s[mid - 1] ?? upper) + upper) / 2;
}

describe("백엔드 기대값 (spec_test.py)", () => {
  it("나라 KOR 2025-01~03 시계열", async () => {
    const { id, level, months } = await series("KOR", "KOR", "?from=2025-01&to=2025-03");
    expect({ id, level }).toEqual({ id: "KOR", level: "nat" });
    expect(months.map((m) => [m.month, m.value, m.rank, m.ratio_to_median])).toEqual([
      ["2025-01", 21, 13, 1.0],
      ["2025-02", 43, 21, 0.49],
      ["2025-03", 1093, 1, 6.28],
    ]);
    for (const m of months) {
      expect(m).toMatchObject({ source: "NOAA-20", quality: "high", estimated: false, status: "final", n: 25 });
    }
  });

  it("나라 KOR 2025-03 판정", async () => {
    expect(await judge("KOR", "KOR", "2025-03")).toMatchObject({
      value: 1093, chip: "record", judge_unit: "self", rank: 1, n: 25, rank_period: [2001, 2025],
      median: 174, band_low: 95.6, band_high: 294.8, ratio_to_median: 6.28, ytd_sum: 1157,
      quality: "high", estimated: false, status: "final", reason: null, ref: null,
    });
  });

  it("의성 2025-03: 드문 지역, 경북 판정을 빌림", async () => {
    const j = await judge("KOR", UISEONG, "2025-03");
    expect(j).toMatchObject({
      value: 384, region_type: "sparse", chip: null, judge_unit: "province", rank: null, ratio_to_median: null,
      estimated: false, reason: null, quality: "medium", median: 0, band_low: null, band_high: null,
      rank_period: null, ytd_ratio: null, ref_id: "경북", ref_chip: "record",
    });
    expect(j.ref).toEqual({
      id: "경북", label_ko: "경북", value: 948, chip: "record", rank: 1, n: 25, ratio_to_median: 72.64,
      basis: "harmonized_25y",
    });
    expect(await judge("KOR", "경북", "2025-03")).toMatchObject({
      value: 948, chip: "record", rank: 1, n: 25, ratio_to_median: 72.64, rank_period: [2001, 2025], ref: null,
    });
  });

  it("의성 /series 2025-03은 드문 지역이어도 순위가 숫자(D-4)", async () => {
    const row = at((await series("KOR", UISEONG)).months, "2025-03");
    expect(row).toMatchObject({ value: 384, rank: 1, n: 14, ratio_to_median: null });
  });

  it("의성 2010-05: 시·군·구의 2012-02 전 달", async () => {
    expect(await judge("KOR", UISEONG, "2010-05")).toMatchObject({
      value: null, reason: "PRE_2012_DISTRICT", chip: null, median: null, ytd_sum: null, quality: null,
      estimated: true, ref_id: "경북",
    });
  });

  it("고성(강원) 2012-02: 0칸, 평년 0", async () => {
    expect(await judge("KOR", GOSEONG_GANGWON, "2012-02")).toMatchObject({
      region_type: "sufficient", value: 0, chip: "normal", judge_unit: "self", median: 0, rank: null,
      ratio_to_median: null, reason: "NO_DETECTION", ref: null,
    });
  });

  it("CAL 2026-11: 집계 중, 칩은 계산", async () => {
    const j = await judge("CAL", "CAL", "2026-11");
    expect(j).toMatchObject({ status: "partial", reason: "IN_PROGRESS" });
    expect(j.chip).not.toBeNull();
  });

  it("status: KOR은 2026-09, CAL은 2026-08, BC는 2026-09부터 nrt, 마지막 달 partial", async () => {
    const got = [
      (await judge("KOR", "KOR", "2026-08")).status,
      (await judge("KOR", "KOR", "2026-09")).status,
      (await judge("CAL", "CAL", "2026-07")).status,
      (await judge("CAL", "CAL", "2026-08")).status,
      (await judge("BC", "BC", "2026-08")).status,
      (await judge("BC", "BC", "2026-09")).status,
      (await judge("KOR", "KOR", "2026-11")).status,
    ];
    expect(got).toEqual(["final", "nrt", "final", "nrt", "final", "nrt", "partial"]);
  });

  it("estimated: 나라 2012-02 전, 시·도 2018-04 전", async () => {
    const nat = (await series("KOR", "KOR")).months;
    expect([at(nat, "2012-01").estimated, at(nat, "2012-02").estimated]).toEqual([true, false]);
    const prov = (await series("KOR", "경북")).months;
    expect([at(prov, "2018-03").estimated, at(prov, "2018-04").estimated]).toEqual([true, false]);
  });

  it("source: 달별 관측 위성", async () => {
    const nat = (await series("KOR", "KOR")).months;
    expect(["2005-03", "2015-03", "2025-03"].map((m) => at(nat, m).source)).toEqual([
      "MODIS→NOAA-20", "S-NPP→NOAA-20", "NOAA-20",
    ]);
  });
});

describe("분기 확인용 경우", () => {
  it("평년 0인데 값 > 0: 고성(강원) 2025-02 → ZERO_BASELINE, 1위라 record", async () => {
    expect(await judge("KOR", GOSEONG_GANGWON, "2025-02")).toMatchObject({
      value: 3, median: 0, chip: "record", rank: 1, ratio_to_median: null, reason: "ZERO_BASELINE",
    });
  });

  it("감지 기록 없는 지역(군포시): NO_RECORD, 값 > 0인 달도 NO_RECORD", async () => {
    const zero = await judge("KOR", GUNPO, "2025-03");
    expect(zero).toMatchObject({
      region_type: "none", value: 0, chip: null, rank: null, reason: "NO_RECORD", judge_unit: "province",
      ref_id: "경기",
    });
    expect(await judge("KOR", GUNPO, "2025-04")).toMatchObject({ value: 1, reason: "NO_RECORD", chip: null });
  });

  it("드문 지역 0칸: 의성 2024-03 → NO_DETECTION, ref 있음", async () => {
    const j = await judge("KOR", UISEONG, "2024-03");
    expect(j).toMatchObject({ value: 0, chip: null, reason: "NO_DETECTION", ref_id: "경북" });
    expect(j.ref).not.toBeNull();
  });

  it("집계 중인 달은 KOR 시·군·구도 partial·IN_PROGRESS", async () => {
    expect(await judge("KOR", UISEONG, "2026-11")).toMatchObject({ status: "partial", reason: "IN_PROGRESS" });
  });

  it("부족한 시·도는 가까운 충분 시·도, CAL 카운티는 주 전체를 빌린다", async () => {
    const seoul = await judge("KOR", "서울", "2025-03");
    expect(seoul.judge_unit).toBe("nearby_province");
    expect(seoul.ref?.id).toBe("경기");
    expect(seoul.chip).toBeNull();
    expect(seoul.median).not.toBeNull();
    const fresno = await judge("CAL", FRESNO, "2025-08");
    expect(fresno).toMatchObject({ judge_unit: "province", ref_id: "CAL" });
    expect(fresno.ref?.basis).toBe("harmonized_25y");
  });

  it("시·도 basis: 경기·경북·충남은 25년, 나머지는 2012~", async () => {
    expect((await judge("KOR", "충남", "2025-03")).rank_period).toEqual([2001, 2025]);
    expect((await judge("KOR", "강원", "2025-03")).rank_period).toEqual([2012, 2025]);
  });
});

describe("/series와 /judgement의 일관성", () => {
  const cases: [string, string, string[]][] = [
    ["KOR", "KOR", ["2003-04", "2025-03", "2026-03", "2026-10"]],
    ["KOR", "경북", ["2010-07", "2025-03", "2026-11"]],
    ["KOR", "강원", ["2005-03", "2019-04"]],
    ["KOR", "서울", ["2020-04"]],
    ["KOR", UISEONG, ["2012-02", "2025-03", "2026-04"]],
    ["KOR", GOSEONG_GANGWON, ["2016-03", "2025-02"]],
    ["CAL", BUTTE, ["2018-11"]],
    ["BC", "BC-RD-41", ["2021-07"]],
  ];

  it.each(cases)("%s %s: 값·ytd·순위·중앙값이 시계열과 맞는다", async (country, id, monthList) => {
    const full = (await series(country, id)).months;
    for (const month of monthList) {
      const j = await judge(country, id, month);
      const row = at(full, month);
      expect(j.value).toBe(row.value);
      expect(j.status).toBe(row.status);
      expect(j.quality).toBe(row.quality);
      expect(j.estimated).toBe(row.estimated);

      const year = month.slice(0, 4);
      const ytd = full
        .filter((m) => m.month.startsWith(year) && m.month <= month)
        .reduce((sum, m) => sum + (m.value ?? 0), 0);
      expect(j.ytd_sum).toBe(ytd);

      if (j.rank_period === null || row.value === null) continue;
      const [start, end] = j.rank_period;
      const mm = month.slice(5);
      const sameMonth = full
        .filter((m) => m.month.endsWith(`-${mm}`) && Number(m.month.slice(0, 4)) >= start)
        .filter((m) => Number(m.month.slice(0, 4)) <= end && m.value !== null)
        .map((m) => m.value ?? 0);
      expect(j.median).toBeCloseTo(median(sameMonth), 2);
      const outside = Number(year) < start || Number(year) > end;
      const compared = outside ? [...sameMonth, row.value] : sameMonth;
      expect(j.n).toBe(compared.length);
      if (row.value > 0) {
        expect(j.rank).toBe(1 + compared.filter((v) => v > (row.value ?? 0)).length);
        expect(row.rank).toBe(j.rank);
      }
    }
  });

  it.each(cases)("%s %s: ytd_lo·ytd_hi는 자체 판정일 때 1월~그 달 범위 합(합 ≤ 0이면 null)", async (country, id, monthList) => {
    const { by_month } = (await mockGet(`/${country}/baseline/${encodeURIComponent(id)}`)) as BaselineResponse;
    for (const month of monthList) {
      const j = await judge(country, id, month);
      if (j.judge_unit !== "self" || j.ytd_sum === null) {
        expect([j.ytd_lo, j.ytd_hi]).toEqual([null, null]);
        continue;
      }
      const upTo = by_month.filter((b) => b.month <= Number(month.slice(5)));
      const lo = upTo.reduce((sum, b) => sum + (b.band_low ?? 0), 0);
      const hi = upTo.reduce((sum, b) => sum + (b.band_high ?? 0), 0);
      if (lo > 0) expect(j.ytd_lo).toBeCloseTo(lo, 6);
      else expect(j.ytd_lo).toBeNull();
      if (hi > 0) expect(j.ytd_hi).toBeCloseTo(hi, 6);
      else expect(j.ytd_hi).toBeNull();
    }
  });

  it("raw_before는 지금 원자료에 없어 모든 달이 null", async () => {
    for (const id of ["KOR", "경북", UISEONG]) {
      expect((await series("KOR", id)).months.every((m) => m.raw_before === null)).toBe(true);
    }
  });

  it("전체 시계열은 2001-01~2026-11, 시·군·구는 2012-02 전 null", async () => {
    const nat = (await series("KOR", "KOR")).months;
    expect(nat).toHaveLength(311);
    expect([nat[0]?.month, nat.at(-1)?.month]).toEqual(["2001-01", "2026-11"]);
    const dist = (await series("KOR", UISEONG)).months;
    expect(dist).toHaveLength(311);
    expect(at(dist, "2012-01")).toMatchObject({ value: null, source: null, quality: null, rank: null, n: null });
    expect(at(dist, "2012-02").value).not.toBeNull();
    expect(dist.filter((m) => m.month < "2012-02").every((m) => m.value === null)).toBe(true);
  });

  it("같은 요청은 같은 값을 준다", async () => {
    expect(await series("BC", "BC-RD-05")).toEqual(await series("BC", "BC-RD-05"));
    expect(await judge("KOR", "충북", "2019-05")).toEqual(await judge("KOR", "충북", "2019-05"));
  });

  it("지역 성격이 값 크기에 드러난다", async () => {
    const sum = (ms: SeriesMonth[]) => ms.reduce((s, m) => s + (m.value ?? 0), 0);
    const sufficient = sum((await series("KOR", GOSEONG_GANGWON)).months);
    const none = (await series("KOR", GUNPO)).months;
    expect(sufficient).toBeGreaterThan(sum(none));
    expect(none.filter((m) => (m.value ?? 0) > 0).length).toBeLessThan(10);
  });
});

describe("에러 (지역 먼저, 달 나중)", () => {
  const cases: [string, number, string][] = [
    ["/KOR/judgement/NOPE?month=bad", 404, "REGION_NOT_FOUND"],
    ["/KOR/series/NOPE?from=2030-01", 404, "REGION_NOT_FOUND"],
    ["/KOR/judgement/KOR", 400, "INVALID_PARAM"],
    ["/KOR/judgement/KOR?month=", 400, "INVALID_PARAM"],
    ["/KOR/judgement/KOR?month=2025-13", 400, "INVALID_PARAM"],
    ["/KOR/judgement/KOR?month=2025-3", 400, "INVALID_PARAM"],
    ["/KOR/judgement/KOR?month=2000-12", 400, "MONTH_OUT_OF_RANGE"],
    ["/KOR/judgement/KOR?month=2026-12", 400, "MONTH_OUT_OF_RANGE"],
    ["/KOR/series/KOR?from=2025-03&to=2025-01", 400, "INVALID_PARAM"],
    ["/KOR/series/KOR?from=2030-03&to=2030-01", 400, "INVALID_PARAM"],
    ["/KOR/series/KOR?from=2025", 400, "INVALID_PARAM"],
    ["/KOR/series/KOR?to=", 400, "INVALID_PARAM"],
    ["/KOR/series/KOR?from=2000-01", 400, "MONTH_OUT_OF_RANGE"],
    ["/KOR/series/KOR?to=2027-01", 400, "MONTH_OUT_OF_RANGE"],
  ];

  it.each(cases)("%s → %i %s", async (path, status, code) => {
    expect(await caught(mockGet(path))).toMatchObject({ status, code });
  });

  it("from·to 한쪽만 주면 그쪽만 자른다", async () => {
    const tail = (await series("KOR", "KOR", "?from=2026-10")).months.map((m) => m.month);
    expect(tail).toEqual(["2026-10", "2026-11"]);
    expect((await series("KOR", "KOR", "?to=2001-02")).months.map((m) => m.month)).toEqual(["2001-01", "2001-02"]);
  });
});
