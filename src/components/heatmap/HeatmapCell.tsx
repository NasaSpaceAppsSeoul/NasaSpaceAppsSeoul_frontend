import type { HeatCell, HeatLevel } from "../../lib/heatmap";

/*
 * 히트맵 칸 하나 (components/sheet/04-calendar-*). 색은 8색 중 5색(4-1), 무늬는 `index.css`의 `heat-*` 유틸리티.
 * 상태를 색만으로 전하지 않도록 칸의 읽는 이름(`label`)에 상태를 글로 넣는다.
 */
const LEVEL_CLASS: Record<HeatLevel, string> = {
  0: "bg-heat-0",
  1: "bg-heat-2",
  2: "bg-heat-4",
  3: "bg-heat-5",
  4: "bg-heat-7",
};

function cellClass(cell: HeatCell): string {
  switch (cell.state) {
    case "future":
      return "border border-dashed border-heat-future bg-page text-heat-future";
    case "blank":
      return "bg-transparent";
    case "noData":
      return "heat-hatch";
    case "partial":
      return `${LEVEL_CLASS[cell.level]} border-2 border-dashed border-heat-partial`;
    default:
      return LEVEL_CLASS[cell.level];
  }
}

type HeatmapCellProps = {
  cell: HeatCell;
  label: string;
  tooltipId: string | undefined;
  focusable: boolean;
  onActivate: () => void;
  onFocusCell: () => void;
  onHover: (hovering: boolean) => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
};

export function HeatmapCell({ cell, label, tooltipId, focusable, onActivate, onFocusCell, onHover, buttonRef }: HeatmapCellProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      aria-describedby={tooltipId}
      // 누를 수 없는 칸도 포커스와 툴팁은 남긴다(키보드로 이유를 볼 수 있게)
      aria-disabled={!cell.clickable}
      aria-current={cell.selected ? "date" : undefined}
      tabIndex={focusable ? 0 : -1}
      onClick={() => {
        if (cell.clickable) onActivate();
      }}
      onFocus={onFocusCell}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      className={
        "flex h-5 w-full items-center justify-center rounded-cell text-xs leading-none " +
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink " +
        (cell.clickable ? "cursor-pointer " : "cursor-default ") +
        (cell.converted ? "heat-dots " : "") +
        (cell.selected ? "outline-2 outline-selection " : "") +
        cellClass(cell)
      }
    >
      {cell.state === "future" && <span aria-hidden="true">—</span>}
    </button>
  );
}
