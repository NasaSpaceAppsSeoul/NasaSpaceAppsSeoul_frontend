import { describe, expect, it } from "vitest";
import { ko } from "../i18n/ko";
import { en } from "../i18n/en";
import { formatPercent } from "./format";
import { annualBars, binLabel, clampRatio, detectRows, hasAnnualData, niceMax } from "./landing";

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
