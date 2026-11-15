import { useId } from "react";
import { ChevronDownIcon, SearchIcon } from "../icons";

/*
 * 선택 상자와 검색 칸. 둘 다 누르면 대화상자를 여는 버튼이다.
 * 모양은 시안 v9 선택 줄(`.db-select`): 칸마다 Mono 대문자 이름표, 네 칸 모두 밑줄형(검색 칸은 돋보기로 구별).
 * 이름표는 모든 단계에서 보인다.
 */

/** 시안 `.db-filter-label`: Mono 9px 대문자 이름표 */
const TAG = "mono-tag text-muted";

// Tailwind v4는 `outline-none` 없이도 `focus-visible:outline-solid`를 함께 줘야 테두리가 그려진다(next.md 확인한 사실)
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-selection";

type FieldProps = {
  /** 칸 이름표("시·도", "기준 월") */
  label: string;
  value: string;
  disabled?: boolean;
  onOpen: () => void;
};

/** 밑줄형 선택 상자. 읽히는 이름은 "이름표 + 값"(`aria-labelledby`). */
export function SelectBox({ label, value, disabled = false, onOpen }: FieldProps) {
  const labelId = useId();
  const valueId = useId();
  return (
    // 비활성 칸은 값 글자와 함께 밑줄도 흐리게(시안에 비활성 모양이 없어 글자색만으로는 구별이 약하다)
    <div className="flex min-w-0 flex-col justify-center gap-1 border-b border-field-line py-2 has-disabled:border-border">
      <span id={labelId} className={TAG}>
        {label}
      </span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-labelledby={`${labelId} ${valueId}`}
        disabled={disabled}
        onClick={onOpen}
        className={
          "flex min-h-6 w-full min-w-0 items-center gap-2 text-left text-base text-ink transition-colors hover:text-selection " +
          "disabled:cursor-not-allowed disabled:text-muted disabled:hover:text-muted " +
          FOCUS
        }
      >
        <span id={valueId} className="min-w-0 flex-1 truncate">
          {value}
        </span>
        <ChevronDownIcon className="size-3 shrink-0 text-muted" />
      </button>
    </div>
  );
}

/**
 * 검색 칸 모양의 버튼(유리 상자). 누르면 검색 대화상자가 열리고 거기서 입력한다.
 * `value`는 지금 보고 있는 곳("경북 의성군"), `hint`는 화면 읽기에만 들리는 앞 글("지역 검색, 지금:").
 * 이름표는 눈으로만 보이고, 읽히는 이름은 "안내 + 값"이다(이름표 "지역"과 겹치지 않게).
 */
export function SearchField({ label, value, hint, onOpen }: Omit<FieldProps, "disabled"> & { hint: string }) {
  // 시안은 검색 칸만 상자(`.db-region-filter`)지만, 우리 선택 줄은 네 칸 모두 "누르면 대화상자"라 같은 밑줄형으로 맞췄다.
  // 검색이라는 표시는 돋보기 하나로 한다(2026-11-15 사용자 확인 요청, 권장안)
  return (
    <div className="flex min-w-0 flex-col justify-center gap-1 border-b border-field-line py-2">
      <span className={TAG}>{label}</span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`${hint} ${value}`}
        onClick={onOpen}
        className={"flex min-h-6 w-full min-w-0 items-center gap-2 text-left text-base text-ink transition-colors hover:text-selection " + FOCUS}
      >
        <SearchIcon className="size-4 shrink-0 text-muted" />
        <span className="min-w-0 flex-1 truncate">{value}</span>
        <ChevronDownIcon className="size-3 shrink-0 text-muted" />
      </button>
    </div>
  );
}
