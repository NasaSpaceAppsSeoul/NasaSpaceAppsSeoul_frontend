import { routeTheme } from "../lib/route";

/**
 * 문서 전체의 테마(`<html data-theme>`)를 주소에 맞춘다(`plans/about-revise.md` 9-1).
 * `<html>`에 붙이는 이유: `body` 바탕, 차트·지도가 읽는 색(`document.documentElement`), 대화상자가 모두 따라오게 하려고.
 * 밝은 기본 화면에서는 속성을 지운다.
 */
export function applyDocumentTheme(pathname: string): void {
  const theme = routeTheme(pathname);
  const root = document.documentElement;
  if (theme === undefined) delete root.dataset.theme;
  else root.dataset.theme = theme;
}

type LocationState = { location: { pathname: string } };
type RouterLike = {
  state: LocationState;
  subscribe: (listener: (state: LocationState) => void) => unknown;
};

/** 지금 주소의 테마를 바로 넣고, 주소가 바뀔 때마다 다시 맞춘다(`followDocumentLang`과 같은 방식). */
export function followDocumentTheme(router: RouterLike): void {
  applyDocumentTheme(router.state.location.pathname);
  router.subscribe((state) => applyDocumentTheme(state.location.pathname));
}
