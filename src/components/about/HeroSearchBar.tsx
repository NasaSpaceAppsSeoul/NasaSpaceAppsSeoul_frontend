import { SearchIcon } from "../icons";

/*
 * 첫 화면 히어로의 검색 줄 (`plans/about-revise.md` 0·11절: Make "Explore dashboard" 자리).
 * 줄 전체가 버튼 하나다. 누르면 지역 검색 대화상자가 열리고 거기서 입력한다(2장과 같은 방식).
 * 오른쪽 밝은 칸(Make의 밝은 버튼 + 주황 마름모)은 같은 버튼의 일부인 장식이다. 예전 "지역 둘러보기"는 검색에 합쳤다(11절).
 * 2장 `SearchField`를 쓰지 않는 이유: 자료를 받기 전에 막을 `disabled`가 없다.
 * 마름모 장식은 공용 `Button`에 변형을 더하지 않고 여기서만 그린다(9-6).
 */
type HeroSearchBarProps = {
  placeholder: string;
  /** 오른쪽 밝은 칸 글자(예: "지역 찾기") */
  actionLabel: string;
  disabled: boolean;
  onOpen: () => void;
};

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

export function HeroSearchBar({ placeholder, actionLabel, disabled, onOpen }: HeroSearchBarProps) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      // 읽는 이름에 화면에 보이는 두 글자를 모두 넣는다(음성 입력으로 "지역 찾기"라고 불러도 눌리게, WCAG 2.5.3)
      aria-label={`${actionLabel}, ${placeholder}`}
      disabled={disabled}
      onClick={onOpen}
      className={
        "group flex h-14 w-full items-center gap-2 rounded-control border border-border bg-surface p-1 pl-4 text-left " +
        "transition-colors hover:border-muted disabled:cursor-not-allowed " +
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-selection"
      }
    >
      <SearchIcon className="size-4 shrink-0 text-muted" />
      <span className="min-w-0 flex-1 truncate text-base text-muted group-hover:text-ink">{placeholder}</span>
      <span
        aria-hidden="true"
        className={
          "flex h-full shrink-0 items-center gap-4 rounded-control-sm bg-inverse pr-1 pl-4 text-sm font-medium " +
          "whitespace-nowrap text-surface transition-colors group-hover:bg-inverse-hover group-disabled:opacity-50"
        }
      >
        {actionLabel}
        <ButtonObject />
      </span>
    </button>
  );
}
