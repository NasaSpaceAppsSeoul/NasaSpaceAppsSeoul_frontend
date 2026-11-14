import type { ReactNode } from "react";

/*
 * 기법 페이지의 그림 판 (시안 `figure`): 제목, 설명 한 줄, (있으면) 오른쪽 나라 탭, 그림, (있으면) 읽는 법 한 줄, Mono 출처 줄.
 * 판은 유리 재료. 그림 자체의 읽는 이름은 안쪽 그림(`role="img"`)이 단다.
 * 공용 `Card`는 `<section>`이라 쓰지 않는다: 그림·설명·출처를 한 덩어리로 읽히게 `<figure>`·`<figcaption>`이 필요하다.
 * 글자 크기·자간·폭의 임의 값(`text-[0.8125rem]` 등)은 시안 `method_page.html` CSS의 px 값을 rem으로 옮긴 것이다(토큰에 같은 크기가 없음).
 */
type MethodFigureProps = {
  title: string;
  sub: string;
  caption: string;
  /** 제목 오른쪽(나라 탭) */
  action?: ReactNode;
  /** 그림 아래 읽는 법 한 줄 */
  note?: string;
  children: ReactNode;
};

export function MethodFigure({ title, sub, caption, action, note, children }: MethodFigureProps) {
  return (
    <figure data-reveal className="glass my-7 rounded-card border border-line px-6 pt-6 pb-4.5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[1.0625rem] font-medium text-ink">{title}</p>
          <p className="mt-1 text-sm text-muted">{sub}</p>
        </div>
        {action}
      </div>
      {children}
      {note !== undefined && <p className="mt-3 text-sm text-subtle">{note}</p>}
      <figcaption className="mt-3 font-mono text-xs text-muted [&:lang(en)]:tracking-[0.02em]">{caption}</figcaption>
    </figure>
  );
}
