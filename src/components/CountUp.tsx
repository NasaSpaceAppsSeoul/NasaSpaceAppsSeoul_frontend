import { Fragment, useLayoutEffect, useRef, type ReactNode } from "react";

/*
 * 숫자 올라가기 (참고 소스 `burnline-landing 5` `CountUp.tsx`, 2026-11-15 디자이너·사용자: 값으로 보이는 숫자는 모든 화면 공통).
 * - 글자 안의 숫자("1,093", "1.00배", "80–97%")를 0부터 최종 값까지 올린다. 숫자가 아닌 글자는 그대로.
 * - 화면에 조금이라도 보이면 시작하고, 글자가 바뀌면(나라·달을 바꿈) 다시 올린다. 0.75초, 처음 빠르고 끝에서 천천히.
 * - 최종 글자 폭을 미리 잡아 두고 숫자 폭을 고정해 올라가는 동안 옆 글자가 흔들리지 않는다(자리 잡기는 `::before`).
 * - 화면 낭독기는 최종 글자만 읽는다: 움직이는 글자는 `aria-hidden`, 최종 글자는 `sr-only`(참고 소스와 같음, `aria-live` 줄 안에서도 중간 값을 읽지 않게).
 * - 움직임 줄이기, 관찰 기능이 없는 환경(테스트), 숫자가 없거나 모두 0이면 최종 글자를 바로 보인다.
 * - 0으로 바꾸는 일은 그리기 전(`useLayoutEffect`)에 해서 최종 값이 한 번 보였다가 0으로 돌아가는 깜빡임이 없다.
 *   애니메이션은 글자만 바꾼다(상태를 쓰지 않아 다시 그리지 않는다).
 * 표·그래프·문장 속 숫자에는 쓰지 않는다(많이 모여 있으면 읽기 어렵다).
 */

const DURATION = 750;
/** 쉼표 묶음 숫자 또는 보통 숫자(소수 포함) */
const NUMBER = /\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g;

type Part = { text: string } | { value: number; decimals: number; grouped: boolean };

export function parse(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const m of text.matchAll(NUMBER)) {
    const at = m.index;
    if (at > last) parts.push({ text: text.slice(last, at) });
    const raw = m[0];
    const decimals = raw.includes(".") ? (raw.split(".")[1]?.length ?? 0) : 0;
    parts.push({ value: Number(raw.replace(/,/g, "")), decimals, grouped: raw.includes(",") });
    last = at + raw.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** 진행률(0~1)에서 보일 글자. 숫자는 최종 값과 같은 소수 자리·쉼표 */
export function frame(parts: Part[], progress: number): string {
  return parts
    .map((p) =>
      "text" in p
        ? p.text
        : (p.value * progress).toLocaleString("en-US", {
            minimumFractionDigits: p.decimals,
            maximumFractionDigits: p.decimals,
            useGrouping: p.grouped,
          }),
    )
    .join("");
}

/**
 * 시작한 뒤 흐른 시간의 진행률(0~1). `requestAnimationFrame`이 주는 시각은 그 프레임이 시작된 때라
 * `performance.now()`로 잡은 시작 시각보다 앞설 수 있다. 그대로 쓰면 진행률이 음수가 돼 첫 프레임에 음수가 그려진다
 * (숨겨진 탭에서는 그 프레임에 멈춰 "-594"처럼 보였다, 2026-11-15). 그래서 0 아래로 내려가지 않게 자른다.
 */
export function progressAt(now: number, start: number): number {
  return Math.min(1, Math.max(0, (now - start) / DURATION));
}

export function CountUp({ text }: { text: string }) {
  const live = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = live.current;
    if (el === null) return;
    el.textContent = text;
    const parts = parse(text);
    const moving = parts.some((p) => "value" in p && p.value !== 0);
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!moving || reduce || typeof IntersectionObserver === "undefined") return;

    let raf = 0;
    // 글자가 바뀌어 정리된 뒤 늦게 도착한 관찰 알림이 옛 값으로 돌지 않게
    let alive = true;
    el.textContent = frame(parts, 0);
    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        if (!alive) return;
        const p = progressAt(now, start);
        if (p < 1) {
          el.textContent = frame(parts, 1 - Math.pow(1 - p, 3));
          raf = requestAnimationFrame(tick);
        } else {
          el.textContent = text;
        }
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (alive && entry?.isIntersecting === true) {
          io.disconnect();
          run();
        }
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = text;
    };
  }, [text]);

  return (
    // `data-final` 글자를 `::before`로 같은 칸에 숨겨 두어 최종 폭을 잡는다(`styles/index.css` `.count-up`)
    <span className="count-up" data-final={text}>
      <span ref={live} aria-hidden="true">
        {text}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}

const SLOT = "\u0000";

/**
 * 문구 함수 안의 값 자리에만 숫자 올라가기를 넣는다(달·연도 같은 다른 숫자는 그대로).
 * 예: `countIn((v) => t.detail(v, unit), "1,093")` → "<올라가는 1,093> 화재 감지일 · …"
 */
export function countIn(template: (slot: string) => string, value: string): ReactNode {
  const pieces = template(SLOT).split(SLOT);
  return pieces.map((piece, i) => (
    <Fragment key={i}>
      {piece}
      {i < pieces.length - 1 && <CountUp text={value} />}
    </Fragment>
  ));
}
