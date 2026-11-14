import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(cleanup);

// jsdom에는 WebGL이 없다. 지도 래퍼는 가짜 지도로 확인한다(`fakeMaplibre.ts`)
vi.mock("maplibre-gl", async () => ({ Map: (await import("./fakeMaplibre")).FakeMap, setWorkerUrl: () => undefined }));

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
