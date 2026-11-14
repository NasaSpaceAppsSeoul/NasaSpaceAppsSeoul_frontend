import { useId, type ReactNode } from "react";
import { ChevronDownIcon, SearchIcon } from "../icons";

/*
 * 선택 상자와 검색 칸 (components/sheet/02-controls-a). 둘 다 누르면 대화상자를 여는 버튼이다.
 * 나라 화면은 라벨이 칸 위에(`label`), 시·도·시·군·구 화면은 칸 안 앞에(`prefix`, "시·도 · 경북") 붙는다.
 */

const FIELD =
  "flex h-12 w-full min-w-0 items-center gap-2 rounded-control border border-border bg-surface px-3 text-left text-base text-ink " +
  "hover:border-muted focus-visible:border-selection focus-visible:outline-1 focus-visible:outline-selection " +
  "disabled:cursor-not-allowed disabled:border-page disabled:bg-page disabled:text-muted";

type FieldProps = {
  /** 칸 위의 라벨(나라 화면) */
  label?: string;
  /** 칸 안 값 앞의 단계 이름(시·도·시·군·구 화면) */
  prefix?: string;
  value: string;
  disabled?: boolean;
  onOpen: () => void;
};

/** 라벨은 칸 위에 보이는 글자다. 버튼의 읽히는 이름은 "라벨 + 값"이 되게 `aria-labelledby`로 잇는다. */
function Labelled({ label, labelId, children }: { label?: string; labelId: string; children: ReactNode }) {
  if (label === undefined) return <>{children}</>;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span id={labelId} className="text-sm text-ink">
        {label}
      </span>
      {children}
    </div>
  );
}

export function SelectBox({ label, prefix, value, disabled = false, onOpen }: FieldProps) {
  const labelId = useId();
  const valueId = useId();
  return (
    <Labelled label={label} labelId={labelId}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-labelledby={label !== undefined ? `${labelId} ${valueId}` : undefined}
        disabled={disabled}
        onClick={onOpen}
        className={FIELD}
      >
        <span id={valueId} className="min-w-0 flex-1 truncate">
          {prefix !== undefined && <span>{prefix} · </span>}
          {value}
        </span>
        <ChevronDownIcon className="size-4 shrink-0 text-muted" />
      </button>
    </Labelled>
  );
}

/**
 * 검색 칸 모양의 버튼. 누르면 검색 대화상자가 열리고 거기서 입력한다.
 * `value`는 지금 보고 있는 곳("경북 의성군"), `hint`는 화면 읽기에만 들리는 앞 글("지역 검색, 지금:").
 */
export function SearchField({ label, value, hint, onOpen }: Omit<FieldProps, "prefix" | "disabled"> & { hint?: string }) {
  const labelId = useId();
  const valueId = useId();
  return (
    <Labelled label={label} labelId={labelId}>
      <button
        type="button"
        aria-haspopup="dialog"
        // 안내(hint)가 있으면 "안내 + 값"을 이름으로(이름표 "지역"과 겹치지 않게). 없으면 "이름표 + 값"
        aria-label={hint !== undefined ? `${hint} ${value}` : undefined}
        aria-labelledby={hint === undefined && label !== undefined ? `${labelId} ${valueId}` : undefined}
        onClick={onOpen}
        className={FIELD}
      >
        <SearchIcon className="size-4 shrink-0 text-muted" />
        <span id={valueId} className="min-w-0 flex-1 truncate">
          {value}
        </span>
      </button>
    </Labelled>
  );
}
