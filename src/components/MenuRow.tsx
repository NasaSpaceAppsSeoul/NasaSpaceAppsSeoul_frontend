import type { ReactNode } from "react";

/*
 * 메뉴 줄 (components/sheet/02-controls-b): 대화상자 안 목록의 한 줄.
 * 제목 + 보조 한 줄. 기본·호버(회색)·선택(연파랑)·비활성(글자만 흐림).
 */
type MenuRowProps = {
  title: ReactNode;
  sub?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  /** 비활성 이유(예: "준비 중"). `title` 속성으로 보인다(`decisions.md` 1-9) */
  disabledHint?: string;
  onSelect: () => void;
  /** 검색 칸에서 ↑↓로 강조한 줄(참고 소스 `.ps-option.is-active`: 흰 7% 바탕 + 왼쪽 파란 2px, UI 다듬기 2026-11-15) */
  active?: boolean;
  id?: string;
};

export function MenuRow({ title, sub, selected = false, disabled = false, disabledHint, onSelect, active = false, id }: MenuRowProps) {
  const background = selected
    ? "bg-row-selected"
    : disabled
      ? "bg-transparent"
      : active
        ? "bg-white/[0.07]"
        : "bg-transparent hover:bg-row-hover";
  return (
    <button
      type="button"
      id={id}
      aria-pressed={selected}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      onClick={onSelect}
      className={
        "flex w-full flex-col items-start gap-0.5 rounded-control px-3 py-3 text-left " +
        "focus-visible:outline-2 focus-visible:outline-selection disabled:cursor-not-allowed " +
        background +
        (active ? " shadow-[inset_2px_0_0_#4c9eff]" : "")
      }
    >
      <span className={`text-sm font-medium ${disabled ? "text-muted" : "text-ink"}`}>{title}</span>
      {sub !== undefined && (
        <span className="text-xs text-muted">
          {/* 읽을 때 제목과 보조 줄이 한 단어로 붙지 않게 쉼표로 끊는다(화면에는 안 보임) */}
          <span className="sr-only">, </span>
          {sub}
        </span>
      )}
    </button>
  );
}
