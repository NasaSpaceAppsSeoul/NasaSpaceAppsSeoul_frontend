import { dividerAfter, type HeatCell, type HeatRow } from "./heatmap";

/*
 * 달력 PNG의 배치 계산(9장, 백엔드에 PNG가 없어 프론트가 그린다). 화면 달력과 같은 칸 모델(`buildGrid`)을 받아
 * 해 = 가로(왼쪽이 오래된 해), 달 = 세로(위가 1월)로 놓는다. 그리기는 `components/heatmap/calendarPng.ts`.
 * 단위는 CSS px(그릴 때 2배로 키운다).
 */
export const IMAGE = {
  padding: 40,
  titleHeight: 76,
  /** 달 이름 칸 폭 */
  labelWidth: 44,
  /** 해 한 칸 폭(화면 달력 점 사이와 비슷하게) */
  colWidth: 36,
  rowHeight: 28,
  /** 해 이름 줄 높이 */
  headHeight: 24,
  dotRadius: 8,
  /** 범례·출처 영역 높이 */
  footerHeight: 132,
  minWidth: 720,
} as const;

export type ImageDot = { x: number; y: number; cell: HeatCell };
export type ImageLayout = {
  width: number;
  height: number;
  /** 해 이름(가운데 x) */
  years: { year: number; x: number }[];
  /** 달 이름(1~12, 가운데 y) */
  months: { month: number; y: number }[];
  dots: ImageDot[];
  /** 센서 전환 세로 점선의 x(그 해와 앞 해 사이 = 그 해 칸 왼쪽 끝, `dividerAfter`) */
  dividers: { x: number; key: string }[];
  gridTop: number;
  gridBottom: number;
  footerTop: number;
};

/** `rows`는 `buildGrid` 결과(위가 최근 해). 그림은 왼쪽이 오래된 해다. 빈 격자면 `null` */
export function calendarLayout(rows: readonly HeatRow[]): ImageLayout | null {
  if (rows.length === 0) return null;
  const ordered = [...rows].reverse();
  const { padding, titleHeight, labelWidth, colWidth, rowHeight, headHeight, footerHeight, minWidth } = IMAGE;
  const gridLeft = padding + labelWidth;
  const gridTop = padding + titleHeight + headHeight;
  const width = Math.max(minWidth, gridLeft + ordered.length * colWidth + padding);
  const gridBottom = gridTop + 12 * rowHeight;
  const footerTop = gridBottom + 24;
  const height = footerTop + footerHeight;
  const visible = new Set(ordered.map((r) => r.year));

  const years = ordered.map((row, i) => ({ year: row.year, x: gridLeft + i * colWidth + colWidth / 2 }));
  const months = Array.from({ length: 12 }, (_, m) => ({ month: m + 1, y: gridTop + m * rowHeight + rowHeight / 2 }));
  const dots: ImageDot[] = [];
  ordered.forEach((row, i) => {
    row.cells.forEach((cell, m) => {
      const x = years[i]?.x ?? 0;
      const y = months[m]?.y ?? 0;
      dots.push({ x, y, cell });
    });
  });
  const dividers = ordered.flatMap((row, i) => {
    const key = dividerAfter(row.year, visible);
    return key === null ? [] : [{ x: gridLeft + i * colWidth, key }];
  });
  return { width, height, years, months, dots, dividers, gridTop, gridBottom, footerTop };
}
