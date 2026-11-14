import { SearchIcon } from "../icons";

/*
 * 첫 화면 히어로의 검색 줄 (`plans/about-revise.md` 0절: Make "Explore dashboard" 자리).
 * 어두운 칸 안 오른쪽에 밝은 "지역 둘러보기" 버튼(Make의 밝은 버튼 + 주황 마름모)이 들어 있다.
 * 2장 `SearchField`를 쓰지 않는 이유: 칸 안에 다른 버튼을 품을 수 없고, 자료를 받기 전에 막을 `disabled`가 없다.
 * 검색 칸은 칸 모양의 버튼이다. 누르면 검색 대화상자가 열리고 거기서 입력한다(2장과 같은 방식).
 * 마름모 장식은 공용 `Button`에 변형을 더하지 않고 여기서만 그린다(9-6).
 */
type HeroSearchBarProps = {
  placeholder: string;
  browseLabel: string;
  disabled: boolean;
  onSearch: () => void;
  onBrowse: () => void;
};

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-selection";

/**
 * Make `.button-object`: 남색→주황 비스듬한 판 위에 기울어진 테두리 사각형. 호버하면 돈다.
 * 색은 장식 그림 값(장면 색 예외, 10절 ⑦)이라 토큰이 아니다.
 */
function ButtonObject() {
  return (
    <span
      aria-hidden="true"
      className={
        "grid size-10 shrink-0 rotate-6 place-items-center rounded-control-sm border border-white/70 " +
        "bg-[linear-gradient(145deg,rgba(255,255,255,0.7),transparent_35%),linear-gradient(145deg,#123756,#f1682d)] " +
        "shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.45),inset_5px_5px_8px_rgba(255,255,255,0.22)] " +
        "transition-transform duration-400 group-hover:rotate-95 group-hover:scale-90 motion-reduce:transition-none"
      }
    >
      <span className="size-4.5 rotate-35 rounded-cell border border-white/70" />
    </span>
  );
}

export function HeroSearchBar({ placeholder, browseLabel, disabled, onSearch, onBrowse }: HeroSearchBarProps) {
  return (
    <div className="flex h-14 items-center gap-2 rounded-control border border-border bg-surface p-1">
      <button
        type="button"
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={onSearch}
        className={
          "flex h-full min-w-0 flex-1 items-center gap-2 rounded-control-sm px-3 text-left text-base text-muted " +
          `hover:text-ink disabled:cursor-not-allowed ${FOCUS}`
        }
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{placeholder}</span>
      </button>
      <button
        type="button"
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={onBrowse}
        className={
          "group flex h-full shrink-0 items-center gap-4 rounded-control-sm bg-inverse pr-1 pl-4 text-sm font-medium " +
          `whitespace-nowrap text-surface transition-colors hover:bg-inverse-hover disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS}`
        }
      >
        {browseLabel}
        <ButtonObject />
      </button>
    </div>
  );
}
