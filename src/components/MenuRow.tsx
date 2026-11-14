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
};

export function MenuRow({ title, sub, selected = false, disabled = false, disabledHint, onSelect }: MenuRowProps) {
  const background = selected ? "bg-row-selected" : disabled ? "bg-surface" : "bg-surface hover:bg-row-hover";
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      title={disabled ? disabledHint : undefined}
      onClick={onSelect}
      className={
        "flex w-full flex-col items-start gap-0.5 rounded-control px-3 py-3 text-left " +
        "focus-visible:outline-2 focus-visible:outline-selection disabled:cursor-not-allowed " +
        background
      }
    >
      <span className={`text-sm font-medium ${disabled ? "text-muted" : "text-ink"}`}>{title}</span>
      {sub !== undefined && <span className="text-xs text-muted">{sub}</span>}
    </button>
  );
}
