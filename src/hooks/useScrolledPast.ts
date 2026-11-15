import { useCallback, useState } from "react";

/*
 * 붙인 요소가 스크롤에 밀려 화면 위로 완전히 나갔는지(화면 아래에 아직 안 온 것과 구분).
 * 기법 페이지 머리의 "← 소개로 돌아가기"가 화면 위로 사라지면, 같은 링크를 목차 위 고정 자리에 내려오게 하는 데 쓴다
 * (iOS 표 머리글처럼 밀려 올라간 것이 위에 붙는 모양, 2026-11-15 사용자 B안).
 * `useEffect` 대신 ref 콜백으로 붙였다 뗀다. 관찰자가 없으면(오래된 환경·테스트) 늘 `false`.
 * react-router `Link`에는 달지 않는다: `Link`가 ref를 감싸면서 정리 함수를 버리고 렌더마다 새 ref를 만들어 관찰자가 쌓인다.
 * 링크를 감싼 일반 요소에 단다.
 */
export function useScrolledPast() {
  const [past, setPast] = useState(false);
  // 이름을 `ref`로 두면 React 린트가 ref 값으로 보고 렌더 중 접근으로 막는다. 붙일 요소에 넘기는 콜백이다
  const watch = useCallback((node: HTMLElement | null) => {
    if (node === null || typeof IntersectionObserver === "undefined") return undefined;
    // 콜백이 늦게 불리면 같은 대상의 항목이 여러 개 온다. 가장 최근 상태(마지막 항목)를 쓴다
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.at(-1);
      if (entry === undefined) return;
      setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      setPast(false);
    };
  }, []);
  return { watch, past };
}
