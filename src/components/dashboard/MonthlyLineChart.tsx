import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { SVGRenderer } from "echarts/renderers";
import { useEffect, useEffectEvent, useRef } from "react";
import type { MonthlyPoint } from "../../lib/monthlyChart";
import { readChartColors } from "./chartColors";
import { buildOption, type MonthlyChartText } from "./monthlyChartOption";

/*
 * 나라 화면 월별 선 그래프 (screens/kr/dashboard-national.png 아래 오른쪽). 옵션은 `monthlyChartOption.ts`.
 * 인스턴스는 `ref`에 두고 생성·갱신·정리만 `useEffect`(명령형 라이브러리 예외, `MapCanvas`와 같음).
 * 차트 자체는 화면 읽기에서 숨기고, 같은 값은 `MonthlyChartFooter`의 숨김 표로 둔다.
 * 등장(시안 v9 차트 등장, 첫 화면 02 막대와 같은 1.1초): 차트가 화면에 들어온 뒤에 처음 그려 선이 그려지는 모습이 보이게 한다.
 * 움직임 줄이기면 바로 그린다. 관찰자가 없는 환경(테스트)은 바로 그린다.
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
  /** 화면에 들어온 뒤부터 그린다 */
  const seen = useRef(false);
  const draw = useEffectEvent(() => {
    if (!seen.current) return;
    const animate = typeof window.matchMedia !== "function" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    chartRef.current?.setOption(buildOption(points, selectedMonth, text, readChartColors(), animate), { notMerge: true });
  });

  // 생성과 정리. 칸 크기가 바뀌면 다시 맞춘다
  useEffect(() => {
    const el = container.current;
    if (el === null) return;
    const chart = echarts.init(el, null, { renderer: "svg" });
    chartRef.current = chart;
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => chart.resize());
    observer?.observe(el);
    const show = () => {
      seen.current = true;
      draw();
    };
    const appear =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            appear?.disconnect();
            show();
          }, { threshold: 0.2 });
    if (appear === null) show();
    else appear.observe(el);
    return () => {
      appear?.disconnect();
      observer?.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    draw();
  }, [points, selectedMonth, text]);

  return <div ref={container} aria-hidden="true" className="h-72 w-full" />;
}
