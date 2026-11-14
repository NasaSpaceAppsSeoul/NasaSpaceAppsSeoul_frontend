/*
 * 테스트용 가짜 `maplibre-gl`. jsdom에는 WebGL이 없어 진짜 지도를 만들 수 없다(`setup.ts`가 바꿔 끼운다).
 * 래퍼가 부르는 메서드만 흉내 내고 호출을 기록한다. `load`는 다음 작업에서 보낸다.
 * 테스트는 `fakeMaps`로 만든 지도를 찾고 `emit`으로 마우스 이벤트를 보낸다. 올림·누름에서 돌려줄 구역은 `hits`에 넣는다.
 */
type Handler = (event: unknown) => void;
type Hit = { layer: string; properties: Record<string, unknown> };

export const fakeMaps: FakeMap[] = [];

export class FakeMap {
  handlers = new Map<string, Handler[]>();
  sources = new Map<string, { data: unknown; setData: (data: unknown) => void }>();
  featureStates = new Map<string, unknown>();
  filters = new Map<string, unknown>();
  hits: Hit[] = [];
  fitCalls: unknown[] = [];
  removed = false;
  zoom = 5;
  minZoom = 0;
  maxZoom = 22;
  touchZoomRotate = { disableRotation: () => undefined };
  private container: HTMLElement;
  /** 만들 때 받은 설정(확대·끌기를 껐는지 확인용) */
  options: Record<string, unknown>;

  constructor(options: { container: HTMLElement } & Record<string, unknown>) {
    this.container = options.container;
    this.options = options;
    fakeMaps.push(this);
    setTimeout(() => this.emit("load", {}), 0);
  }

  on(type: string, handler: Handler) {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler]);
    return this;
  }
  emit(type: string, event: unknown) {
    for (const handler of this.handlers.get(type) ?? []) handler(event);
  }
  remove() {
    this.removed = true;
  }
  paint = new Map<string, unknown>();
  setPaintProperty(layer: string, name: string, value: unknown) {
    this.paint.set(`${layer}.${name}`, value);
  }
  addImage() {}
  addLayer() {}
  addSource(id: string) {
    const source = { data: null as unknown, setData: (data: unknown) => (source.data = data) };
    this.sources.set(id, source);
  }
  getSource(id: string) {
    return this.sources.get(id);
  }
  setFeatureState(target: { id: string }, state: unknown) {
    this.featureStates.set(target.id, state);
  }
  setFilter(layer: string, filter: unknown) {
    this.filters.set(layer, filter);
  }
  queryRenderedFeatures(_point: unknown, options: { layers: string[] }) {
    return this.hits.filter((h) => options.layers.includes(h.layer)).map((h) => ({ properties: h.properties }));
  }
  fitBounds(bounds: unknown) {
    this.fitCalls.push(bounds);
    this.zoom = 5;
  }
  getZoom() {
    return this.zoom;
  }
  setMinZoom(z: number | null) {
    this.minZoom = z ?? 0;
  }
  setMaxZoom(z: number | null) {
    this.maxZoom = z ?? 22;
  }
  getMaxZoom() {
    return this.maxZoom;
  }
  maxBounds: unknown = null;
  setMaxBounds(bounds: unknown) {
    this.maxBounds = bounds ?? null;
  }
  getBounds() {
    return this.fitCalls.at(-1) ?? null;
  }
  zoomIn() {
    this.zoom += 1;
    this.emit("zoomend", {});
  }
  zoomOut() {
    this.zoom -= 1;
    this.emit("zoomend", {});
  }
  canvas = document.createElement("canvas");
  getCanvas() {
    return this.canvas;
  }
  getMinZoom() {
    return this.minZoom;
  }
  getCenter() {
    return { lng: 0, lat: 0 };
  }
  jumpTo(options: { zoom: number }) {
    this.zoom = options.zoom;
  }
  getContainer() {
    return this.container;
  }
}
