/*
 * 스크롤 등장 효과를 건너뛰고 바로 보일지 (`plans/cosmic-redesign.md` 8-1, 시안 v9 `useScrollReveal`).
 * 움직임 줄이기 설정이거나, 화면 관찰자(IntersectionObserver)가 없거나, 인쇄 중이면 숨기지 않는다.
 * 키보드 초점이 들어온 묶음은 따로 바로 보인다(훅이 처리).
 */
export type RevealEnvironment = { reducedMotion: boolean; hasObserver: boolean; print: boolean };

export function revealImmediately({ reducedMotion, hasObserver, print }: RevealEnvironment): boolean {
  return reducedMotion || !hasObserver || print;
}
