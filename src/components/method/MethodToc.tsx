import { Link } from "react-router-dom";

/*
 * 기법 페이지 왼쪽 목차 (시안 `.toc`): 세로선 위의 번호 + 절 이름, 지금 보는 절은 주황 선과 번호.
 * 누르면 주소 해시를 그 절로 바꾸고(뒤로 가기 기록을 쌓지 않게 `replace`), 라우터 스크롤 복원이 그 절로 옮긴다
 * (`plans/method-page.md` 8-2). 부드러운 이동은 페이지가 켜 둔 `scroll-behavior`가 맡는다(움직임 줄이기면 바로).
 * 머리글이 고정되지 않아 화면 위에서 조금 띄워 붙는다. 맨 위에는 머리에서 넘어오는 돌아가기 링크 자리가 있다.
 * 글자 크기·자간·폭의 임의 값(`text-[0.8125rem]` 등)은 시안 `method_page.html` CSS의 px 값을 rem으로 옮긴 것이다(토큰에 같은 크기가 없음).
 */
export type TocItem = { id: string; index: string; label: string };

/** 목차 위 돌아가기 링크. `shown`은 머리의 같은 링크가 화면 위로 나갔을 때만 참 */
export type TocBack = { href: string; label: string; shown: boolean };

type MethodTocProps = { label: string; items: readonly TocItem[]; active: string | null; back?: TocBack };

export function MethodToc({ label, items, active, back }: MethodTocProps) {
  return (
    <nav aria-label={label} className="sticky top-8 self-start">
      {/*
       * 머리의 "← 소개로 돌아가기"가 스크롤에 밀려 화면 위로 나가면 같은 링크가 위에서 내려와 여기 붙는다(iOS 표 머리글처럼,
       * 2026-11-15 사용자 B안). 링크는 한 번에 하나만 보인다. 자리는 늘 비워 두어 목차가 밀리지 않게 하고,
       * 숨어 있는 동안은 `inert`로 초점·클릭·읽기에서 뺀다. 움직임 줄이기면 바로 바뀐다
       */}
      {back !== undefined && (
        <Link
          to={back.href}
          inert={!back.shown}
          className={
            "mb-5 block text-[0.9375rem] text-muted transition duration-300 ease-out hover:text-ink motion-reduce:transition-none " +
            "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-selection " +
            (back.shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0")
          }
        >
          {back.label}
        </Link>
      )}
      <ol className="border-l border-line">
        {items.map((item) => {
          const on = item.id === active;
          return (
            <li key={item.id}>
              <Link
                to={{ hash: `#${item.id}` }}
                replace
                aria-current={on ? "location" : undefined}
                className={
                  "-ml-px flex gap-3 border-l py-1.75 pl-4.5 text-[0.90625rem] transition-colors duration-200 " +
                  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-selection " +
                  (on ? "border-fire text-ink" : "border-transparent text-muted hover:text-ink")
                }
              >
                <span className={`font-mono text-xs leading-[1.9] ${on ? "text-fire" : "text-muted"}`}>{item.index}</span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
