import { useState } from "react";
import { useLocale, useMessages } from "../../i18n";
import { formatMonth, formatMonthName } from "../../lib/format";
import { clampMonth, isInRange, makeMonth, monthYear, type MonthRange } from "../../lib/month";
import { Dialog } from "../Dialog";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

/*
 * 기준 월 선택 (`decisions.md` 7-1, 디자인은 달 하나뿐이라 모양을 정함): 위에 "‹ 연도 ›", 아래에 12달 격자.
 * 자료 범위 밖 달은 비활성, 고른 달은 선택 색.
 */
type MonthDialogProps = {
  open: boolean;
  onClose: () => void;
  range: MonthRange;
  selected: string;
  onPick: (month: string) => void;
};

export function MonthDialog({ open, onClose, range, selected, onPick }: MonthDialogProps) {
  const t = useMessages().dashboard.dialogs;
  const locale = useLocale();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t.monthTitle}
      description={t.monthDescription(formatMonth(range.first, locale), formatMonth(range.last, locale))}
    >
      {/* 열 때마다 고른 달의 해에서 시작하도록 대화상자 안쪽에 상태를 둔다 */}
      <MonthGrid range={range} selected={selected} onPick={onPick} />
    </Dialog>
  );
}

const ARROW =
  "flex size-10 items-center justify-center rounded-control text-ink hover:bg-page " +
  "focus-visible:outline-2 focus-visible:outline-selection disabled:cursor-not-allowed disabled:text-border disabled:hover:bg-transparent";

function MonthGrid({ range, selected, onPick }: Omit<MonthDialogProps, "open" | "onClose">) {
  const t = useMessages().dashboard.dialogs;
  const locale = useLocale();
  // 고른 달이 범위 밖이면 범위 안의 가까운 해에서 시작한다(설계안 9절)
  const [year, setYear] = useState(monthYear(clampMonth(selected, range)));
  const firstYear = monthYear(range.first);
  const lastYear = monthYear(range.last);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button type="button" aria-label={t.previousYear} disabled={year <= firstYear} onClick={() => setYear(year - 1)} className={ARROW}>
          <ChevronLeftIcon />
        </button>
        <p className="font-mono text-base font-medium text-ink" aria-live="polite">
          {t.year(year)}
        </p>
        <button type="button" aria-label={t.nextYear} disabled={year >= lastYear} onClick={() => setYear(year + 1)} className={ARROW}>
          <ChevronRightIcon />
        </button>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {Array.from({ length: 12 }, (_, i) => makeMonth(year, i + 1)).map((month, i) => {
          const inRange = isInRange(month, range);
          const isSelected = month === selected;
          return (
            <li key={month}>
              <button
                type="button"
                aria-pressed={isSelected}
                disabled={!inRange}
                onClick={() => onPick(month)}
                className={
                  "h-10 w-full rounded-control text-sm font-medium focus-visible:outline-2 focus-visible:outline-selection " +
                  "disabled:cursor-not-allowed disabled:text-border " +
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
