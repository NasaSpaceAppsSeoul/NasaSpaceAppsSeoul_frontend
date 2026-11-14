import { describe, expect, it } from "vitest";
import { keys } from "./keys";

describe("쿼리 키", () => {
  it("나라가 맨 앞이고, 빈 범위는 null로 맞춘다", () => {
    expect(keys.baseline("KOR", "경북")).toEqual(["KOR", "baseline", "경북"]);
    expect(keys.series("KOR", "KOR")).toEqual(keys.series("KOR", "KOR", { from: undefined, to: undefined }));
    expect(keys.series("KOR", "KOR", { from: "2025-01" })).toEqual(["KOR", "series", "KOR", { from: "2025-01", to: null }]);
  });
});
