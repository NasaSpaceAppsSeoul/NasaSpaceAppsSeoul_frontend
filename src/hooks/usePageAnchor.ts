import { createContext, useContext } from "react";

/*
 * 화면이 지금 보고 있는 절(해시로 쓸 이름)을 머리글의 언어 전환 링크에 알린다.
 * 기법 페이지에서 목차를 누르지 않고 스크롤만 한 뒤 언어를 바꿔도 같은 위치로 가게 한다
 * (`plans/method-page.md` 9절 ⑤). 주소 해시를 스크롤마다 바꾸면 라우터가 그 절 맨 위로 다시 끌어당기므로
 * 해시는 그대로 두고 이 값만 올린다. 값은 `app/RootLayout`이 들고, 화면은 이 함수로 바꾸기만 한다.
 *
 * - 절 이름(문자열): 그 절로 간다
 * - `null`: 절을 추적하는 화면인데 지금은 어느 절도 아니다(머리를 보는 중) → 해시 없이 맨 위
 * - `undefined`: 절을 추적하지 않는 화면 → 주소의 해시를 그대로 쓴다
 */
export type PageAnchor = string | null | undefined;

export const PageAnchorContext = createContext<(anchor: PageAnchor) => void>(() => undefined);

export function useSetPageAnchor(): (anchor: PageAnchor) => void {
  return useContext(PageAnchorContext);
}

/** 언어 전환 링크에 붙일 위치. 화면이 알린 값이 없으면 주소의 해시 */
export function anchorHash(anchor: PageAnchor, hash: string): string {
  if (anchor === undefined) return hash;
  return anchor === null ? "" : `#${anchor}`;
}
