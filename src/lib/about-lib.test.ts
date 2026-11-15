import { describe, expect, it } from "vitest";
import { ko } from "../i18n/ko";
import { en } from "../i18n/en";
import { formatDateSpan, formatPercent } from "./format";
import {
  annualBars,
  axisTicks,
  binLabel,
  clampRatio,
  dataEndSpan,
  detectRows,
  hasAnnualData,
  niceMax,
  readoutYear,
  ytdBars,
} from "./landing";

describe("dataEndSpan·formatDateSpan (03 자료 기준일, UI 다듬기)", () => {
  it("가장 이른 날·늦은 날. 한 곳이라도 못 받았거나 값이 없거나 이상하면 null(일부만으로 말하지 않음)", () => {
    expect(dataEndSpan(["2026-11-14", "2026-11-11", "2026-11-13"])).toEqual({ first: "2026-11-11", last: "2026-11-14", collecting: true });
    expect(dataEndSpan(["2026-11-14", "2026-11-14"])).toEqual({ first: "2026-11-14", last: "2026-11-14", collecting: true });
    expect(dataEndSpan(["2026-11-14", undefined])).toBeNull();
    expect(dataEndSpan(["2026-11-14", null])).toBeNull();
    expect(dataEndSpan(["2026-11-14", "x"])).toBeNull();
    expect(dataEndSpan([])).toBeNull();
  });
  it("집계 중: 가장 최근 달에서 멈춘 지역 가운데 하나라도 달 끝 전이면(가운데 지역 포함)", () => {
    expect(dataEndSpan(["2026-10-20", "2026-11-20", "2026-11-30"])?.collecting).toBe(true);
    expect(dataEndSpan(["2026-10-20", "2026-11-30"])?.collecting).toBe(false);
    expect(dataEndSpan(["2026-11-30", "2026-11-30"])?.collecting).toBe(false);
  });
  it("날짜 범위: 같은 날·같은 달·같은 해·다른 해, 한글·영문", () => {
    expect(formatDateSpan("2026-11-14", "2026-11-14", "ko")).toBe("2026년 11월 14일");
    expect(formatDateSpan("2026-11-11", "2026-11-14", "ko")).toBe("2026년 11월 11–14일");
    expect(formatDateSpan("2026-10-31", "2026-11-14", "ko")).toBe("2026년 10월 31일–11월 14일");
    expect(formatDateSpan("2025-12-31", "2026-01-02", "ko")).toBe("2025년 12월 31일–2026년 1월 2일");
    expect(formatDateSpan("2026-11-14", "2026-11-14", "en")).toBe("14 November 2026");
    expect(formatDateSpan("2026-11-11", "2026-11-14", "en")).toBe("11–14 November 2026");
    expect(formatDateSpan("2026-10-31", "2026-11-14", "en")).toBe("31 October–14 November 2026");
    expect(formatDateSpan("2025-12-31", "2026-01-02", "en")).toBe("31 December 2025–2 January 2026");
  });
});

describe("ytdBars (02 월별 막대)", () => {
  const m = (month: string, value: number | null, status = "final") => ({ month, value, status });

  it("시계열 마지막 달의 해 1월~그 달, 값 없는 달은 null, 집계 중·준실시간 표시, 합계는 값 있는 달만", () => {
    const ytd = ytdBars([m("2025-12", 9), m("2026-01", 4), m("2026-02", null), m("2026-03", 47.25, "nrt"), m("2026-04", 3.3, "partial")]);
    expect(ytd?.year).toBe(2026);
    // 집계 중(partial)과 준실시간(nrt)은 따로 구분한다(C-judgement 98행)
    expect(ytd?.bars.map((b) => [b.month, b.value, b.pending])).toEqual([
      [1, 4, null],
      [2, null, null],
      [3, 47.25, "nrt"],
      [4, 3.3, "partial"],
    ]);
    expect(ytd?.total).toBe(54.6);
    // 집계 중이 하나라도 있으면 합계는 집계 중
    expect(ytd?.totalPending).toBe("partial");
  });

  it("준실시간 달만 있으면 합계도 준실시간", () => {
    expect(ytdBars([m("2026-01", 4), m("2026-02", 2, "nrt")])?.totalPending).toBe("nrt");
  });

  it("0은 값이 있는 달(막대·합계에 들어감), 값 없는 집계 중 달은 확정 전으로 보지 않는다", () => {
    const ytd = ytdBars([m("2026-01", 0), m("2026-02", 5), m("2026-03", null, "partial")]);
    expect(ytd?.bars.map((b) => [b.value, b.pending])).toEqual([
      [0, null],
      [5, null],
      [null, null],
    ]);
    expect(ytd?.total).toBe(5);
    expect(ytd?.totalPending).toBeNull();
  });

  it("마지막 달이 1월이면 1월 하나, 순서가 섞여 와도 마지막 달을 찾는다", () => {
    expect(ytdBars([m("2026-01", 2, "partial"), m("2025-12", 9)])?.bars).toHaveLength(1);
  });

  it("그 해 값이 모두 없거나 비면 null", () => {
    expect(ytdBars([])).toBeNull();
    expect(ytdBars([m("2026-01", null), m("2026-02", null)])).toBeNull();
  });
});

describe("axisTicks", () => {
  it("깔끔한 간격으로 0부터 최댓값 이상까지", () => {
    expect(axisTicks([4, 19, 47, 36])).toEqual([0, 10, 20, 30, 40, 50]);
    // 간격이 1보다 작으면 2.5배를 쓰지 않는다(소수 한 자리 글자로 정확히 보이게)
    expect(axisTicks([1.2])).toEqual([0, 0.5, 1, 1.5]);
    expect(axisTicks([0.3])).toEqual([0, 0.1, 0.2, 0.3]);
    expect(axisTicks([12])).toEqual([0, 2.5, 5, 7.5, 10, 12.5]);
    expect(axisTicks([100])).toEqual([0, 20, 40, 60, 80, 100]);
    expect(axisTicks([])).toEqual([0, 1]);
    expect(axisTicks([0])).toEqual([0, 1]);
  });
});

describe("readoutYear (01 비교 카드)", () => {
  it("2011년(MODIS 마지막 해)의 보정 전·후를 꺼낸다", () => {
    expect(readoutYear({ years: [2010, 2011, 2012], before: [1, 302, 9], after: [3, 734.5, 5] })).toEqual({
      year: 2011,
      before: 302,
      after: 734.5,
    });
  });

  it("그 해가 없거나 어느 한쪽이라도 0이면 값 없음(null)", () => {
    expect(readoutYear({ years: [2012, 2013], before: [1, 2], after: [3, 4] })).toBeNull();
    expect(readoutYear({ years: [2011], before: [0], after: [0] })).toBeNull();
    expect(readoutYear({ years: [2011], before: [0], after: [2] })).toBeNull();
    expect(readoutYear({ years: [2011], before: [302], after: [0] })).toBeNull();
  });
});

describe("annualBars", () => {
  it("2012년부터 post, 그 전은 pre", () => {
    const bars = annualBars({ years: [2010, 2011, 2012, 2013], before: [1, 2, 9, 8], after: [3, 4, 5, 6] });
    expect(bars.map((b) => b.era)).toEqual(["pre", "pre", "post", "post"]);
    expect(bars[2]).toEqual({ year: 2012, before: 9, after: 5, era: "post" });
  });

  it("배열 길이가 다르면 짧은 쪽에 맞춘다", () => {
    expect(annualBars({ years: [2001, 2002, 2003], before: [1, 2], after: [1, 2, 3] })).toHaveLength(2);
  });

  it("모두 0이면 자료 없음으로 본다", () => {
    expect(hasAnnualData(annualBars({ years: [2001, 2002], before: [0, 0], after: [0, 0] }))).toBe(false);
    expect(hasAnnualData(annualBars({ years: [2001], before: [0], after: [0.5] }))).toBe(true);
    expect(hasAnnualData([])).toBe(false);
  });
});

describe("niceMax", () => {
  it("최댓값 이상인 깔끔한 수", () => {
    expect(niceMax([20, 120, 96])).toBe(120);
    expect(niceMax([586.6, 12])).toBe(600);
    expect(niceMax([101])).toBe(120);
    expect(niceMax([1093])).toBe(1200);
    expect(niceMax([0.7])).toBe(0.8);
    expect(niceMax([1000])).toBe(1000);
  });

  it("비거나 모두 0이면 1", () => {
    expect(niceMax([])).toBe(1);
    expect(niceMax([0, 0])).toBe(1);
  });
});

describe("binLabel", () => {
  it("백엔드 다섯 단계를 두 언어의 화면 이름으로", () => {
    expect(binLabel("0.1~1", ko.about.detection.bins)).toBe("0.1–1 ha");
    expect(binLabel("100 ha 이상", ko.about.detection.bins)).toBe("100 ha 이상");
    expect(binLabel("100 ha 이상", en.about.detection.bins)).toBe("100 ha or more");
    expect(binLabel("0.1 ha 미만", en.about.detection.bins)).toBe("Under 0.1 ha");
  });

  it("표에 없는 이름은 받은 그대로(다른 나라 단계, 객체 기본 속성 이름 포함)", () => {
    expect(binLabel("1,000 ha 이상", ko.about.detection.bins)).toBe("1,000 ha 이상");
    expect(binLabel("toString", ko.about.detection.bins)).toBe("toString");
  });
});

describe("detectRows", () => {
  it("받은 순서 그대로, 없는 감지율은 길이 0, 없는 우연 기준은 세로선 없음", () => {
    const rows = detectRows(
      [
        { bin: "100 ha 이상", detected: 0.91, chance: 0.03 },
        { bin: "0.1~1", detected: null, chance: null },
      ],
      ko.about.detection.bins,
    );
    expect(rows.map((r) => r.label)).toEqual(["100 ha 이상", "0.1–1 ha"]);
    expect(rows[0]).toMatchObject({ width: 0.91, chanceAt: 0.03, detected: 0.91 });
    expect(rows[1]).toMatchObject({ width: 0, chanceAt: null, detected: null, chance: null });
  });
});

describe("clampRatio", () => {
  it("없는 값은 0, 범위 밖은 자른다", () => {
    expect(clampRatio(null)).toBe(0);
    expect(clampRatio(0.4)).toBe(0.4);
    expect(clampRatio(1.2)).toBe(1);
    expect(clampRatio(-0.1)).toBe(0);
  });
});

describe("formatPercent", () => {
  it("반올림한 백분율, 작은 값은 <1%, 없으면 —", () => {
    expect(formatPercent(0.91, "ko")).toBe("91%");
    expect(formatPercent(0, "en")).toBe("0%");
    expect(formatPercent(1, "en")).toBe("100%");
    expect(formatPercent(0.004, "ko")).toBe("<1%");
    expect(formatPercent(0.005, "ko")).toBe("1%");
    expect(formatPercent(null, "ko")).toBe("—");
  });
});
