import type { ReactNode } from "react";

/** 카드: 흰 바탕, 모서리 24, 안쪽 24. 높이는 내용에 맞춘다(tokens.md 배치 원칙). */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  // 시안 v9 유리 카드: 40% 어두운 반투명 + 흐림(`glass`) + 흰 선 하나
  return <section className={`glass rounded-card border border-line p-6 ${className}`.trim()}>{children}</section>;
}

/** 카드 머리 (components/sheet/03-nav-b): 제목 + 기준 기간·단위 한 줄. */
export function CardHeader({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <header className="mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold text-ink">{title}</h2>
        {sub !== undefined && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </header>
  );
}
