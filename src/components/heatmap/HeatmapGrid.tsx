import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import { useMessages } from "../../i18n";
import { dividerAfter, type HeatRow } from "../../lib/heatmap";
import { HeatmapCell } from "./HeatmapCell";
import { HeatmapTooltip, type TooltipAlign } from "./HeatmapTooltip";
import { useCellText, type BandFor } from "./useCellText";

/*
 * 12달 × 해 격자. 시안 v9 달력(2026-11-15 사용자): **해는 가로(왼쪽이 오래된 해), 1~12월은 세로**.
 * 26년을 세로로 쌓으면 900px 가까이 늘어져 한눈에 안 들어와서 바꿨다. 같은 달을 해마다 비교하기(한 줄 읽기)도 쉬워진다.
 * 센서 전환은 해 사이의 세로 점선(시안 `.db-viirs-start`)과 격자 아래 설명 줄.
 * 키보드: 격자에는 Tab 한 번으로 들어가고(로빙 tabindex) 방향키로 칸을 옮긴다(←→ 해, ↑↓ 달). Enter로 그 달, Esc로 툴팁 닫기.
 * 툴팁은 마우스를 올린 칸, 또는 키보드 포커스가 있는 칸에 뜬다(마우스로 눌러 생긴 포커스에는 띄우지 않는다).
 * 툴팁 상태는 여기 둔다(구역 전체가 다시 그려지지 않게).
 */
type HeatmapGridProps = {
  rows: HeatRow[];
  regionLabel: string;
  bandFor: BandFor;
  onSelect: (month: string) => void;
};

/** 가장자리 열(해)은 툴팁을 안쪽으로 붙여 카드 밖으로 나가지 않게 한다. 26열이면 열이 좁아(약 33~45px) 양끝 3열씩 */
function alignFor(col: number, count: number): TooltipAlign {
  if (col <= 2) return "start";
  if (col >= count - 3) return "end";
  return "center";
}

/** [해 칸 이동, 달 줄 이동] */
const DELTA: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
const MONTHS = Array.from({ length: 12 }, (_, i) => i);

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
  // 받은 줄은 최근 해가 위(`buildGrid`). 가로 배치는 왼쪽이 오래된 해
  const years = [...rows].reverse();
  const dividers = years.flatMap((r) => {
    const key = dividerAfter(r.year, visibleYears);
    return key === null ? [] : [{ year: r.year, key }];
  });

  // 마우스로 띄운 툴팁도 Esc로 닫는다(WCAG 1.4.13). `useEffect` 대신 ref 콜백으로 문서에 붙였다 뗀다
  const listenEscape = useCallback((node: HTMLDivElement | null) => {
    if (node === null) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setTooltipHidden(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  /** 센서 전환 해의 칸 왼쪽(앞 해와의 사이)에 세로 점선 */
  const edge = (year: number) => (dividerAfter(year, visibleYears) !== null ? "border-l border-dashed border-white/30" : "");

  const move = (event: KeyboardEvent, yearIndex: number, monthIndex: number) => {
    const step = DELTA[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const target = years[yearIndex + step[0]]?.cells[monthIndex + step[1]];
    if (target === undefined) return;
    setTooltipHidden(false);
    setFocusMonth(target.month);
    refs.current.get(target.month)?.focus();
  };

  return (
    // 1024px 미만에서만 가로로 스크롤한다. 스크롤 영역은 세로로도 잘라 내 맨 윗줄 툴팁이 가려지므로,
    // 대상 너비(데스크톱 1024~1440, tokens.md)에서는 스크롤을 끈다. 열 너비: 달 이름 2.5rem + 해마다 같은 너비
    <div ref={listenEscape} className="flex flex-col gap-3 max-lg:overflow-x-auto" onMouseLeave={() => setHoverMonth(null)}>
      <div
        role="group"
        aria-label={t.gridLabel}
        onPointerDown={() => {
          pointerDown.current = true;
        }}
        // 눌렀는데 포커스가 생기지 않은 경우(해 글자, 이미 포커스된 칸, 버튼에 포커스를 주지 않는 Safari)에도
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
        // 칸마다 32px 누를 자리 안에 16px 점(시안 `.db-calendar-cell`). 줄·칸 사이 간격은 따로 두지 않는다
        className="grid min-w-3xl gap-0"
        style={{ gridTemplateColumns: `2.5rem repeat(${years.length}, minmax(0, 1fr))` }}
      >
        <span aria-hidden="true" />
        {years.map((row) => (
          <span key={`head-${row.year}`} className={`pb-1 text-center font-mono text-[0.625rem] text-muted ${edge(row.year)}`}>
            {row.year}
          </span>
        ))}
        {MONTHS.map((monthIndex) => (
          // 한 줄 = 한 달(1~12월). `display: contents`라 격자 칸 배치는 그대로
          <div key={`month-${monthIndex + 1}`} className="contents">
            <span className="self-center font-mono text-xs text-muted">{t.monthHead(monthIndex + 1)}</span>
            {years.map((row, yearIndex) => {
              const cell = row.cells[monthIndex];
              if (cell === undefined) return null;
              const { label, tooltip } = text(cell);
              const active = cell.month === activeMonth;
              return (
                <div key={cell.month} className={`relative ${edge(row.year)}`} onKeyDown={(event) => move(event, yearIndex, monthIndex)}>
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
                  {active && <HeatmapTooltip id={tooltipId} lines={tooltip} align={alignFor(yearIndex, years.length)} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {/* 센서 전환 설명: 격자의 세로 점선과 같은 모양 표시 + 글 */}
      {dividers.length > 0 && (
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {dividers.map((d) => (
            <li key={d.key} className="flex items-center gap-2 text-xs font-medium text-ink">
              <span aria-hidden="true" className="h-3 border-l border-dashed border-white/40" />
              {t.divider[d.key]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
