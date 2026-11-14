/*
 * 차트 색. `styles/index.css` 토큰에서 읽는다(지도의 `readMapColors`와 같은 방식). 값이 없으면(테스트 환경) 회색.
 * 선은 보정 후 막대와 같은 주황, 띠는 2012년 이전 막대와 같은 베이지(디자인 dashboard-national 월별 활동).
 */
export type ChartColors = { line: string; band: string; ink: string; muted: string; border: string; surface: string; inverse: string };

const FALLBACK = "#808080";

export function readChartColors(): ChartColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim() || FALLBACK;
  return {
    line: read("--color-bar-harmonized-to"),
    band: read("--color-bar-pre2012"),
    ink: read("--color-ink"),
    muted: read("--color-muted"),
    border: read("--color-border"),
    surface: read("--color-surface"),
    inverse: read("--color-inverse"),
  };
}
