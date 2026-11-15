import { localeFromPath } from "../lib/locale";

/** 문서 전체의 언어(`<html lang>`)를 주소의 언어에 맞춘다. 번역 제안과 스크린리더가 이 값을 본다. */
export function applyDocumentLang(pathname: string): void {
  document.documentElement.lang = localeFromPath(pathname);
}

type LocationState = { location: { pathname: string } };
type RouterLike = {
  state: LocationState;
  subscribe: (listener: (state: LocationState) => void) => unknown;
};

/** 지금 주소의 언어를 바로 넣고, 주소가 바뀔 때마다 다시 맞춘다. */
export function followDocumentLang(router: RouterLike): void {
  applyDocumentLang(router.state.location.pathname);
  router.subscribe((state) => applyDocumentLang(state.location.pathname));
}
