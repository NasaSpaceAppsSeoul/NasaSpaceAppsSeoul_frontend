import type { HeatCell, HeatLevel } from "../../lib/heatmap";

/*
 * 히트맵 칸 하나. 값 구간·상태·뜻은 지금 구현(백엔드 기준) 그대로, 모양은 시안 v9 달력 점(`.db-calendar-dot`, D8):
 * 누를 자리는 칸 폭 × 32px, 그 가운데 16px 원형 점. 색은 8색 중 5색(4-1), 무늬는 `index.css`의 `heat-*` 유틸리티.
 * 호버·포커스는 점이 조금 커지고 흰 고리, 고른 달은 파란 고리(시안 값).
 * 상태를 색만으로 전하지 않도록 칸의 읽는 이름(`label`)에 상태를 글로 넣는다.
 */
const LEVEL_CLASS: Record<HeatLevel, string> = {
  0: "bg-heat-0",
  1: "bg-heat-2",
  2: "bg-heat-4",
  3: "bg-heat-5",
  4: "bg-heat-7",
};

/** 점 테두리 흰 9%(시안 #ffffff18). 테두리로 상태를 그리는 집계 중·집계 전에는 쓰지 않는다(색이 겹쳐 덮인다) */
const EDGE = "border border-white/10";

function cellClass(cell: HeatCell): string {
  switch (cell.state) {
    case "future":
      // 아직 집계 전: 빈 점선 고리(시안 `.future`)
      return "border border-dashed border-heat-future bg-transparent";
    case "blank":
      return "bg-transparent";
    case "noData":
      return `${EDGE} heat-hatch`;
    case "partial":
      // 집계 중: 점 바깥 점선 고리(16px 점 안에 굵은 점선을 그리면 톱니처럼 보인다). 고른 달이면 파란 고리가 덮는다
      return `${EDGE} ${LEVEL_CLASS[cell.level]} outline-1 outline-offset-3 outline-dashed outline-heat-partial-ring`;
    default:
      return `${EDGE} ${LEVEL_CLASS[cell.level]}`;
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
      // 포커스 표시는 버튼이 아니라 점에 그린다(시안: 점 바깥 고리)
      className={"group flex h-8 w-full items-center justify-center outline-none " + (cell.clickable ? "cursor-pointer" : "cursor-default")}
    >
      <span
        aria-hidden="true"
        className={
          "block size-4 rounded-full transition-transform duration-150 group-hover:scale-112 group-focus-visible:scale-112 " +
          // 고른 달은 파란 고리를 지킨다(호버·포커스 흰 고리가 우선순위가 높아 덮으므로 아예 붙이지 않는다, 시안도 파란 고리 유지)
          (cell.selected
            ? ""
            : "group-hover:outline-1 group-hover:outline-offset-3 group-hover:outline-solid group-hover:outline-ink " +
              "group-focus-visible:outline-2 group-focus-visible:outline-offset-3 group-focus-visible:outline-solid group-focus-visible:outline-ink ") +
          (cell.converted ? "heat-dots " : "") +
          (cell.selected ? "outline-2 outline-offset-3 outline-solid outline-selection " : "") +
          cellClass(cell)
        }
      />
    </button>
  );
}
