import { useMessages } from "../i18n";

/**
 * 로딩 자리 표시 (`decisions.md` 1-1): 그 구역 크기의 회색 판. 화면 전체 로딩은 쓰지 않는다.
 * 크기는 픽셀 숫자 대신 Tailwind 클래스로 받는다(예: `h-64`, `aspect-video`).
 */
export function Skeleton({ className = "h-32" }: { className?: string }) {
  const t = useMessages();
  return (
    <div role="status" aria-busy="true" className={`animate-pulse rounded-card bg-border/60 ${className}`.trim()}>
      <span className="sr-only">{t.common.loading}</span>
    </div>
  );
}
