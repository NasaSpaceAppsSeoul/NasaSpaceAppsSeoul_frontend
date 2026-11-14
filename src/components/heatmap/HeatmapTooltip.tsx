/*
 * 히트맵 툴팁 (4-6, components/sheet/04-calendar-kr-a의 어두운 상자).
 * "지역 · 연월 / 값 / 추정·센서 환산·품질 / 범위". 줄은 화면이 만들어 넘기고 여기서는 그리기만 한다.
 */
export type TooltipLines = { heading: string; value: string | null; meta: string | null; band: string | null; note: string | null };

/** 칸 기준 가로 위치. 가장자리 열은 안쪽으로 붙인다 */
export type TooltipAlign = "start" | "center" | "end";

const ALIGN: Record<TooltipAlign, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

export function HeatmapTooltip({ id, lines, align }: { id: string; lines: TooltipLines; align: TooltipAlign }) {
  return (
    <div
      id={id}
      role="tooltip"
      className={`pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-xs rounded-control-sm bg-inverse px-4 py-3 text-left text-surface ${ALIGN[align]}`}
    >
      <p className="text-sm font-semibold">{lines.heading}</p>
      {lines.value !== null && <p className="text-sm font-semibold">{lines.value}</p>}
      {lines.meta !== null && <p className="text-xs text-surface/70">{lines.meta}</p>}
      {lines.band !== null && <p className="text-xs text-surface/70">{lines.band}</p>}
      {lines.note !== null && <p className="text-xs text-surface/70">{lines.note}</p>}
    </div>
  );
}
