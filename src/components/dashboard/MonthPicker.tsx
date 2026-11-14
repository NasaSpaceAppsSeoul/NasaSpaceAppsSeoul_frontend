import { useCallback, useId, useRef, useState, type KeyboardEvent } from "react";
import { useLocale, useMessages } from "../../i18n";
import { formatMonth, formatMonthName } from "../../lib/format";
import { clampMonth, isInRange, makeMonth, monthYear, shiftMonth, type MonthRange } from "../../lib/month";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

/*
 * 기준 월 칸 (2026-11-15 사용자): 선택 줄의 다른 칸과 같은 밑줄형 칸 안에 "‹ 2025년 3월 ›".
 * 양옆 버튼은 한 달씩, 가운데 글자를 누르면 칸 바로 아래에 연도·12달 격자가 펼쳐진다(대화상자 아님, 화면을 가리지 않게).
 * 격자는 달을 고르거나, 옆 버튼·바깥을 누르거나, Esc를 누르면 닫힌다. 자료 범위 밖 달은 비활성(`decisions.md` 7-1).
 * `useEffect` 대신 펼친 판의 ref 콜백이 바깥 누름 감지를 붙이고 뗀다(대화상자 `openModal`과 같은 방식).
 */

const TAG = "mono-tag text-muted";
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-selection";
const STEP =
  "flex size-6 shrink-0 items-center justify-center rounded-control-sm text-muted transition-colors hover:bg-row-hover hover:text-ink " +
  "disabled:cursor-not-allowed disabled:text-muted/40 disabled:hover:bg-transparent " +
  FOCUS;

type MonthFieldProps = {
  label: string;
  month: string;
  range: MonthRange;
  onPick: (month: string) => void;
};

export function MonthField({ label, month, range, onPick }: MonthFieldProps) {
  const t = useMessages();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const panelId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // 주소의 달이 범위 밖이어도 한 번에 범위 안으로 돌아오게 맞춘다(설계안 9절).
  // 펼친 채 옆 버튼을 누르면 판을 닫는다(판 안 연도가 바뀐 달과 어긋나지 않게)
  const go = (step: number) => {
    setOpen(false);
    onPick(clampMonth(shiftMonth(month, step), range));
  };
  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) toggle.current?.focus();
  };

  /**
   * 펼친 판이 붙을 때: 고른 달(없으면 격자의 첫 활성 칸)에 초점, 바깥 누름이면 닫기. 판이 떨어질 때 감지를 뗀다.
   * 렌더마다 새 함수면 React가 떼었다 다시 붙여 초점을 다시 가져가므로 한 번만 만든다
   */
  const attachPanel = useCallback((node: HTMLDivElement) => {
    const target =
      node.querySelector<HTMLElement>('ul [aria-pressed="true"]:not(:disabled)') ?? node.querySelector<HTMLElement>("ul button:not(:disabled)");
    target?.focus();
    const onDown = (event: PointerEvent) => {
      if (wrapper.current !== null && event.target instanceof Node && !wrapper.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const onKeyDown = (event: KeyboardEvent) => {
    if (open && event.key === "Escape") {
      event.stopPropagation();
      close(true);
    }
  };

  return (
    <div ref={wrapper} onKeyDown={onKeyDown} className="relative flex min-w-0 flex-col justify-center gap-1 border-b border-field-line py-2">
      <span id={labelId} className={TAG}>
        {label}
      </span>
      <div className="flex min-h-6 items-center gap-2">
        <button type="button" aria-label={t.dashboard.stepper.previous} disabled={month <= range.first} onClick={() => go(-1)} className={STEP}>
          <ChevronLeftIcon className="size-3.5" />
        </button>
        <button
          ref={toggle}
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-labelledby={`${labelId} ${panelId}-value`}
          onClick={() => setOpen(!open)}
          className={`min-w-0 flex-1 truncate text-center text-base text-ink transition-colors hover:text-selection ${FOCUS}`}
        >
          <span id={`${panelId}-value`}>{formatMonth(month, locale)}</span>
        </button>
        <button type="button" aria-label={t.dashboard.stepper.next} disabled={month >= range.last} onClick={() => go(1)} className={STEP}>
          <ChevronRightIcon className="size-3.5" />
        </button>
      </div>
      {open && (
        // 대화상자와 같은 유리 재료. 칸 오른쪽 끝에 맞춰 펼친다(선택 줄의 마지막 칸이라 화면 밖으로 나가지 않게)
        <div
          ref={attachPanel}
          id={panelId}
          role="group"
          aria-label={t.dashboard.dialogs.monthTitle}
          className="absolute top-full right-0 z-30 mt-2 w-72 rounded-panel border border-line bg-dialog p-4 shadow-[0_24px_80px_#0006] backdrop-blur-[24px]"
        >
          <MonthGrid
            range={range}
            selected={month}
            onPick={(next) => {
              close(true);
              onPick(next);
            }}
          />
        </div>
      )}
    </div>
  );
}

const ARROW =
  "flex size-8 items-center justify-center rounded-control text-ink hover:bg-row-hover " +
  "disabled:cursor-not-allowed disabled:text-muted/40 disabled:hover:bg-transparent " +
  FOCUS;

/** 위에 "‹ 연도 ›", 아래에 12달 격자. 열 때마다 고른 달의 해에서 시작한다(펼칠 때마다 새로 그려진다) */
function MonthGrid({ range, selected, onPick }: { range: MonthRange; selected: string; onPick: (month: string) => void }) {
  const t = useMessages().dashboard.dialogs;
  const locale = useLocale();
  // 고른 달이 범위 밖이면 범위 안의 가까운 해에서 시작한다(설계안 9절)
  const [year, setYear] = useState(monthYear(clampMonth(selected, range)));
  const firstYear = monthYear(range.first);
  const lastYear = monthYear(range.last);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button type="button" aria-label={t.previousYear} disabled={year <= firstYear} onClick={() => setYear(year - 1)} className={ARROW}>
          <ChevronLeftIcon />
        </button>
        <p className="font-mono text-sm font-medium text-ink" aria-live="polite">
          {t.year(year)}
        </p>
        <button type="button" aria-label={t.nextYear} disabled={year >= lastYear} onClick={() => setYear(year + 1)} className={ARROW}>
          <ChevronRightIcon />
        </button>
      </div>
      <ul className="grid grid-cols-4 gap-1">
        {Array.from({ length: 12 }, (_, i) => makeMonth(year, i + 1)).map((month, i) => {
          const isSelected = month === selected;
          return (
            <li key={month}>
              <button
                type="button"
                aria-pressed={isSelected}
                disabled={!isInRange(month, range)}
                onClick={() => onPick(month)}
                className={
                  "h-9 w-full rounded-control text-sm font-medium disabled:cursor-not-allowed disabled:text-muted/40 " +
                  FOCUS +
                  " " +
                  (isSelected ? "bg-row-selected text-ink" : "text-ink hover:bg-row-hover")
                }
              >
                {formatMonthName(i + 1, locale)}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
