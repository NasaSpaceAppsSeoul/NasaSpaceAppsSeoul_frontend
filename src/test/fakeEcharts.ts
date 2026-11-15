/*
 * 테스트용 가짜 `echarts/core`(`setup.ts`가 바꿔 끼운다). jsdom에는 캔버스가 없어 진짜 차트는 경고만 쏟아 내고
 * 무엇을 그렸는지 확인할 수 없다. 래퍼가 부르는 것만 흉내 내고 받은 옵션을 기록한다.
 * 테스트는 `fakeCharts`로 만든 차트를 찾고 `lastOption`을 본다.
 */
export const fakeCharts: FakeChart[] = [];

export class FakeChart {
  options: unknown[] = [];
  disposed = false;
  resizes = 0;
  constructor(public el: HTMLElement) {
    fakeCharts.push(this);
  }
  setOption(option: unknown) {
    this.options.push(option);
  }
  get lastOption(): unknown {
    return this.options.at(-1);
  }
  resize() {
    this.resizes += 1;
  }
  dispose() {
    this.disposed = true;
  }
}

export function use(): void {}

export function init(el: HTMLElement): FakeChart {
  return new FakeChart(el);
}
