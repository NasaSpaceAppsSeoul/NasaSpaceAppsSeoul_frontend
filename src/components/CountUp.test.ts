import { describe, expect, it } from "vitest";
import { frame, parse } from "./CountUp";

describe("CountUp 숫자 해석 (모든 화면 숫자 올라가기)", () => {
  it("쉼표 묶음·소수 자리·범위의 두 숫자를 그대로 지키며 진행률만큼 그린다", () => {
    expect(frame(parse("1,093"), 0)).toBe("0");
    expect(frame(parse("1,093"), 0.5)).toBe("547");
    expect(frame(parse("1,093"), 1)).toBe("1,093");
    expect(frame(parse("≈ 1.00배"), 0)).toBe("≈ 0.00배");
    expect(frame(parse("≈ 1.00배"), 1)).toBe("≈ 1.00배");
    expect(frame(parse("80–97%"), 0.5)).toBe("40–49%");
    expect(frame(parse("12345.6"), 1)).toBe("12345.6");
    expect(frame(parse("—"), 0)).toBe("—");
  });
});
