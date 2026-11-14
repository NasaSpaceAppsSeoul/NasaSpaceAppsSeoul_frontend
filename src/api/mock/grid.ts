import type { Country, GeoFeature, Position, RegionSummary, RegionType } from "../types";
import type { MockDetail, MockGeo } from "./types";

/*
 * 캘리포니아·캐나다 목의 임시 도형(`decisions.md` 10-4). 실제 지형이 아니라 나라 상자를 3×2로 나눈 사각형이다.
 * 실제 경계가 아니라는 점은 목 모드 표시 줄이 알린다.
 */

export type GridDistrict = { id: string; name: string; regionType: RegionType };

type Box = [number, number, number, number];

const round3 = (v: number) => Math.round(v * 1000) / 1000;

function rectangle([minLon, minLat, maxLon, maxLat]: Box): Position[][] {
  return [[[minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat]]];
}

function center([minLon, minLat, maxLon, maxLat]: Box): [number, number] {
  return [round3((minLon + maxLon) / 2), round3((minLat + maxLat) / 2)];
}

/** 나라 상자를 열 3 × 행 2로 나눠 앞에서부터 지역에 준다. 지역은 6곳 이하. */
function cells(box: Box, count: number): Box[] {
  const [minLon, minLat, maxLon, maxLat] = box;
  const width = (maxLon - minLon) / 3;
  const height = (maxLat - minLat) / 2;
  const out: Box[] = [];
  for (let i = 0; i < count; i += 1) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    out.push([
      round3(minLon + col * width),
      round3(maxLat - (row + 1) * height),
      round3(minLon + (col + 1) * width),
      round3(maxLat - row * height),
    ]);
  }
  return out;
}

function feature(id: string, label: string, box: Box): GeoFeature {
  return {
    type: "Feature",
    properties: { id, label_ko: label, province: null },
    geometry: { type: "Polygon", coordinates: rectangle(box) },
  };
}

/**
 * 시·도 단계가 없는 나라(`single`)의 `/regions`와 `/geo`를 만든다.
 * 백엔드와 같이: 주 전체 행의 `label_ko`는 한글, 카운티·지역구는 영문, `province`는 `null`,
 * 시·군·구 단계의 상위 ID는 나라 ID, `level=nat`에 주 경계 하나.
 */
export function singleLevelCountry(
  country: Country,
  nation: { labelKo: string; nameEn: string; box: Box },
  districts: GridDistrict[],
): { regions: RegionSummary[]; geo: () => MockGeo[]; detail: (id: string) => MockDetail | undefined } {
  const boxes = cells(nation.box, districts.length);
  const dists = districts.map((d, i) => ({ ...d, box: boxes[i] ?? nation.box }));
  // 이웃: 변이 맞닿은 칸(같은 행의 옆 열, 같은 열의 위아래 행). 위험 시기는 `detail-route.ts`가 시계열로 만든다
  const neighborsOf = (i: number) =>
    dists.filter((_, j) => (j % 3 === i % 3 && Math.abs(Math.floor(j / 3) - Math.floor(i / 3)) === 1) ||
      (Math.floor(j / 3) === Math.floor(i / 3) && Math.abs((j % 3) - (i % 3)) === 1)).map((d) => d.id);
  const details = new Map<string, MockDetail>([
    [country, { neighbors: [] }],
    ...dists.map((d, i): [string, MockDetail] => [d.id, { neighbors: neighborsOf(i) }]),
  ]);
  // 백엔드 정렬: (시·도, 이름) 순. 시·도가 없으니 이름순(문자 코드 순)
  const sorted = [...dists].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const regions: RegionSummary[] = [
    {
      id: country,
      label_ko: nation.labelKo,
      name_en: nation.nameEn,
      level: "nat",
      province: null,
      region_type: "sufficient",
      center: center(nation.box),
      bbox: nation.box,
    },
    ...sorted.map(
      (d): RegionSummary => ({
        id: d.id,
        label_ko: d.name,
        name_en: d.name,
        level: "dist",
        province: null,
        region_type: d.regionType,
        center: center(d.box),
        bbox: d.box,
      }),
    ),
  ];

  const geo = (): MockGeo[] => [
    { level: "nat", parentId: null, feature: feature(country, nation.labelKo, nation.box) },
    ...sorted.map((d): MockGeo => ({ level: "dist", parentId: country, feature: feature(d.id, d.name, d.box) })),
  ];

  return { regions, geo, detail: (id) => details.get(id) };
}
