import type { ReactNode } from "react";

/*
 * 월간 인사이트의 절 한 개(2026-11-15 디자이너 요청: 카드로 나눈 구역이 너무 많아 난잡하다 → 기법 페이지처럼 선으로 나눈 번호 절).
 * 모양은 기법 페이지 `MethodSection`과 같다(위 가는 선, 주황 Mono 번호, 제목, 한 줄 요지). "첫 절은 위 선을 뺀다"는
 * CSS `first:` 대신 `first`로 직접 정한다(감싸는 칸 구조와 상관없이 맨 위 절만 선이 없게). 제목·요지 크기는 대시보드 카드와 비슷하게
 * 기법 페이지보다 한 단계 작다(인사이트는 그림이 주인공이라 머리가 그림을 누르지 않게).
 * 예전 구역 머리의 작은 이름(eyebrow)이 절 제목, 질문 제목이 요지, 예전 설명(lead)은 요지 아래 흐린 본문(`note`)이다.
 * 참고안 테마(2026-11-15 디자이너): 그림 자리(`InsightPanel`)·표(`InsightTable framed`)·글 모두 판 없이 선과 글자색으로만 나눈다.
 */
type InsightSectionProps = {
  id: string;
  index: string;
  title: string;
  lead: string;
  note?: ReactNode;
  /** 맨 위 절이면 위 선을 뺀다 */
  first?: boolean;
  children: ReactNode;
};

export function InsightSection({ id, index, title, lead, note, first = false, children }: InsightSectionProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      data-toc-section={id}
      aria-labelledby={titleId}
      // 절 사이 선은 참고안 큰 구분 흰 14%(`--in-rule`, 2026-11-15 디자이너)
      className={`min-w-0 scroll-mt-8 pb-14 break-keep ${first ? "" : "border-t border-white/14 pt-7"}`.trim()}
    >
      <div data-reveal>
        <p className="font-mono text-[0.8125rem] font-medium text-fire [&:lang(en)]:tracking-[0.12em]">{index}</p>
        <h2 id={titleId} className="mt-2 mb-2.5 text-[1.75rem] leading-tight font-medium tracking-tight text-ink">
          {title}
        </h2>
        <p className="mb-6 max-w-[40em] text-lg leading-normal text-[#ecece8]">{lead}</p>
      </div>
      <div className="flex flex-col gap-6">
        {note !== undefined && note !== null && <div className="-mt-3 text-base text-[#a9b2bf]">{note}</div>}
        {children}
      </div>
    </section>
  );
}

/**
 * 그림 자리: 달력·막대·지도·계절 그림을 묶는 칸. 참고안처럼 판(유리 바탕·테두리·안쪽 여백) 없이 배경 위에 둔다(2026-11-15 디자이너).
 * 이름은 예전 그대로(부르는 곳·배치를 바꾸지 않으려고).
 */
export function InsightPanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div data-reveal className={`flex flex-col gap-6 ${className}`.trim()}>
      {children}
    </div>
  );
}

/**
 * 그림 + 글 두 칸(04 계절·05 지도, 2026-11-15 사용자): 왼쪽 그림 판(3), 오른쪽 설명 글(2). 그림이 오른쪽 칸 전체 폭을
 * 차지하면 다른 절 그림보다 너무 커서, 글을 옆에 두어 그림 크기를 02 절 그림과 비슷하게 맞춘다.
 */
export function InsightFigureRow({ figure, aside }: { figure: ReactNode; aside: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start gap-8">
      {figure}
      {/* 글 칸: 참고안 본문 글색 #c3cad4(`.in-note`), 14px */}
      <div data-reveal data-reveal-delay="1" className="flex min-w-0 flex-col gap-4 text-sm text-[#c3cad4]">
        {aside}
      </div>
    </div>
  );
}
