import { describe, expect, it } from "vitest";
import { dashboardPath } from "./dashboardPath";
import { andParticle, formatFireDays, formatMonth, formatRatio } from "./format";
import { judgementKind, judgementView, type JudgementLike } from "./judgementView";
import { clampMonth, isInRange, monthRange, shiftMonth } from "./month";
import {
  byValueThenName,
  indexRegions,
  neighborName,
  ownName,
  parentOf,
  regionName,
  regionPath,
  searchRegions,
  SEARCH_LIMIT,
  sortByName,
  type NamedRegion,
} from "./region";

describe("달 계산", () => {
  it("앞뒤로 옮기고 해를 넘긴다", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2025-12", 1)).toBe("2026-01");
    expect(shiftMonth("2025-03", 14)).toBe("2026-05");
  });

  it("범위는 시계열의 첫 달과 마지막 달, 범위 밖은 끝으로 맞춘다", () => {
    const range = monthRange([{ month: "2001-01" }, { month: "2001-02" }, { month: "2026-11" }]);
    expect(range).toEqual({ first: "2001-01", last: "2026-11" });
    expect(monthRange([])).toBeNull();
    if (range === null) return;
    expect(isInRange("2030-01", range)).toBe(false);
    expect(clampMonth("2030-01", range)).toBe("2026-11");
    expect(clampMonth("1999-05", range)).toBe("2001-01");
    expect(clampMonth("2012-02", range)).toBe("2012-02");
  });
});

describe("숫자 표기 (1-11)", () => {
  it("감지일은 소수 한 자리, .0이면 정수, 천 단위 쉼표", () => {
    expect(formatFireDays(1093, "ko")).toBe("1,093");
    expect(formatFireDays(12.300000000000001, "ko")).toBe("12.3");
    expect(formatFireDays(1157.04, "en")).toBe("1,157");
  });

  it("배수는 소수 두 자리", () => {
    expect(formatRatio(6.28, "ko")).toBe("6.28");
    expect(formatRatio(1, "en")).toBe("1.00");
  });

  it("달 이름", () => {
    expect(formatMonth("2026-07", "ko")).toBe("2026년 7월");
    expect(formatMonth("2026-07", "en")).toBe("July 2026");
  });
});

const KOR: NamedRegion = { id: "KOR", label_ko: "대한민국", name_en: "Republic of Korea", level: "nat", province: null };
const GB: NamedRegion = { id: "경북", label_ko: "경북", name_en: "North Gyeongsang", level: "prov", province: "경북" };
const GW: NamedRegion = { id: "강원", label_ko: "강원", name_en: "Gangwon", level: "prov", province: "강원" };
const US: NamedRegion = { id: "U1", label_ko: "의성군", name_en: "Uiseong-gun", level: "dist", province: "경북" };
const GS1: NamedRegion = { id: "G1", label_ko: "고성군", name_en: "Goseong-gun", level: "dist", province: "강원" };
const BUTTE: NamedRegion = { id: "B1", label_ko: "Butte", name_en: "Butte", level: "dist", province: null };
const korea = [KOR, GW, GB, GS1, US];
const index = indexRegions([...korea, BUTTE]);

describe("지역 이름과 경로", () => {
  it("한국 시·군·구는 시·도를 붙이고, 영어 화면은 영문 이름", () => {
    expect(regionName(US, index, "ko")).toBe("경북 의성군");
    expect(regionName(US, index, "en")).toBe("North Gyeongsang Uiseong-gun");
    expect(regionName(GB, index, "ko")).toBe("경북");
    expect(regionName(BUTTE, index, "ko")).toBe("Butte");
    expect(ownName(US, "ko")).toBe("의성군");
  });

  it("영문 이름이 없으면 한글 이름", () => {
    expect(ownName({ ...US, name_en: null }, "en")).toBe("의성군");
  });

  it("상위 지역: 시·도는 나라, 시·군·구는 시·도(시·도 단계가 없는 나라는 나라)", () => {
    expect(parentOf(KOR, "KOR", false)).toBeNull();
    expect(parentOf(GB, "KOR", false)).toBe("KOR");
    expect(parentOf(US, "KOR", false)).toBe("경북");
    expect(parentOf(BUTTE, "CAL", true)).toBe("CAL");
    expect(regionPath(US, "KOR", false, index).map((r) => r.id)).toEqual(["KOR", "경북", "U1"]);
  });

  it("인접 지역 이름: 같은 시·도면 이름만, 다른 시·도면 시·도를 붙인다(5장 11절 2)", () => {
    const AD: NamedRegion = { id: "A1", label_ko: "안동시", name_en: "Andong-si", level: "dist", province: "경북" };
    const idx = indexRegions([...korea, AD]);
    expect(neighborName("A1", "안동시", US, idx, "ko")).toBe("안동시");
    expect(neighborName("G1", "고성군", US, idx, "ko")).toBe("강원 고성군");
    expect(neighborName("G1", "고성군", US, idx, "en")).toBe("Gangwon Goseong-gun");
    expect(neighborName("NOPE", "받은 이름", US, idx, "ko")).toBe("받은 이름");
  });

  it("값 큰 순, null은 맨 뒤, 같으면 이름순", () => {
    const rows = [
      { id: "b", v: 3 },
      { id: "a", v: 3 },
      { id: "c", v: null },
      { id: "d", v: 0 },
      { id: "e", v: 9 },
    ];
    const byId = (a: string, b: string) => a.localeCompare(b);
    expect([...rows].sort(byValueThenName((r) => r.v, byId)).map((r) => r.id)).toEqual(["e", "a", "b", "d", "c"]);
  });

  it("와/과: 받침으로, 한글로 끝나지 않으면 null", () => {
    expect(andParticle("의성군")).toBe("과");
    expect(andParticle("안동시")).toBe("와");
    expect(andParticle("Butte")).toBeNull();
    expect(andParticle("")).toBeNull();
  });

  it("가나다순으로 정렬한다", () => {
    expect(sortByName([GB, GW], index, "ko").map((r) => r.id)).toEqual(["강원", "경북"]);
    expect(sortByName([GB, GW], index, "en").map((r) => r.id)).toEqual(["강원", "경북"]);
  });
});

describe("지역 검색 (7-3)", () => {
  it("한글·영문·시·도 이름에 부분 일치하고 나라 → 시·도 → 시·군·구 순서", () => {
    expect(searchRegions(korea, "의성", index).items.map((r) => r.id)).toEqual(["U1"]);
    expect(searchRegions(korea, "uiseong", index).items.map((r) => r.id)).toEqual(["U1"]);
    expect(searchRegions(korea, "경북", index).items.map((r) => r.id)).toEqual(["경북", "U1"]);
    expect(searchRegions(korea, "  ", index).items).toEqual([]);
  });

  it("20곳에서 자르고 잘렸다고 알린다", () => {
    const many = Array.from({ length: 30 }, (_, i): NamedRegion => ({ id: `d${i}`, label_ko: `동${i}`, name_en: null, level: "dist", province: null }));
    const result = searchRegions(many, "동", indexRegions(many));
    expect(result.items).toHaveLength(SEARCH_LIMIT);
    expect(result.truncated).toBe(true);
  });
});

describe("대시보드 주소", () => {
  it("나라·지역·달과 언어 접두사", () => {
    expect(dashboardPath("ko", "KOR")).toBe("/dashboard/KOR");
    expect(dashboardPath("en", "KOR", "경북", "2025-03")).toBe(`/en/dashboard/KOR/${encodeURIComponent("경북")}?month=2025-03`);
    expect(dashboardPath("ko", "KOR", "KOR", "2025-03")).toBe("/dashboard/KOR?month=2025-03");
  });
});

const base: JudgementLike = {
  month: "2025-03",
  value: 1093,
  region_type: "sufficient",
  chip: "record",
  rank: 1,
  n: 25,
  rank_period: [2001, 2025],
  median: 174,
  band_low: 95.6,
  band_high: 294.8,
  ratio_to_median: 6.28,
  ytd_sum: 1157,
  ytd_ratio: 2.5,
  quality: "high",
  status: "final",
  reason: null,
  ref: null,
};
const ref = { id: "경북", label_ko: "경북", value: 948, chip: "record" as const, rank: 1, n: 25 };

describe("숫자 카드 분기 (3절, 7가지 순서)", () => {
  it("일반: 칩·배수·순위(기간 포함)", () => {
    const v = judgementView(base, "NOAA-20");
    expect(v.kind).toBe("normal");
    expect(v.chip).toBe("record");
    expect(v.ratio).toEqual({ median: 174, ratio: 6.28 });
    expect(v.rank).toEqual({ rank: 1, n: 25, period: [2001, 2025] });
    expect(v.converted).toBe(false);
    expect(v.ytd).toEqual({ sum: 1157, usual: 1157 / 2.5 });
  });

  it("순서대로 먼저 맞는 하나", () => {
    expect(judgementKind({ ...base, value: null, region_type: "none", status: "partial" })).toBe("noValue");
    expect(judgementKind({ ...base, region_type: "none", status: "partial", value: 5 })).toBe("noRecord");
    expect(judgementKind({ ...base, status: "partial", value: 0 })).toBe("partial");
    expect(judgementKind({ ...base, status: "partial", median: 0 })).toBe("partial");
    expect(judgementKind({ ...base, value: 0, region_type: "sparse" })).toBe("zero");
    expect(judgementKind({ ...base, region_type: "sparse", median: 0 })).toBe("sparse");
    expect(judgementKind({ ...base, median: 0 })).toBe("zeroBaseline");
  });

  it("값 없음: 2012년 2월 전은 reason으로 문구를 고르고 빌린 판정 줄을 붙인다", () => {
    const v = judgementView({ ...base, value: null, chip: null, reason: "PRE_2012_DISTRICT", ref }, null);
    expect(v.kind).toBe("noValue");
    expect(v.preDistrict).toBe(true);
    expect(v.ref).toEqual({ id: "경북", label: "경북", chip: "record", rank: { rank: 1, n: 25, period: null } });
    expect(judgementView({ ...base, value: null, reason: null }, null).preDistrict).toBe(false);
  });

  it("감지 기록 없는 지역은 값이 0보다 커도 그 값을 그대로 쓴다", () => {
    const v = judgementView({ ...base, region_type: "none", value: 3, chip: null, reason: "NO_RECORD", ref }, null);
    expect(v.kind).toBe("noRecord");
    expect(v.value).toBe(3);
    expect(v.chip).toBeNull();
  });

  it("집계 중: 칩·순위·빌린 판정 줄을 숨긴다", () => {
    const v = judgementView({ ...base, status: "partial", chip: "below", ref }, null);
    expect(v.kind).toBe("partial");
    expect(v.chip).toBeNull();
    expect(v.rank).toBeNull();
    expect(v.ref).toBeNull();
  });

  it("드문 지역: 자기 순위는 쓰지 않고 빌린 판정 줄", () => {
    const v = judgementView({ ...base, region_type: "sparse", chip: null, rank: 3, median: 0, ref }, null);
    expect(v.kind).toBe("sparse");
    expect(v.rank).toBeNull();
    expect(v.ref?.label).toBe("경북");
  });

  it("일반인데 중앙값·배수·순위가 없으면 그 문장을 빼고, 2026년 달은 기간을 붙이지 않는다", () => {
    const v = judgementView({ ...base, month: "2026-03", median: null, ratio_to_median: null, n: 26 }, null);
    expect(v.ratio).toBeNull();
    expect(v.rank).toEqual({ rank: 1, n: 26, period: null });
    expect(judgementView({ ...base, rank: null }, null).rank).toBeNull();
  });

  it("범위 하한이 음수면 0으로(3-6), 범위 값이 하나라도 없으면 범위 줄을 뺀다", () => {
    expect(judgementView({ ...base, band_low: -1.3, band_high: 4.2 }, null).band).toEqual({ low: 0, high: 4.2 });
    expect(judgementView({ ...base, band_low: null }, null).band).toBeNull();
  });

  it("센서 환산 배지는 그 달 관측 위성에 '→'가 있을 때만(4-3a)", () => {
    expect(judgementView(base, "S-NPP→NOAA-20").converted).toBe(true);
    expect(judgementView(base, "NOAA-20").converted).toBe(false);
    expect(judgementView(base, null).converted).toBe(false);
  });

  it("평소 누적은 비율이 없거나 0이면 빼고, 누적이 없으면 누적도 없다", () => {
    expect(judgementView({ ...base, ytd_ratio: 0 }, null).ytd).toEqual({ sum: 1157, usual: null });
    expect(judgementView({ ...base, ytd_ratio: null }, null).ytd).toEqual({ sum: 1157, usual: null });
    expect(judgementView({ ...base, ytd_sum: null }, null).ytd).toBeNull();
  });

  it("준실시간 표시", () => {
    expect(judgementView({ ...base, status: "nrt" }, null).nrt).toBe(true);
  });
});
