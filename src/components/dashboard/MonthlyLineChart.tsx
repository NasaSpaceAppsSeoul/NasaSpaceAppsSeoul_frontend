import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";
import type { MonthlyPoint } from "../../lib/monthlyChart";
import { readChartColors, type ChartColors } from "./chartColors";

/*
 * 나라 화면 월별 선 그래프 (screens/kr/dashboard-national.png 아래 오른쪽, components/sheet/05-charts-tooltips).
 * 그 해 값(주황 선과 빈 원 점, 점 위 값), 평년 중앙값(점선), 보통 해 범위(옅은 띠), 세로 안내선과 어두운 툴팁.
 * 집계 중인 달은 점 테두리를 점선으로(색만으로 나누지 않는다), 선택한 달은 점을 크게.
 * 인스턴스는 `ref`에 두고 생성·갱신·정리만 `useEffect`(명령형 라이브러리 예외, `MapCanvas`와 같음).
 * 차트 자체는 화면 읽기에서 숨기고, 같은 값을 숨김 표로 옆에 둔다(구역).
 */
echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

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

type MonthlyLineChartProps = {
  points: readonly MonthlyPoint[];
  /** 주소의 달(1~12). 그 해가 아니면 `null`. 점을 크게 그린다 */
  selectedMonth: number | null;
  text: MonthlyChartText;
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** 툴팁 줄 앞 기호(범례와 같은 모양): 주황 선 + 빈 원, 점선, 베이지 네모 */
function swatch(kind: "year" | "median" | "band", c: ChartColors): string {
  if (kind === "year") {
    return `<span style="position:relative;display:inline-block;width:16px;height:2px;background:${c.line};vertical-align:middle"><span style="position:absolute;left:4px;top:-3px;width:8px;height:8px;border:2px solid ${c.line};border-radius:50%;box-sizing:border-box;background:${c.inverse}"></span></span>`;
  }
  if (kind === "median") return `<span style="display:inline-block;width:16px;border-top:2px dashed ${c.surface};vertical-align:middle"></span>`;
  return `<span style="display:inline-block;width:16px;height:10px;border-radius:2px;background:${c.band};vertical-align:middle"></span>`;
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
    `<div style="color:${c.border};margin-top:6px;font-size:11px">${escapeHtml([text.unit, ...marks].join(" · "))}</div>`,
  ].join("");
}

export function buildOption(
  points: readonly MonthlyPoint[],
  selectedMonth: number | null,
  text: MonthlyChartText,
  c: ChartColors,
): echarts.EChartsCoreOption {
  return {
    animation: false,
    // ECharts 6은 축 글자를 기본(`outerBoundsMode: "auto"`)으로 칸 안에 넣는다(`containLabel`은 옛 방식)
    grid: { left: 8, right: 16, top: 28, bottom: 8 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      // 아직 집계 전인 달은 흐린 회색(읽을 수는 있게). 글자를 건너뛰어 그려도 달과 짝이 맞게 항목마다 색을 둔다
      data: points.map((p) => ({ value: text.monthLabel(p.month), textStyle: { color: p.future ? c.muted : c.ink } })),
      axisLine: { lineStyle: { color: c.border } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      min: 0,
      splitNumber: 2,
      axisLabel: { color: c.muted, fontFamily: "IBM Plex Mono, monospace", formatter: (v: number) => text.value(v) },
      splitLine: { lineStyle: { color: c.border } },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line", lineStyle: { color: c.border, type: "solid" } },
      backgroundColor: c.inverse,
      borderWidth: 0,
      textStyle: { color: c.surface, fontSize: 12 },
      extraCssText: "border-radius:12px;padding:10px 12px;min-width:180px",
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
        areaStyle: { color: c.band, opacity: 0.55 },
        symbol: "none",
        silent: true,
      },
      {
        type: "line",
        data: points.map((p) => p.median),
        lineStyle: { color: c.ink, type: "dashed", width: 1.5 },
        symbol: "none",
        silent: true,
      },
      {
        type: "line",
        data: points.map((p) => ({
          value: p.value,
          symbolSize: p.month === selectedMonth ? 12 : 8,
          itemStyle: { borderType: p.partial ? "dashed" : "solid" },
        })),
        lineStyle: { color: c.line, width: 2 },
        itemStyle: { color: c.surface, borderColor: c.line, borderWidth: 2 },
        symbol: "circle",
        // 점 위 값은 툴팁·표와 같은 형식. 흰 바깥선으로 선 위에서도 읽히게
        label: {
          show: true,
          position: "top",
          color: c.ink,
          fontSize: 12,
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

export function MonthlyLineChart({ points, selectedMonth, text }: MonthlyLineChartProps) {
  const container = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  // 생성과 정리. 칸 크기가 바뀌면 다시 맞춘다
  useEffect(() => {
    const el = container.current;
    if (el === null) return;
    const chart = echarts.init(el, null, { renderer: "svg" });
    chartRef.current = chart;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => chart.resize());
    observer?.observe(el);
    return () => {
      observer?.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(buildOption(points, selectedMonth, text, readChartColors()), { notMerge: true });
  }, [points, selectedMonth, text]);

  return <div ref={container} aria-hidden="true" className="h-72 w-full" />;
}
