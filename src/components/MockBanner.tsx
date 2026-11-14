import { useMessages } from "../i18n";

/**
 * 목 모드 표시 줄 (`decisions.md` 10-9). 목 모드일 때만 머리글 아래에 그린다.
 * 모양은 디자인의 머리글 아래 연파랑 안내 띠를 따른다.
 */
export function MockBanner() {
  const t = useMessages();
  return (
    <p role="note" className="rounded-control bg-row-selected px-3 py-2 text-xs text-action">
      {t.mockBanner}
    </p>
  );
}
