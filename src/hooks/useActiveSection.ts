import { useCallback, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSetPageAnchor } from "./usePageAnchor";

/*
 * 기법 페이지 목차의 "지금 보는 절" (`plans/method-page.md` 1절·8-2).
 * 감싸는 칸 안의 `[data-toc-section]` 절 가운데 화면 위 40%~아래 55% 띠에 들어온 절을 켠다(시안 `rootMargin`).
 * 마지막 절은 짧아 그 띠에 들지 않을 수 있어, 페이지 끝에 닿으면 마지막 절을 켠다.
 * 첫 절이 띠의 아래 끝(화면 위 45%)보다 아래에 있으면(머리를 보는 중) 어느 절도 켜지 않는다.
 * 켜진 절은 머리글 언어 전환에도 알린다(`usePageAnchor`, 9절 ⑤). 주소 해시는 목차를 누를 때만 바뀐다.
 *
 * 붙인 칸에 `data-smooth-scroll`도 단다(`styles/index.css`가 문서 스크롤을 부드럽게 한다). 붙는 그 순간이 아니라
 * 다음 프레임에 단다: 페이지로 들어오는 이동(뒤로 가기의 위치 복원, 첫 화면에서 넘어올 때 맨 위로)은 바로 옮기고,
 * 그 뒤의 목차 이동과 언어 전환만 부드럽게.
 * `useEffect` 대신 ref 콜백으로 붙였다 뗀다(about-revise 9-3). `ids`는 바뀌지 않는 배열을 넘긴다.
 */
/** 이 문서에서 첫 기록의 해시를 이미 썼는지(문서를 새로 읽으면 다시 false) */
let entryHashTaken = false;

function takeEntryHash(key: string, hash: string): string {
  if (entryHashTaken || key !== "default") {
    entryHashTaken = true;
    return "";
  }
  entryHashTaken = true;
  return hash;
}

/** 테스트용: 문서를 새로 읽은 것처럼 첫 기록 해시를 다시 쓸 수 있게 한다 */
export function resetEntryHashForTest(): void {
  entryHashTaken = false;
}

export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string | null>(null);
  const setAnchor = useSetPageAnchor();
  // 문서에 처음 들어온 기록(라우터가 이름을 "default"로 붙인다: 새 탭·공유 링크·주소창 입력·새로고침)일 때 한 번만 해시 절로 옮긴다.
  // 뒤로·앞으로 가기는 라우터가 보던 위치를 복원하므로 덮어쓰지 않는다. 첫 기록으로 뒤로 돌아와도 이름이 같은 "default"라
  // 문서 하나에 한 번만 쓰도록 표시해 둔다. 붙을 때 한 번만 읽는다
  const location = useLocation();
  const [entryHash] = useState(() => takeEntryHash(location.key, location.hash));

  // 이름을 `ref`로 두면 React 린트가 ref 값으로 보고 렌더 중 접근으로 막는다. 붙일 칸에 넘기는 콜백이다
  const track = useCallback(
    (root: HTMLElement | null) => {
      if (root === null) return undefined;
      const pick = (id: string | null) => {
        setActive(id);
        setAnchor(id);
      };
      const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-toc-section]"));
      const first = sections[0];
      const last = sections.at(-1);

      const observer =
        typeof IntersectionObserver === "undefined"
          ? null
          : new IntersectionObserver(
              (entries) => {
                for (const entry of entries) {
                  if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
                  const id = entry.target.dataset.tocSection;
                  if (id !== undefined && ids.includes(id)) pick(id);
                }
              },
              { rootMargin: "-40% 0px -55% 0px" },
            );
      for (const section of sections) observer?.observe(section);

      const onScroll = () => {
        const doc = document.documentElement;
        if (last !== undefined && window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
          pick(last.dataset.tocSection ?? null);
        } else if (first !== undefined && first.getBoundingClientRect().top > window.innerHeight * 0.45) {
          pick(null);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });

      // 주소에 해시를 달고 문서에 처음 들어오면 그 절로 옮긴다. 이때 라우터 스크롤 복원은 해시보다 저장된 위치
      // (첫 기록 이름 "default"에 남은 예전 방문의 0)를 먼저 써서 맨 위로 되돌린다. 같은 커밋에서 라우터 복원
      // (부모의 layout effect)이 이 콜백보다 늦게 돌므로 다음 프레임에 옮긴다.
      // 부드러운 스크롤은 그다음에 켠다(들어올 때의 이동은 바로)
      const target = sections.find((section) => `#${section.id}` === entryHash);
      const frame = requestAnimationFrame(() => {
        target?.scrollIntoView();
        root.dataset.smoothScroll = "";
      });

      return () => {
        cancelAnimationFrame(frame);
        delete root.dataset.smoothScroll;
        observer?.disconnect();
        window.removeEventListener("scroll", onScroll);
        // 이 화면을 떠나면 언어 전환 링크는 다시 주소의 해시를 쓴다
        setAnchor(undefined);
      };
    },
    [ids, setAnchor, entryHash],
  );

  return { track, active };
}
