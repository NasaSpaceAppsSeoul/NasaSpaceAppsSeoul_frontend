import { describe, expect, it } from "vitest";
import { frame, parse, progressAt } from "./CountUp";

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

  it("프레임 시각이 시작 시각보다 앞서도 진행률은 0 아래로 내려가지 않는다(음수가 그려지지 않는다)", () => {
    // rAF가 주는 시각(프레임 시작)이 performance.now()로 잡은 시작보다 16ms 앞선 경우
    expect(progressAt(1000, 1016)).toBe(0);
    expect(frame(parse("1,093"), progressAt(1000, 1016))).toBe("0");
    expect(progressAt(1000, 1000)).toBe(0);
    expect(progressAt(1375, 1000)).toBe(0.5);
    expect(progressAt(1750, 1000)).toBe(1);
    expect(progressAt(9999, 1000)).toBe(1);
  });
});
