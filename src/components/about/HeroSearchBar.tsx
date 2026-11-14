import { SearchIcon } from "../icons";
import { Button } from "../Button";

/*
 * 소개 머리의 검색 줄 (screens/kr/about.png). 흰 칸 안 오른쪽에 파란 "지역 둘러보기" 버튼이 들어 있다.
 * 2장 `SearchField`를 쓰지 않는 이유: 칸 안에 다른 버튼을 품을 수 없고, 자료를 받기 전에 막을 `disabled`가 없다.
 * 검색 칸은 칸 모양의 버튼이다. 누르면 검색 대화상자가 열리고 거기서 입력한다(2장과 같은 방식).
 */
type HeroSearchBarProps = {
  placeholder: string;
  browseLabel: string;
  disabled: boolean;
  onSearch: () => void;
  onBrowse: () => void;
};

export function HeroSearchBar({ placeholder, browseLabel, disabled, onSearch, onBrowse }: HeroSearchBarProps) {
  return (
    <div className="flex h-14 items-center gap-2 rounded-control bg-surface p-1 pl-1">
      <button
        type="button"
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={onSearch}
        className={
          "flex h-full min-w-0 flex-1 items-center gap-2 rounded-control-sm px-3 text-left text-base text-muted " +
          "focus-visible:outline-2 focus-visible:outline-selection disabled:cursor-not-allowed"
        }
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{placeholder}</span>
      </button>
      <Button variant="blue" aria-haspopup="dialog" disabled={disabled} onClick={onBrowse} className="h-full">
        {browseLabel}
      </Button>
    </div>
  );
}
