import { useCallback, useState, type CSSProperties } from "react";
import { useMessages } from "../../i18n";

/*
 * 02 구역 월별 막대 (새 시안 v9 `MonthlyBarChart.tsx`, `.bar-chart` CSS 값). 표시만 한다: 값·선택은 구역이 넘긴다.
 * 회색 막대, 선택한 달은 주황 그라데이션, 축 눈금과 격자선, 막대 위 값, 아래 달 이름, 마우스·초점 때 밝은 툴팁.
 * 등장: 화면에 30% 들어오면 막대가 1.1s 동안 자란다(시차는 막대 수와 상관없이 0~0.3s). 움직임 줄이기·관찰자 없음이면
 * 바로 최종 상태이고, 보는 중에 움직임 줄이기를 켜도 바로 최종 상태가 된다.
 * `useEffect` 대신 ref 콜백으로 관찰자를 붙였다 뗀다(about-revise 9-3).
 * 색은 시안 막대 그림 값(장식 차트 상수, 이유 주석과 함께 임의 값): 막대 #5e6167·호버 #73767d·선택 #b64b1c→#f28a49와 빛,
 * 값 글자 #e1e1de·선택 #f49a63, 격자선 흰색 10%·바닥선 35%(시안 9%·34%를 Tailwind 단계로), 툴팁 바탕 #efefec·글자 #6f7177·
 * 강조 #111114·그림자.
 */
export type BarView = {
  key: string;
  /** 막대 아래 짧은 이름("3월"/"Mar") */
  short: string;
  /** 읽는 이름과 툴팁 제목("2026년 3월") */
  label: string;
  /** 서식이 맞춰진 값, 값이 없으면 `null` */
  valueText: string | null;
  value: number | null;
  /** 확정 전 표시 글자("집계 중"/"준실시간"). 있으면 점선 테두리 */
  pendingText: string | null;
};

type MonthlyBarsProps = {
  bars: readonly BarView[];
  ticks: readonly number[];
  formatTick: (value: number) => string;
  selected: number;
  onSelect: (index: number) => void;
  label: string;
};

/** 화면에 30% 들어오면 한 번 켠다. 움직임 줄이기·관찰자 없음(jsdom 등)이면 바로 켠다 */
function useEnterOnce() {
  const [entered, setEntered] = useState(false);
  // 언제나 정리 함수를 돌려준다(돌려주지 않으면 React 19가 떼어 낼 때 `null`로 다시 부른다)
  const ref = useCallback((node: HTMLDivElement) => {
    const media = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    if (media?.matches === true || typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return () => undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.intersectionRatio >= 0.3)) {
          setEntered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    // 보는 중에 움직임 줄이기를 켜면 바로 최종 상태(시안과 같음)
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      setEntered(true);
      observer.disconnect();
    };
    observer.observe(node);
    media?.addEventListener("change", onMotionChange);
    return () => {
      observer.disconnect();
      media?.removeEventListener("change", onMotionChange);
    };
  }, []);
  return { entered, ref };
}

export function MonthlyBars({ bars, ticks, formatTick, selected, onSelect, label }: MonthlyBarsProps) {
  const t = useMessages().about.context;
  const { entered, ref } = useEnterOnce();
  const top = ticks[ticks.length - 1] ?? 1;
  const position = (value: number) => `${(value / top) * 100}%`;
  // 막대 시차: 막대 수와 상관없이 마지막 막대가 0.3s 안에 시작(시안 0~0.3s, 막대 하나당 최대 50ms)
  const stagger = bars.length > 1 ? Math.min(50, 300 / (bars.length - 1)) : 0;

  return (
    // 세로축 칸 3rem: "10,000" 같은 다섯 자리 눈금까지 넘치지 않게(시안 40px)
    <div ref={ref} role="group" aria-label={label} className="mt-8 grid grid-cols-[3rem_minmax(0,1fr)] gap-4 pt-6 pb-10">
      {/* 세로축: 단위와 눈금(장식, 값은 막대 이름으로 읽힌다) */}
      <div aria-hidden="true" className="relative h-75">
        <span className="absolute -top-6.5 left-0 w-max font-mono text-xs text-muted">{t.axisUnit}</span>
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute right-0 translate-y-1/2 font-mono text-xs text-muted"
            style={{ bottom: position(tick) }}
          >
            {formatTick(tick)}
          </span>
        ))}
      </div>

      <div className="relative h-75">
        <div aria-hidden="true" className="absolute inset-0">
          {ticks.map((tick) => (
            <i
              key={tick}
              className={`absolute inset-x-0 h-px ${tick === 0 ? "bg-white/35" : "bg-white/10"}`}
              style={{ bottom: position(tick) }}
            />
          ))}
        </div>

        <div className="absolute inset-0 grid gap-3" style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(0, 1fr))` }}>
          {bars.map((bar, i) => {
            const isSelected = i === selected;
            const height = bar.value === null ? "0%" : position(bar.value);
            const edge = i === 0 ? "left-0" : i === bars.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2";
            return (
              <button
                key={bar.key}
                type="button"
                aria-pressed={isSelected}
                aria-label={
                  bar.valueText === null ? t.barNoValue(bar.label) : `${t.bar(bar.label, bar.valueText)}${bar.pendingText !== null ? `, ${bar.pendingText}` : ""}`
                }
                onClick={() => onSelect(i)}
                // 평소엔 테두리 없음, 키보드 초점에서만 흰색 70% 실선(Tailwind v4는 테두리 모양을 `outline-solid`로 따로 켜야 그려진다)
                className="group relative h-full cursor-pointer outline-hidden focus-visible:z-10 focus-visible:outline-1 focus-visible:outline-solid focus-visible:outline-offset-[5px] focus-visible:outline-white/70 hover:z-10"
                style={{ "--bar-height": height, "--bar-delay": `${Math.round(i * stagger)}ms` } as CSSProperties}
              >
                {/* 툴팁: 밝은 판(시안 .bar-tooltip), 맨 끝 막대는 안쪽으로 붙인다 */}
                <span
                  aria-hidden="true"
                  className={
                    `pointer-events-none invisible absolute bottom-[min(calc(var(--bar-height)+32px),calc(100%-80px))] z-20 flex w-max min-w-37 flex-col ${edge} ` +
                    "rounded-md bg-[#efefec] p-3 text-left font-mono text-xs/[18px] text-[#6f7177] opacity-0 shadow-[0_6px_18px_rgba(0,0,0,0.24)] " +
                    "transition-opacity duration-160 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
                  }
                >
                  {bar.label}
                  <strong className="font-medium text-[#111114]">
                    {bar.valueText === null ? t.noValue : `${bar.valueText} ${t.unit}`}
                  </strong>
                  <small>{bar.pendingText !== null ? `${t.basis} · ${bar.pendingText}` : t.basis}</small>
                </span>

                {bar.value !== null && (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-[calc(var(--bar-height)+8px)] left-1/2 -translate-x-1/2 font-mono text-sm leading-4 ${isSelected ? "text-[#f49a63]" : "text-[#e1e1de]"}`}
                  >
                    {bar.valueText}
                  </span>
                )}
                {bar.value === null && (
                  <span aria-hidden="true" className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-xs whitespace-nowrap text-muted">
                    {t.noValue}
                  </span>
                )}

                {/* 막대: 처음 보일 때 아래에서 자란다. 집계 중·준실시간은 점선 테두리 */}
                {bar.value !== null && (
                  <span
                    aria-hidden="true"
                    className={
                      "absolute bottom-0 left-1/2 h-(--bar-height) w-[min(48px,62%)] origin-bottom -translate-x-1/2 overflow-hidden rounded-t-[5px] " +
                      "bg-[#5e6167] group-hover:bg-[#73767d] " +
                      // 등장 성장만 1.1s·시차로 움직인다. 선택 빛(그림자)은 차오르기와 같이 바로 바뀐다
                      "transition-[scale] duration-1100 ease-[cubic-bezier(0.16,1,0.3,1)] [transition-delay:var(--bar-delay)] motion-reduce:transition-none " +
                      (entered ? "scale-y-100 " : "scale-y-0 ") +
                      (isSelected ? "shadow-[0_0_18px_rgba(244,122,50,0.16)] " : "") +
                      (bar.pendingText !== null ? "border border-dashed border-white/60" : "")
                    }
                  >
                    {/*
                     * 선택하면 주황이 아래에서 위로 차오르고, 선택이 풀리면 빠진다(2026-11-15 사용자). 0.5s, 시차 없음.
                     * 움직임 줄이기면 바로 바뀐다
                     */}
                    <span
                      className={
                        "absolute inset-0 origin-bottom bg-linear-to-t from-[#b64b1c] to-[#f28a49] " +
                        "transition-[scale] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none " +
                        (isSelected ? "scale-y-100" : "scale-y-0")
                      }
                    />
                  </span>
                )}

                <span
                  aria-hidden="true"
                  className={`absolute top-[calc(100%+16px)] left-1/2 -translate-x-1/2 font-mono text-[13px] leading-4 whitespace-nowrap ${isSelected ? "text-[#f49a63]" : "text-muted"}`}
                >
                  {bar.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
