import { SearchIcon } from "../icons";
import { ButtonObject } from "./ButtonObject";

/*
 * 첫 화면 히어로의 검색 줄 (`plans/about-revise.md` 0·11절: Make "Explore dashboard" 자리).
 * 줄 전체가 버튼 하나다. 누르면 지역 검색 대화상자가 열리고 거기서 입력한다(2장과 같은 방식).
 * 오른쪽 밝은 칸(Make의 밝은 버튼 + 주황 마름모)은 같은 버튼의 일부인 장식이다. 예전 "지역 둘러보기"는 검색에 합쳤다(11절).
 * 2장 `SearchField`를 쓰지 않는 이유: 자료를 받기 전에 막을 `disabled`가 없다.
 * 마름모 장식은 `ButtonObject`(03 "대시보드 보기" 버튼과 같이 씀). 공용 `Button`에 변형을 더하지 않는다(9-6).
 */
type HeroSearchBarProps = {
  placeholder: string;
  /** 오른쪽 밝은 칸 글자(예: "지역 찾기") */
  actionLabel: string;
  disabled: boolean;
  onOpen: () => void;
};

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
        // 유리 표면 + 머리글 세그먼트와 같은 테두리(우주 배경이 은은하게 비치게, 2026-11-14 사용자)
        "glass group flex h-14 w-full items-center gap-2 rounded-control border border-segment-line p-1 pl-4 text-left " +
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
