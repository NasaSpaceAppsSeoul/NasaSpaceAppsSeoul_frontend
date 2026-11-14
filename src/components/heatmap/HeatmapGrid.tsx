import { Fragment, useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import { useMessages } from "../../i18n";
import { dividerAfter, type HeatRow } from "../../lib/heatmap";
import { HeatmapCell } from "./HeatmapCell";
import { HeatmapTooltip, type TooltipAlign } from "./HeatmapTooltip";
import { useCellText, type BandFor } from "./useCellText";

/*
 * 해 × 12달 격자 (screens/kr/dashboard-*.png 달력 카드). 위가 최근 해.
 * 키보드: 격자에는 Tab 한 번으로 들어가고(로빙 tabindex) 방향키로 칸을 옮긴다. Enter로 그 달, Esc로 툴팁 닫기.
 * 툴팁은 마우스를 올린 칸, 또는 키보드 포커스가 있는 칸에 뜬다(마우스로 눌러 생긴 포커스에는 띄우지 않는다).
 * 툴팁 상태는 여기 둔다(구역 전체가 다시 그려지지 않게).
 */
type HeatmapGridProps = {
  rows: HeatRow[];
  regionLabel: string;
  bandFor: BandFor;
  onSelect: (month: string) => void;
};

/** 가장자리 열은 툴팁을 안쪽으로 붙여 카드 밖으로 나가지 않게 한다 */
function alignFor(col: number): TooltipAlign {
  if (col <= 1) return "start";
  if (col >= 10) return "end";
  return "center";
}

const DELTA: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };

export function HeatmapGrid({ rows, regionLabel, bandFor, onSelect }: HeatmapGridProps) {
  const t = useMessages().heatmap;
  const text = useCellText(regionLabel, bandFor);
  const tooltipId = useId();
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const pointerDown = useRef(false);
  const cells = rows.flatMap((r) => r.cells);
  const initial = cells.find((c) => c.selected)?.month ?? cells.find((c) => c.clickable)?.month ?? cells[0]?.month;
  const [focusState, setFocusMonth] = useState(initial);
  // 표시 연도를 바꿔 포커스 칸이 빠지면 대신할 칸을 정한다(Tab으로 들어갈 칸이 늘 하나 있게)
  const focusMonth = cells.some((c) => c.month === focusState) ? focusState : initial;
  const [hoverMonth, setHoverMonth] = useState<string | null>(null);
  const [tooltipHidden, setTooltipHidden] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const activeMonth = tooltipHidden ? null : (hoverMonth ?? (keyboardFocus ? focusMonth : undefined) ?? null);
  const visibleYears = new Set(rows.map((r) => r.year));

  // 마우스로 띄운 툴팁도 Esc로 닫는다(WCAG 1.4.13). `useEffect` 대신 ref 콜백으로 문서에 붙였다 뗀다
  const listenEscape = useCallback((node: HTMLDivElement | null) => {
    if (node === null) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setTooltipHidden(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const move = (event: KeyboardEvent, rowIndex: number, col: number) => {
    const step = DELTA[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const target = rows[rowIndex + step[0]]?.cells[col + step[1]];
    if (target === undefined) return;
    setTooltipHidden(false);
    setFocusMonth(target.month);
    refs.current.get(target.month)?.focus();
  };

  return (
    // 1024px 미만에서만 가로로 스크롤한다. 스크롤 영역은 세로로도 잘라 내 맨 윗줄 툴팁이 가려지므로,
    // 대상 너비(데스크톱 1024~1440, tokens.md)에서는 스크롤을 끈다. 열 너비: 연도 3rem(디자인의 연도 열) + 12달 같은 너비
    <div ref={listenEscape} className="max-lg:overflow-x-auto" onMouseLeave={() => setHoverMonth(null)}>
      <div
        role="group"
        aria-label={t.gridLabel}
        onPointerDown={() => {
          pointerDown.current = true;
        }}
        // 눌렀는데 포커스가 생기지 않은 경우(연도 글자, 이미 포커스된 칸, 버튼에 포커스를 주지 않는 Safari)에도
        // 표시를 지워 다음 키보드 포커스에서 툴팁이 뜨게 한다. click은 focus 뒤에 오므로 순서가 맞다
        onClick={() => {
          pointerDown.current = false;
        }}
        onPointerCancel={() => {
          pointerDown.current = false;
        }}
        onFocus={() => {
          setKeyboardFocus(!pointerDown.current);
          pointerDown.current = false;
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false);
        }}
        className="grid min-w-3xl grid-cols-[3rem_repeat(12,minmax(0,1fr))] gap-x-1 gap-y-1"
      >
        <span className="text-xs text-muted">{t.yearHead}</span>
        {Array.from({ length: 12 }, (_, i) => (
          <span key={`head-${i + 1}`} className="text-center font-mono text-xs text-muted">
            {t.monthHead(i + 1)}
          </span>
        ))}
        {rows.map((row, rowIndex) => {
          const divider = dividerAfter(row.year, visibleYears);
          return (
            <Fragment key={row.year}>
              <span className="self-center font-mono text-xs text-muted">{row.year}</span>
              {row.cells.map((cell, col) => {
                const { label, tooltip } = text(cell);
                const active = cell.month === activeMonth;
                return (
                  <div key={cell.month} className="relative" onKeyDown={(event) => move(event, rowIndex, col)}>
                    <HeatmapCell
                      cell={cell}
                      label={label}
                      tooltipId={active ? tooltipId : undefined}
                      focusable={cell.month === focusMonth}
                      onActivate={() => onSelect(cell.month)}
                      onFocusCell={() => {
                        setTooltipHidden(false);
                        setFocusMonth(cell.month);
                      }}
                      onHover={(hovering) => {
                        setTooltipHidden(false);
                        setHoverMonth(hovering ? cell.month : null);
                      }}
                      buttonRef={(node) => {
                        if (node === null) refs.current.delete(cell.month);
                        else refs.current.set(cell.month, node);
                      }}
                    />
                    {active && <HeatmapTooltip id={tooltipId} lines={tooltip} align={alignFor(col)} />}
                  </div>
                );
              })}
              {divider !== null && (
                <p className="col-span-full flex items-center gap-3 py-1 text-xs font-medium text-ink">
                  <span aria-hidden="true" className="h-px w-8 bg-ink" />
                  {t.divider[divider]}
                </p>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
