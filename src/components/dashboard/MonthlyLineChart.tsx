import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { useEffect, useRef } from "react";
import type { MonthlyPoint } from "../../lib/monthlyChart";
import { readChartColors } from "./chartColors";
import { buildOption, type MonthlyChartText } from "./monthlyChartOption";

/*
 * 나라 화면 월별 선 그래프 (screens/kr/dashboard-national.png 아래 오른쪽). 옵션은 `monthlyChartOption.ts`.
 * 인스턴스는 `ref`에 두고 생성·갱신·정리만 `useEffect`(명령형 라이브러리 예외, `MapCanvas`와 같음).
 * 차트 자체는 화면 읽기에서 숨기고, 같은 값은 `MonthlyChartFooter`의 숨김 표로 둔다.
 */
echarts.use([LineChart, GridComponent, TooltipComponent, SVGRenderer]);

export type { MonthlyChartText };

type MonthlyLineChartProps = {
  points: readonly MonthlyPoint[];
  /** 주소의 달(1~12). 그 해가 아니면 `null`. 점을 크게 그린다 */
  selectedMonth: number | null;
  text: MonthlyChartText;
};

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
