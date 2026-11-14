import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

// jsdom에는 WebGL이 없다. 지도 래퍼는 가짜 지도로 확인한다(`fakeMaplibre.ts`)
vi.mock("maplibre-gl", async () => ({ Map: (await import("./fakeMaplibre")).FakeMap, setWorkerUrl: () => undefined }));

// jsdom에는 캔버스가 없다. 차트 래퍼는 가짜 차트로 받은 옵션을 확인한다(`fakeEcharts.ts`)
vi.mock("echarts/core", async () => await import("./fakeEcharts"));

// jsdom에는 WebGL이 없다. 첫 화면 지구(`EarthPanel`이 lazy로 부르는 모듈)는 이름표만 있는 가짜로 바꾼다
vi.mock("../components/about/EarthScene", async () => {
  const { createElement } = await import("react");
  return { EarthScene: () => createElement("figure", { "data-testid": "earth-scene" }) };
});

// jsdom에는 Tailwind CSS가 없다. 닫혀 있는 도움말 판(`InfoTip`, `invisible`)은 브라우저처럼 접근성 트리에서 빠지도록
// 그 한 줄만 넣는다(히트맵 상태 칩 툴팁이 늘 DOM에 있어 칸 툴팁 조회와 겹쳤다)
const tailwindSubset = document.createElement("style");
tailwindSubset.textContent = ".invisible { visibility: hidden; }";
document.head.appendChild(tailwindSubset);

// jsdom은 `window.scrollTo`를 구현하지 않고 경고만 남긴다. 라우터 스크롤 복원(`ScrollRestoration`)이 부른다
window.scrollTo = () => undefined;
// jsdom 요소에는 `scrollIntoView`가 없다. 첫 화면 "스크롤해서 읽기"가 부른다
if (typeof Element.prototype.scrollIntoView !== "function") Element.prototype.scrollIntoView = () => undefined;

/*
 * jsdom 29의 `<dialog>`에는 `open` 속성만 있고 `showModal()`·`close()`가 없다.
 * 브라우저와 같은 결과(열림 표시, 닫힐 때 `close` 이벤트)만 흉내 낸다. Esc는 테스트가 `cancel` 이벤트를 직접 보낸다.
 * 브라우저처럼 `close` 이벤트는 바로 보내지 않고 나중에(다음 작업으로) 보낸다. 테스트는 이를 기다려야 한다.
 */
if (typeof HTMLDialogElement.prototype.showModal !== "function") {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    if (this.open) throw new DOMException("already open", "InvalidStateError");
    this.open = true;
  };
}
if (typeof HTMLDialogElement.prototype.close !== "function") {
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return;
    this.open = false;
    setTimeout(() => this.dispatchEvent(new Event("close")), 0);
  };
}
