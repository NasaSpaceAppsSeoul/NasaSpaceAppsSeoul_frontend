/*
 * 차트 색. `styles/index.css` 토큰에서 읽는다(지도의 `readMapColors`와 같은 방식). 값이 없으면(테스트 환경) 회색.
 * 선은 보정 후 앰버(첫 화면 02 막대와 같은 색), 범위 띠는 유리 판 안의 옅은 흰 막(`wash`), 눈금은 판 선(`line`).
 * 고른 달 고리는 히트맵과 같은 선택 파랑(2026-11-15 사용자: 테마에 맞게 세련되게).
 */
export type ChartColors = {
  line: string;
  band: string;
  grid: string;
  ink: string;
  muted: string;
  surface: string;
  inverse: string;
  selection: string;
};

const FALLBACK = "#808080";

export function readChartColors(): ChartColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim() || FALLBACK;
  return {
    line: read("--color-bar-harmonized-from"),
    band: read("--color-wash"),
    grid: read("--color-line"),
    ink: read("--color-ink"),
    muted: read("--color-muted"),
    surface: read("--color-surface"),
    inverse: read("--color-inverse"),
    selection: read("--color-selection"),
  };
}

/** `#rrggbb`에 투명도를 붙인 `rgba(...)`. 다른 형식이면 그대로 돌려준다(이미 rgba인 토큰 등) */
export function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (m === null) return color;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h ?? "80", 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
