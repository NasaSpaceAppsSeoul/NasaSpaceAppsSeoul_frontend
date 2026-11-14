import type { EChartsCoreOption } from "echarts/core";
import type { MonthlyPoint } from "../../lib/monthlyChart";
import { withAlpha, type ChartColors } from "./chartColors";

/*
 * 월별 선 그래프의 ECharts 옵션과 툴팁 HTML (React와 무관한 순수 함수, `MonthlyLineChart`가 쓴다).
 * 모양은 우주 테마에 맞게 다듬었다(2026-11-15 사용자): 그 해 값은 앰버 선 + 선 아래 앰버→투명 그라데이션 면,
 * 점과 점 위 값은 고른 달(파란 고리, 히트맵과 같은 표시)과 그 해 최고값, 집계 중인 달에만(점선 테두리, 색만으로 나누지 않는다).
 * 다른 달 값은 툴팁과 차트 아래 표에서 읽는다. 평년 중앙값은 얇은 흰 점선, 보통 해 범위는 옅은 흰 띠, 눈금은 아주 옅은 점선.
 */
export type MonthlyChartText = {
  monthLabel: (month: number) => string;
  /** 툴팁 제목 "2026년 3월" */
  tooltipTitle: (month: number) => string;
  value: (v: number) => string;
  yearLabel: string;
  median: string;
  band: string;
  partial: string;
  converted: string;
  noValue: string;
  future: string;
  /** 툴팁 맨 아래 단위 줄 */
  unit: string;
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** 툴팁 줄 앞 기호(범례와 같은 모양). 툴팁은 밝은 판이라 띠·점선은 어두운 글자색을 옅게 쓴다 */
function swatch(kind: "year" | "median" | "band", c: ChartColors): string {
  if (kind === "year") return `<span style="display:inline-block;width:16px;height:2px;border-radius:1px;background:${c.line};vertical-align:middle"></span>`;
  if (kind === "median") return `<span style="display:inline-block;width:16px;border-top:1.5px dashed ${withAlpha(c.surface, 0.55)};vertical-align:middle"></span>`;
  return `<span style="display:inline-block;width:16px;height:10px;border-radius:2px;background:${withAlpha(c.surface, 0.15)};vertical-align:middle"></span>`;
}

export function tooltipHtml(p: MonthlyPoint, text: MonthlyChartText, c: ChartColors): string {
  const row = (kind: "year" | "median" | "band", label: string, value: string) =>
    `<div style="display:flex;align-items:center;gap:8px;margin-top:4px">${swatch(kind, c)}<span style="flex:1">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
  const year = p.future ? text.future : p.value === null ? text.noValue : text.value(p.value);
  const marks = [p.partial && p.value !== null ? text.partial : null, p.converted && p.value !== null ? text.converted : null].filter(
    (m): m is string => m !== null,
  );
  return [
    `<div style="font-weight:600;font-size:13px">${escapeHtml(text.tooltipTitle(p.month))}</div>`,
    row("year", text.yearLabel, year),
    row("median", text.median, p.median === null ? text.noValue : text.value(p.median)),
    row("band", text.band, p.low === null || p.high === null ? text.noValue : `${text.value(p.low)}–${text.value(p.high)}`),
    `<div style="color:${withAlpha(c.surface, 0.6)};margin-top:6px;font-size:11px">${escapeHtml([text.unit, ...marks].join(" · "))}</div>`,
  ].join("");
}

export function buildOption(
  points: readonly MonthlyPoint[],
  selectedMonth: number | null,
  text: MonthlyChartText,
  c: ChartColors,
  /** 등장 애니메이션(움직임 줄이기면 `false`) */
  animate = false,
): EChartsCoreOption {
  // 점·값을 보일 달: 고른 달, 그 해 최고값, 집계 중인 달(점선 테두리로 상태를 보인다)
  const values = points.map((p) => p.value).filter((v): v is number => v !== null);
  // 모두 0이면 최고값 표시를 하지 않는다(0이 "최고값"으로 모든 달에 찍히지 않게)
  const max = values.length > 0 ? Math.max(...values) : 0;
  const peak = max > 0 ? max : null;
  const marked = (p: MonthlyPoint) => p.value !== null && (p.month === selectedMonth || p.value === peak || p.partial);
  const labelled = (p: MonthlyPoint) => p.value !== null && (p.month === selectedMonth || p.value === peak);
  const axisText = { fontFamily: "IBM Plex Mono, monospace", fontSize: 10 };

  return {
    // 등장: 선이 왼쪽부터 1.1초 동안 그려진다(첫 화면 02 막대와 같은 길이·부드러운 감속). 달을 바꾸면 0.6초로 바뀐다
    animation: animate,
    animationDuration: 1100,
    animationEasing: "quinticOut",
    animationDurationUpdate: 600,
    animationEasingUpdate: "cubicOut",
    // ECharts 6은 축 글자를 기본(`outerBoundsMode: "auto"`)으로 칸 안에 넣는다(`containLabel`은 옛 방식)
    grid: { left: 8, right: 16, top: 28, bottom: 8 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      // 아직 집계 전인 달은 더 흐리게(읽을 수는 있게). 글자를 건너뛰어 그려도 달과 짝이 맞게 항목마다 색을 둔다
      data: points.map((p) => ({ value: text.monthLabel(p.month), textStyle: { color: p.future ? withAlpha(c.muted, 0.6) : c.muted } })),
      axisLabel: axisText,
      axisLine: { lineStyle: { color: c.grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      splitNumber: 2,
      axisLabel: { ...axisText, color: c.muted, formatter: (v: number) => text.value(v) },
      splitLine: { lineStyle: { color: c.grid, type: "dashed", opacity: 0.6 } },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: withAlpha(c.ink, 0.25), type: "solid" } },
      backgroundColor: c.inverse,
      borderWidth: 0,
      textStyle: { color: c.surface, fontSize: 12 },
      // 히트맵·지도 툴팁과 같은 밝은 판
      extraCssText: "border-radius:10px;padding:10px 12px;min-width:180px;box-shadow:0 8px 24px rgba(0,0,0,0.27)",
      formatter: (params: unknown) => {
        const first = Array.isArray(params) ? (params[0] as { dataIndex?: number } | undefined) : undefined;
        const p = first?.dataIndex === undefined ? undefined : points[first.dataIndex];
        return p === undefined ? "" : tooltipHtml(p, text, c);
      },
    },
    series: [
      // 범위 띠: 아래 칸(투명) 위에 높이(high − low)를 쌓는다
      {
        type: "line",
        stack: "band",
        data: points.map((p) => p.low),
        lineStyle: { opacity: 0 },
        symbol: "none",
        silent: true,
      },
      {
        type: "line",
        stack: "band",
        data: points.map((p) => (p.low === null || p.high === null ? null : p.high - p.low)),
        lineStyle: { opacity: 0 },
        areaStyle: { color: c.band, opacity: 1 },
        symbol: "none",
        silent: true,
      },
      {
        type: "line",
        data: points.map((p) => p.median),
        lineStyle: { color: withAlpha(c.ink, 0.35), type: "dashed", width: 1 },
        symbol: "none",
        silent: true,
      },
      {
        type: "line",
        // 부드럽게 잇되 달 사이에서 값보다 튀어나오거나 0 아래로 내려가지 않게(단조 보간)
        smooth: 0.25,
        smoothMonotone: "x",
        data: points.map((p) => ({
          value: p.value,
          symbol: marked(p) ? "circle" : "none",
          symbolSize: p.month === selectedMonth ? 10 : 7,
          itemStyle:
            p.month === selectedMonth
              ? // 고른 달도 집계 중이면 점선(파란 고리만으로는 집계 중을 알 수 없다)
                { color: c.line, borderColor: c.selection, borderWidth: 2, borderType: p.partial ? "dashed" : "solid" }
              : { color: c.surface, borderColor: c.line, borderWidth: 1.5, borderType: p.partial ? "dashed" : "solid" },
          label: { show: labelled(p) },
        })),
        lineStyle: { color: c.line, width: 2, shadowColor: withAlpha(c.line, 0.45), shadowBlur: 8 },
        // 선 아래 앰버 → 투명(첫 화면 02 막대 색감)
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: withAlpha(c.line, 0.28) },
              { offset: 1, color: withAlpha(c.line, 0) },
            ],
          },
        },
        // 점 위 값은 툴팁·표와 같은 형식. 어두운 바깥선으로 선·면 위에서도 읽히게
        label: {
          position: "top",
          distance: 8,
          color: c.ink,
          fontSize: 12,
          fontWeight: 500,
          textBorderColor: c.surface,
          textBorderWidth: 3,
          formatter: (p: { value?: unknown }) => {
            const v = typeof p.value === "number" && Number.isFinite(p.value) ? p.value : null;
            return v === null ? "" : text.value(v);
          },
        },
        connectNulls: false,
      },
    ],
  };
}
