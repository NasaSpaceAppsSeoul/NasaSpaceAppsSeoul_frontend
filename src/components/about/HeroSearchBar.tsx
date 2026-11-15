import { SearchIcon } from "../icons";

/*
 * 첫 화면 히어로의 검색 줄 (참고 소스 `burnline-landing 4` `.hero-search`, UI 다듬기 2026-11-15 사용자).
 * 알약 모양 버튼 하나다. 누르면 지역 검색 대화상자가 열리고 거기서 입력한다.
 * 예전 오른쪽 밝은 칸("지역 찾기" + 마름모)은 뺐다. 대시보드로 가는 길은 아래 "대시보드 보기" 버튼이 따로 맡는다.
 * 2장 `SearchField`를 쓰지 않는 이유: 자료를 받기 전에 막을 `disabled`가 없다.
 */
type HeroSearchBarProps = {
  /** 줄 안에 보이는 글자(예: "지역 찾기: 의성군, 캘리포니아, 아티카…") */
  prompt: string;
  /** 읽는 이름. 보이는 글자의 앞부분("지역 찾기")을 포함해 음성 입력으로도 눌리게 한다(WCAG 2.5.3) */
  label: string;
  disabled: boolean;
  onOpen: () => void;
};

export function HeroSearchBar({ prompt, label, disabled, onOpen }: HeroSearchBarProps) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={label}
      disabled={disabled}
      onClick={onOpen}
      className={
        // 참고 값: 최대 435, 높이 52, 좌우 18, 흰 16% 테두리, 둥근 끝, 바탕 rgba(10,11,14,.55), 15px #a9abb1. 호버는 테두리·바탕·글자가 밝아진다
        "group flex h-13 w-full max-w-[435px] cursor-text items-center gap-3 rounded-full border border-white/16 " +
        "bg-[rgba(10,11,14,0.55)] px-4.5 text-left text-[15px] text-[#a9abb1] transition-colors duration-180 " +
        // 막힌 동안(자료 받는 중·실패)은 밝아지지 않는다. 초점 고리는 다른 링크와 같은 `selection`
        "enabled:hover:border-white/32 enabled:hover:bg-[rgba(16,18,22,0.7)] enabled:hover:text-[#d6d8dc] disabled:cursor-not-allowed disabled:opacity-60 " +
        "focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-selection motion-reduce:transition-none"
      }
    >
      <SearchIcon className="size-4.5 shrink-0" />
      <span className="min-w-0 truncate">{prompt}</span>
    </button>
  );
}
