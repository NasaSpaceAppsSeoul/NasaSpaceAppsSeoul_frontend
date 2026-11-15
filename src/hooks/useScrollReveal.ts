import { useCallback } from "react";
import { revealImmediately } from "../lib/reveal";

/*
 * 스크롤 등장 효과 (시안 v9 `useScrollReveal.ts`의 동작, `plans/cosmic-redesign.md` 8-1).
 * 감싸는 칸 안의 `[data-reveal]` 묶음을 처음엔 28px 아래·투명(`pending`)으로 두고, 화면에 12% 들어오면 `visible`로 바꾼다(한 번만).
 * 모양은 `styles/index.css`의 `[data-reveal-state]` 규칙. 배치는 바꾸지 않는다.
 * 움직임 줄이기·관찰자 없음·인쇄면 아무것도 숨기지 않는다. 보는 중에 움직임 줄이기를 켜면 모두 바로 보인다.
 * 키보드 초점이 들어온 묶음은 그 자리에서 바로 보인다(Tab으로 숨은 곳에 들어가지 않게).
 * `useEffect`·`useLayoutEffect` 대신 ref 콜백으로 붙였다 뗀다(about-revise 9-3). 처음 그릴 때 붙으므로 깜빡임이 없다.
 * 나중에 생기는 묶음(자료를 받은 뒤 그려지는 대시보드·인사이트 카드)도 `MutationObserver`로 찾아 같은 방식으로 붙인다.
 */
export function useScrollReveal() {
  return useCallback((root: HTMLElement) => {
    const media = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const print = typeof window.matchMedia === "function" && window.matchMedia("print").matches;
    if (
      revealImmediately({
        reducedMotion: media?.matches === true,
        hasObserver: typeof IntersectionObserver !== "undefined",
        print,
      })
    ) {
      return () => undefined;
    }

    const groups = new Set<HTMLElement>();
    const show = (group: HTMLElement, instant: boolean) => {
      if (instant) group.dataset.revealInstant = "true";
      group.dataset.revealState = "visible";
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || !(entry.target instanceof HTMLElement)) continue;
          show(entry.target, false);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    /** 처음 보는 묶음만 숨김으로 두고 관찰한다 */
    const track = (group: HTMLElement) => {
      if (groups.has(group)) return;
      groups.add(group);
      group.dataset.revealState = "pending";
      observer.observe(group);
    };
    const scan = (node: Element) => {
      if (node instanceof HTMLElement && node.matches("[data-reveal]")) track(node);
      for (const group of node.querySelectorAll<HTMLElement>("[data-reveal]")) track(group);
    };
    scan(root);
    // 자료를 받은 뒤 새로 그려진 묶음
    const mutations = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) if (node instanceof Element) scan(node);
    });
    mutations.observe(root, { childList: true, subtree: true });

    const onMotionChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      for (const group of groups) show(group, true);
      observer.disconnect();
      mutations.disconnect();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const group = event.target.closest<HTMLElement>("[data-reveal]");
      if (group === null || !root.contains(group)) return;
      show(group, true);
      observer.unobserve(group);
    };
    media?.addEventListener("change", onMotionChange);
    root.addEventListener("focusin", onFocusIn);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      media?.removeEventListener("change", onMotionChange);
      root.removeEventListener("focusin", onFocusIn);
      for (const group of groups) {
        delete group.dataset.revealState;
        delete group.dataset.revealInstant;
      }
    };
  }, []);
}
