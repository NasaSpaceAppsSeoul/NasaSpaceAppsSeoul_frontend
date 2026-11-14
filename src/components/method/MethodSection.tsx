import type { ReactNode } from "react";

/*
 * 기법 페이지의 절 한 개 (시안 `main section`): 위 구분선, 주황 Mono 번호, 제목, 한 줄 요지, 본문.
 * `id`는 두 언어가 같이 쓰는 해시 이름(`plans/method-page.md` 8-2)이고, `data-toc-section`은 목차가 지금 보는 절을 찾는 표시.
 * 머리글이 고정되지 않아 해시로 올 때 화면 위에서 조금만 띄운다(`scroll-mt`).
 * 첫 화면 `NumberedHeading`(번호 줄 + 48~64px 제목, 머리만)·옛 `SectionHeading`(파란 작은 제목)과 크기·색·구조가 달라
 * 따로 둔다: 여기는 38px 제목 + 한 줄 요지에 절 전체(구분선·해시·목차 표시)를 함께 그린다.
 */
type MethodSectionProps = { id: string; index: string; title: string; lead: string; children: ReactNode };

export function MethodSection({ id, index, title, lead, children }: MethodSectionProps) {
  const titleId = `${id}-title`;
  return (
    <section
      id={id}
      data-toc-section={id}
      aria-labelledby={titleId}
      className="scroll-mt-8 border-t border-line pt-7 pb-16 break-keep first:border-t-0 first:pt-0"
    >
      <div data-reveal>
        <p className="font-mono text-[0.8125rem] font-medium text-fire [&:lang(en)]:tracking-[0.12em]">{index}</p>
        <h2 id={titleId} className="mt-2.5 mb-3.5 text-[2.375rem] leading-tight font-medium tracking-tight text-ink">
          {title}
        </h2>
        <p className="mb-7 max-w-[36em] text-xl leading-normal text-ink">{lead}</p>
      </div>
      {children}
    </section>
  );
}

/** 절 안의 작은 제목 (시안 `h3`: Mono 대문자, 흐린 색). 자간은 영문만(한글은 Mono 글꼴이 없어 벌어진다) */
export function MethodSubheading({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-9 mb-3.5 font-mono text-[0.8125rem] font-medium text-muted uppercase [&:lang(en)]:tracking-[0.12em]">
      {children}
    </h3>
  );
}
