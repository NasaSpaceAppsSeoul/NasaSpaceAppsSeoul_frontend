import { useMessages } from "../../i18n";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";

/*
 * 달 이동 (components/sheet/02-controls-b "‹ Month Latest · 2026-07 ›"). 끝 달이면 그쪽 화살표가 흐리고 눌리지 않는다.
 * 이동 주소는 화면이 만들어 넘긴다(컴포넌트는 주소를 모른다).
 */
type MonthStepperProps = {
  month: string;
  isLatest: boolean;
  onPrevious: (() => void) | null;
  onNext: (() => void) | null;
};

const ARROW =
  "flex size-8 items-center justify-center rounded-control-sm text-ink hover:bg-page " +
  "focus-visible:outline-2 focus-visible:outline-selection disabled:cursor-not-allowed disabled:text-border disabled:hover:bg-transparent";

export function MonthStepper({ month, isLatest, onPrevious, onNext }: MonthStepperProps) {
  const t = useMessages().dashboard.stepper;
  return (
    <div className="flex items-center gap-2 rounded-control border border-border bg-surface px-2 py-1">
      <button type="button" aria-label={t.previous} disabled={onPrevious === null} onClick={onPrevious ?? undefined} className={ARROW}>
        <ChevronLeftIcon />
      </button>
      <span className="text-sm font-medium whitespace-nowrap text-ink">
        {t.label} · {isLatest && `${t.latest} `}
        <span className="font-mono">{month}</span>
      </span>
      <button type="button" aria-label={t.next} disabled={onNext === null} onClick={onNext ?? undefined} className={ARROW}>
        <ChevronRightIcon />
      </button>
    </div>
  );
}
