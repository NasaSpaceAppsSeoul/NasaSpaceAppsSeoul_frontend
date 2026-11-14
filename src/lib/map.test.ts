import { describe, expect, it } from "vitest";
import {
  ageClass,
  binOf,
  boundsOf,
  dayDate,
  earliestDay,
  fillStates,
  filterPoints,
  firstDayCells,
  mapLegend,
  provinceBorders,
  visibleRegionIds,
} from "./map";

const square = (x: number, y: number) => ({
  type: "Polygon" as const,
  coordinates: [
    [
      [x, y],
      [x + 1, y],
      [x + 1, y + 1],
      [x, y + 1],
      [x, y],
    ] as [number, number][],
  ],
});
const feature = (id: string, province: string | null, x = 0, y = 0) => ({ properties: { id, province }, geometry: square(x, y) });

describe("binOf (E-1, a 이상 b 미만)", () => {
  it("0은 0단계, 경계와 같은 값은 위 단계, null은 값 없음", () => {
    const bins = [3, 10, 30] as const;
    expect(binOf(0, bins)).toBe(0);
    expect(binOf(2.4, bins)).toBe(1);
    expect(binOf(3, bins)).toBe(2);
    expect(binOf(10, bins)).toBe(3);
    expect(binOf(30, bins)).toBe(4);
    expect(binOf(null, bins)).toBe("none");
  });
});

describe("fillStates (5-4, 5-5)", () => {
  it("응답에 없는 구역과 map_bin null은 none, 0은 0", () => {
    const states = fillStates(["a", "b", "c"], [
      { id: "a", map_bin: 0 },
      { id: "b", map_bin: null },
    ]);
    expect(states.get("a")).toBe(0);
    expect(states.get("b")).toBe("none");
    expect(states.get("c")).toBe("none");
  });

  it("응답이 아직 없으면 모두 none", () => {
    expect(fillStates(["a"], undefined).get("a")).toBe("none");
  });
});

describe("visibleRegionIds", () => {
  const features = [feature("a", "경북"), feature("b", "경북"), feature("c", "강원")];
  it("나라는 전부, 시·도는 그 시·도만", () => {
    expect(visibleRegionIds(features, { id: "KOR", level: "nat" })).toEqual(["a", "b", "c"]);
    expect(visibleRegionIds(features, { id: "경북", level: "prov" })).toEqual(["a", "b"]);
  });
  it("시·군·구는 자기 + 이웃, 이웃이 없으면 자기만, 경계 없는 ID는 뺀다", () => {
    expect(visibleRegionIds(features, { id: "a", level: "dist" }, ["c", "없음"])).toEqual(["a", "c"]);
    expect(visibleRegionIds(features, { id: "a", level: "dist" })).toEqual(["a"]);
    expect(visibleRegionIds(features, { id: "영광", level: "dist" })).toEqual([]);
  });
});

describe("점", () => {
  const items: [number, number, number, string | null][] = [
    [128.661, 36.369, 5, "a"],
    [128.664, 36.371, 3, "a"],
    [128.7, 36.4, 7, "b"],
    [124.9, 36.5, 1, null],
  ];

  it("filterPoints: 보이는 구역만, 경계 밖 점은 나라 화면에서만", () => {
    expect(filterPoints(items, new Set(["a"]), false)).toHaveLength(2);
    expect(filterPoints(items, new Set(["a"]), true)).toHaveLength(3);
  });

  it("firstDayCells: 같은 0.01° 칸은 하나로, 가장 이른 날의 점을 남긴다", () => {
    const cells = firstDayCells(items);
    expect(cells).toHaveLength(3);
    expect(cells.find((c) => c.regionId === "a")).toEqual({ lon: 128.664, lat: 36.371, firstDay: 3, regionId: "a" });
  });

  it("firstDayCells: 7장의 세 칸 점도 받는다", () => {
    expect(firstDayCells([[1, 1, 2]])).toEqual([{ lon: 1, lat: 1, firstDay: 2, regionId: null }]);
  });

  it("earliestDay와 ageClass(5-2)", () => {
    expect(earliestDay([])).toBeNull();
    expect(earliestDay(firstDayCells(items))).toBe(1);
    expect([3, 4, 5, 6, 20].map((d) => ageClass(d, 3))).toEqual([0, 1, 2, 3, 3]);
  });
});

describe("boundsOf", () => {
  it("구역들의 상자, 비면 null", () => {
    expect(boundsOf([feature("a", null, 0, 0), feature("b", null, 2, 3)])).toEqual([0, 0, 3, 4]);
    expect(boundsOf([])).toBeNull();
  });
});

describe("provinceBorders (안 B, 건너편 확인)", () => {
  const key = ([p, q]: [number, number][]) => [p?.join(","), q?.join(",")].sort().join("-");
  const rect = (id: string, province: string, x0: number, x1: number, mid: [number, number][] = []) => ({
    properties: { id, province },
    geometry: {
      type: "Polygon" as const,
      coordinates: [[[x0, 0], [x1, 0], ...mid, [x1, 1], [x0, 1], [x0, 0]] as [number, number][]],
    },
  });

  it("같은 시·도끼리 공유한 변은 지우고, 다른 시·도와 공유한 변만 남긴다. 바깥 변(바다)은 굵게 그리지 않는다", () => {
    const borders = provinceBorders([feature("a", "경북", 0, 0), feature("b", "경북", 1, 0), feature("c", "강원", 2, 0)]);
    expect(borders.geometry.coordinates.map(key)).toEqual(["2,0-2,1"]);
  });

  it("꼭짓점이 어긋난 같은 시·도 경계는 지운다", () => {
    // a의 오른쪽 변은 (1,0)-(1,1) 한 변, b의 왼쪽 변은 (1,0.5)를 더 거쳐 꼭짓점이 어긋난다
    const a = rect("a", "경북", 0, 1);
    const b = { properties: { id: "b", province: "경북" }, geometry: { type: "Polygon" as const, coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1.0001, 0.5], [1, 0]] as [number, number][]] } };
    expect(provinceBorders([a, b]).geometry.coordinates).toEqual([]);
  });

  it("꼭짓점이 어긋난 다른 시·도 경계는 ID가 작은 쪽 변 하나만 남긴다", () => {
    const a = rect("a", "경북", 0, 1);
    const b = { properties: { id: "b", province: "강원" }, geometry: { type: "Polygon" as const, coordinates: [[[1, 0], [2, 0], [2, 1], [1, 1], [1.0001, 0.5], [1, 0]] as [number, number][]] } };
    expect(provinceBorders([a, b]).geometry.coordinates.map(key)).toEqual(["1,0-1,1"]);
  });
});

describe("mapLegend, dayDate", () => {
  it("bins로 다섯 칸", () => {
    expect(mapLegend([3, 10, 30])).toEqual([
      { level: 0, kind: "zero" },
      { level: 1, kind: "below", to: 3 },
      { level: 2, kind: "between", from: 3, to: 10 },
      { level: 3, kind: "between", from: 10, to: 30 },
      { level: 4, kind: "above", from: 30 },
    ]);
  });
  it("YYYY-MM-DD", () => {
    expect(dayDate("2025-03", 6)).toBe("2025-03-06");
  });
});
