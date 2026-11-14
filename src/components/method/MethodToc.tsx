import { Link } from "react-router-dom";

/*
 * 기법 페이지 왼쪽 목차 (시안 `.toc`): 세로선 위의 번호 + 절 이름, 지금 보는 절은 주황 선과 번호.
 * 누르면 주소 해시를 그 절로 바꾸고(뒤로 가기 기록을 쌓지 않게 `replace`), 라우터 스크롤 복원이 그 절로 옮긴다
 * (`plans/method-page.md` 8-2). 부드러운 이동은 페이지가 켜 둔 `scroll-behavior`가 맡는다(움직임 줄이기면 바로).
 * 머리글이 고정되지 않아 화면 위에서 조금 띄워 붙는다.
 */
export type TocItem = { id: string; index: string; label: string };

type MethodTocProps = { label: string; items: readonly TocItem[]; active: string | null };

export function MethodToc({ label, items, active }: MethodTocProps) {
  return (
    <nav aria-label={label} className="sticky top-8 self-start">
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
