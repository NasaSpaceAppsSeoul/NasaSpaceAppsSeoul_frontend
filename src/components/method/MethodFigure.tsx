import type { ReactNode } from "react";

/*
 * 기법 페이지의 그림 판 (시안 `figure`): 제목, 설명 한 줄, 그림, Mono 출처 줄. 판은 유리 재료.
 * 그림 자체의 읽는 이름은 안쪽 그림(`role="img"`)이 단다.
 * 공용 `Card`는 `<section>`이라 쓰지 않는다: 그림·설명·출처를 한 덩어리로 읽히게 `<figure>`·`<figcaption>`이 필요하다.
 */
type MethodFigureProps = { title: string; sub: string; caption: string; children: ReactNode };

export function MethodFigure({ title, sub, caption, children }: MethodFigureProps) {
  return (
    <figure data-reveal className="glass my-7 rounded-card border border-line px-6 pt-6 pb-4.5">
      <p className="text-[1.0625rem] font-medium text-ink">{title}</p>
      <p className="mt-1 mb-4 text-sm text-muted">{sub}</p>
      {children}
      <figcaption className="mt-3 font-mono text-xs text-muted [&:lang(en)]:tracking-[0.02em]">{caption}</figcaption>
    </figure>
  );
}
