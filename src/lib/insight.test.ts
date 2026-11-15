import { describe, expect, it } from "vitest";
import {
  calendarCells,
  calendarSummary,
  isInProgress,
  clusterRange,
  clusterSummary,
  detectRateLine,
  guideRows,
  headTiles,
  needsCurrentYear,
  neighborRows,
  officialRows,
  serverName,
  seasonView,
  showSparseNote,
  withCurrentYear,
  yearsCount,
  yearSummary,
  type HeadInput,
} from "./insight";
import { insightPath } from "./insightPath";

const strip = [
  { year: 2012, v: 0 },
  { year: 2013, v: 4 },
  { year: 2014, v: 0 },
  { year: 2017, v: 5 },
  { year: 2021, v: 7 },
  { year: 2025, v: 12 },
];

describe("연도별", () => {
  it("2026 보충은 strip이 있고, 그 해가 없고, 이 달 값이 있을 때만", () => {
    expect(needsCurrentYear(strip, 2026, 3)).toBe(true);
    expect(needsCurrentYear(strip, 2025, 12)).toBe(false);
    expect(needsCurrentYear(strip, 2026, null)).toBe(false);
    expect(needsCurrentYear(null, 2026, 3)).toBe(false);
  });

  it("보충한 해를 붙이고 해 순으로, 집계 중이면 partial", () => {
    const bars = withCurrentYear(strip, 2026, { value: 9, status: "partial" });
    expect(bars?.at(-1)).toEqual({ year: 2026, v: 9, partial: true });
    expect(withCurrentYear(strip, 2026, null)).toHaveLength(strip.length);
    expect(withCurrentYear(strip, 2026, { value: null, status: "final" })).toHaveLength(strip.length);
    expect(withCurrentYear(null, 2026, { value: 1, status: "final" })).toBeNull();
  });

  it("개수는 strip에서 센다", () => {
    expect(yearsCount(strip)).toEqual({ detected: 4, total: 6, from: 2012, to: 2025 });
    expect(yearsCount(null)).toBeNull();
    expect(yearsCount([])).toBeNull();
  });

  it("요약: 선택한 해와 나머지 합(소수 한 자리)", () => {
    expect(yearSummary(strip, 2025)).toEqual({ current: 12, previousYears: 5, previousSum: 16, from: 2012, to: 2025 });
    // "이전"은 선택한 해보다 앞선 해만(뒤의 해를 더하지 않는다)
    expect(yearSummary(strip, 2017)).toMatchObject({ current: 5, previousYears: 3, previousSum: 4 });
    expect(yearSummary([{ year: 2012, v: 0.1 }, { year: 2013, v: 0.2 }], 2030)).toMatchObject({ current: null, previousSum: 0.3 });
  });
});

const head: HeadInput["head"] = { value: 384, reason: null, fire_days: 7, dmax: 108, dmax_date: "2025-03-26" };
const cluster = { start: "2025-03-22", end: "2025-03-29", cells: 919, regions: [{}, {}] };

describe("머리 칸", () => {
  it("값이 다 있으면 값", () => {
    const t = headTiles({ month: "2025-03", head, calendar: { main_cluster: cluster }, strip });
    expect(t.total).toEqual({ kind: "value", value: 384 });
    expect(t.days).toEqual({ kind: "value", value: { fireDays: 7, dmax: 108, dmaxDate: "2025-03-26" } });
    expect(t.cluster).toEqual({ kind: "value", value: { cells: 919, start: "2025-03-22", end: "2025-03-29", multiRegion: true } });
  });

  it("2012-02 전: 값·날짜 칸은 preDistrict, 묶음은 preCluster", () => {
    const t = headTiles({
      month: "2010-05",
      head: { value: null, reason: "PRE_2012_DISTRICT", fire_days: null, dmax: null, dmax_date: null },
      calendar: { main_cluster: null },
      strip,
    });
    expect([t.total, t.days, t.cluster]).toEqual([
      { kind: "none", reason: "preDistrict" }, { kind: "none", reason: "preDistrict" }, { kind: "none", reason: "preCluster" },
    ]);
  });

  it("spatial 실패: 날짜·묶음 칸은 failed, strip이 없으면 해 칸도 failed", () => {
    const t = headTiles({ month: "2024-03", head: { ...head, fire_days: null }, calendar: null, strip: null });
    expect([t.days, t.cluster, t.years]).toEqual([
      { kind: "none", reason: "failed" }, { kind: "none", reason: "failed" }, { kind: "none", reason: "failed" },
    ]);
  });

  it("2018-04 뒤 묶음 없음", () => {
    const t = headTiles({ month: "2024-07", head, calendar: { main_cluster: null }, strip });
    expect(t.cluster).toEqual({ kind: "none", reason: "noCluster" });
  });
});

describe("일별 달력", () => {
  const base = {
    month: "2025-03",
    daily: { "25": 3, "26": 108, "6": 1 },
    cluster: { start: "2025-02-27", end: "2025-03-03" },
    dmaxDate: "2025-03-26",
    official: [{ date: "2025-03-22", place: "경북 의성 안계" }],
    inProgress: false,
    dataEnd: "2026-10-31",
  };

  it("2025-03-01은 토요일이라 앞 빈칸 6, 31칸", () => {
    const { leading, cells } = calendarCells(base);
    expect(leading).toBe(6);
    expect(cells).toHaveLength(31);
  });

  it("색 단계는 0 / 1 / 2 / 3 / 4+", () => {
    const { cells } = calendarCells({ ...base, daily: { "1": 1, "2": 2, "3": 3, "4": 4, "5": 108 } });
    expect(cells.slice(0, 6).map((c) => c.level)).toEqual([1, 2, 3, 4, 4, 0]);
  });

  it("묶음 밑줄은 이 달 안으로 잘리고, 묶음 기간 중 이 지역에서도 감지된 날만 친다", () => {
    const { cells } = calendarCells({ ...base, daily: { ...base.daily, "1": 2, "3": 1 } });
    // 2일은 묶음 기간이지만 이 지역은 0칸(이웃에서만 탄 날)
    expect(cells.filter((c) => c.inCluster).map((c) => c.day)).toEqual([1, 3]);
  });

  it("의성 2025-03처럼 묶음이 이 지역 마지막 감지일보다 하루 길면 그 날은 밑줄 없음", () => {
    const daily = { "22": 12, "23": 40, "24": 66, "25": 95, "26": 108, "27": 45, "28": 18 };
    const { cells } = calendarCells({ ...base, daily, cluster: { start: "2025-03-22", end: "2025-03-29" } });
    expect(cells.filter((c) => c.inCluster).map((c) => c.day)).toEqual([22, 23, 24, 25, 26, 27, 28]);
  });

  it("묶음이 없으면 밑줄 없음", () => {
    // 묶음이 있었다면 밑줄이 붙었을 1일에 값을 넣어 두고 묶음만 뺀다
    const daily = { ...base.daily, "1": 2 };
    expect(calendarCells({ ...base, daily }).cells.some((c) => c.inCluster)).toBe(true);
    expect(calendarCells({ ...base, daily, cluster: null }).cells.some((c) => c.inCluster)).toBe(false);
  });

  it("최대 활동일과 공식 기록 표시", () => {
    const { cells } = calendarCells(base);
    expect(cells[25]?.isPeak).toBe(true);
    expect(cells[21]?.official).toBe("경북 의성 안계");
  });

  it("집계 중인 달은 data_end 뒤 값 없는 날만 미래", () => {
    const { cells } = calendarCells({ ...base, month: "2026-11", daily: { "20": 2 }, inProgress: true, dataEnd: "2026-11-10" });
    expect(cells[9]?.future).toBe(false);
    expect(cells[10]?.future).toBe(true);
    expect(cells[19]?.future).toBe(false);
    expect(calendarCells({ ...base, inProgress: true, dataEnd: null }).cells.some((c) => c.future)).toBe(false);
  });

  it("묶음 범위: 다음 달로 넘어가면 말일까지, 겹치지 않으면 null", () => {
    expect(clusterRange({ start: "2025-03-30", end: "2025-04-02" }, "2025-03")).toEqual({ from: 30, to: 31 });
    expect(clusterRange({ start: "2025-04-01", end: "2025-04-02" }, "2025-03")).toBeNull();
  });

  it("묶음 요약: 2018-04 전, 정보 없음, 0, 있음", () => {
    expect(clusterSummary("2017-03", { events: 0, big_events: 0 })).toEqual({ kind: "preCluster" });
    expect(clusterSummary("2025-03", null)).toEqual({ kind: "unknown" });
    expect(clusterSummary("2025-03", { events: 0, big_events: 0 })).toEqual({ kind: "none" });
    expect(clusterSummary("2025-03", { events: 3, big_events: 1 })).toEqual({ kind: "events", events: 3, big: 1 });
  });
});

describe("계절", () => {
  const season = { own_mt: [1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0], ref_mt: [9, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0], ref_id: "경북", risk_months: [3], risk_from: "province" as const };

  it("충분 지역은 자기 값·2012–2025", () => {
    expect(seasonView({ ...season, risk_from: "self" }, "sufficient", null)).toMatchObject({ values: season.own_mt, borrowed: false, period: [2012, 2025], riskFrom: "self" });
  });

  it("드문 지역은 빌린 값, 기간은 빌린 지역 basis로", () => {
    expect(seasonView(season, "sparse", "harmonized_25y")).toMatchObject({ values: season.ref_mt, borrowed: true, period: [2001, 2025], riskFrom: "province" });
    expect(seasonView(season, "sparse", null)?.period).toBeNull();
  });

  it("드문 지역인데 빌릴 곳이 없으면(ref_id null) 자기 값을 쓴다. 실패가 아니다", () => {
    expect(seasonView({ ...season, ref_id: null, ref_mt: null }, "sparse", null)).toMatchObject({ values: season.own_mt, borrowed: false });
  });

  it("고른 배열이 null이면 null(대신하지 않는다), 모두 0이면 empty", () => {
    expect(seasonView({ ...season, ref_mt: null }, "sparse", "viirs_2012")).toBeNull();
    expect(seasonView({ ...season, own_mt: Array(12).fill(0) }, "sufficient", null)?.empty).toBe(true);
  });
});

describe("집계 중·달력 요약", () => {
  it("집계 중은 나라 시계열 status와 reason을 함께 본다(기록 없는 지역은 NO_RECORD가 온다)", () => {
    expect(isInProgress("partial", "NO_RECORD")).toBe(true);
    expect(isInProgress("final", "IN_PROGRESS")).toBe(true);
    expect(isInProgress("final", "NO_RECORD")).toBe(false);
    expect(isInProgress(null, null)).toBe(false);
  });

  it("요약 줄: 값이 없는 칸은 null, 50 km 첫 감지는 그 달의 날짜", () => {
    const s = calendarSummary(
      "2025-03",
      { fire_days: 7, dmax: 108, dmax_date: "2025-03-26" },
      { clusters: { events: 3, big_events: 1 }, near50: { n: 330, first: 21 } },
    );
    expect(s).toEqual({
      fireDays: 7,
      peak: { date: "2025-03-26", cells: 108 },
      clusters: { kind: "events", events: 3, big: 1 },
      near50: { date: "2025-03-21", cells: 330 },
    });
    const empty = calendarSummary("2025-03", { fire_days: 0, dmax: 0, dmax_date: null }, { clusters: null, near50: { n: 0, first: null } });
    expect([empty.peak, empty.near50, empty.clusters]).toEqual([null, null, { kind: "unknown" }]);
  });
});

describe("주변 지역", () => {
  const names: Record<string, string> = { a: "가", b: "나", c: "다", d: "라" };
  const compare = (x: string, y: string) => (names[x] ?? x).localeCompare(names[y] ?? y);
  const neighbors = [
    { id: "c", region_type: "sparse" as const, v: null, rank: null, n: null },
    { id: "b", region_type: "sufficient" as const, v: 0, rank: null, n: 14 },
    { id: "d", region_type: "sufficient" as const, v: 9, rank: 2, n: 14 },
    { id: "a", region_type: "none" as const, v: 0, rank: null, n: null },
  ];

  it("선택 지역 먼저, 값 큰 순, null 맨 뒤, 같으면 이름순", () => {
    const rows = neighborRows({ id: "self", region_type: "sparse", value: 12 }, neighbors, false, compare);
    expect(rows.map((r) => r.id)).toEqual(["self", "d", "a", "b", "c"]);
    expect(rows.map((r) => r.basis)).toEqual(["sparse", "self", "none", "self", "sparse"]);
    expect(rows[1]?.rank).toEqual({ rank: 2, n: 14 });
  });

  it("집계 중인 달에는 순위를 쓰지 않는다", () => {
    const rows = neighborRows({ id: "self", region_type: "sparse", value: 12 }, neighbors, true, compare);
    expect(rows.every((r) => r.rank === null)).toBe(true);
  });
});

describe("공식 기록·감지율·읽는 법", () => {
  it("면적 0은 빈칸, key는 겹치지 않는다", () => {
    const rows = officialRows(
      [
        { date: "2025-03-22", place: "A", cause: "x", area_ha: 12 },
        { date: "2025-03-22", place: "A", cause: "y", area_ha: 0 },
      ],
      {},
    );
    expect(rows.map((r) => r.area)).toEqual([12, null]);
    expect(new Set(rows.map((r) => r.key)).size).toBe(2);
  });

  it("원인은 이름 표로 옮기고, 표에 없으면 받은 그대로. 장소는 바꾸지 않는다", () => {
    const items = [
      { date: "2025-03-22", place: "경북 의성 안계", cause: "번개", area_ha: 1 },
      { date: "2025-03-23", place: "경북 의성 안평", cause: "처음 보는 원인", area_ha: 1 },
      // 표의 키가 아니라 객체가 물려받은 이름(`toString`)은 번역으로 치지 않는다
      { date: "2025-03-24", place: "B", cause: "toString", area_ha: 1 },
    ];
    expect(officialRows(items, { 번개: "Lightning" }).map((r) => r.cause)).toEqual(["Lightning", "처음 보는 원인", "toString"]);
    expect(officialRows(items, { 번개: "Lightning" }).map((r) => r.place)).toEqual(["경북 의성 안계", "경북 의성 안평", "B"]);
    // 한글 화면의 빈 표: 받은 그대로
    expect(officialRows(items, {}).map((r) => r.cause)).toEqual(["번개", "처음 보는 원인", "toString"]);
    expect(serverName("산림청", { 산림청: "Korea Forest Service" })).toBe("Korea Forest Service");
    expect(serverName("CAL FIRE", { 산림청: "Korea Forest Service" })).toBe("CAL FIRE");
  });

  it("감지율: rate는 0~1, null이면 상자 없음", () => {
    expect(detectRateLine({ n: 41, detected: 17, rate: 0.41, since: "2018-04", window_days: 3 })).toEqual({
      since: "2018-04", n: 41, detected: 17, percent: 41, windowDays: 3,
    });
    expect(detectRateLine({ n: 0, detected: 0, rate: null, since: "2018-04", window_days: 3 })).toBeNull();
    expect(detectRateLine(null)).toBeNull();
  });

  it("읽는 법: 드문 지역 세 줄은 충분 지역이 아닐 때만", () => {
    expect(guideRows("sufficient")).toEqual(["period", "unit", "baseline", "sources"]);
    expect(guideRows("sparse")).toHaveLength(7);
    expect([showSparseNote("sufficient"), showSparseNote("none")]).toEqual([false, true]);
  });
});

describe("insightPath", () => {
  it("지역은 인코딩, 영어는 /en, 달은 쿼리", () => {
    expect(insightPath("ko", "KOR", "abc", "2025-03")).toBe("/insight/KOR/abc?month=2025-03");
    expect(insightPath("en", "BC", "BC-RD-60", null)).toBe("/en/insight/BC/BC-RD-60");
    expect(insightPath("ko", "KOR", "경북")).toBe(`/insight/KOR/${encodeURIComponent("경북")}`);
  });
});
