import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "../icons";
import type { FitPadding } from "./MapCanvas";

/*
 * 대시보드 지도 카드 틀 (`plans/cosmic-redesign.md` 8-3 배치 B, 시안 v9 `.db-map-panel`).
 * 지도가 카드를 꽉 채우고, 그 위에 유리 판이 뜬다: 왼쪽 위 제목·보기 방식, 오른쪽 위 확대 칸,
 * 왼쪽 아래 범례(접을 수 있음), 그 아래 출처 줄, 오른쪽 아래 조작 안내.
 * 범위(scope)·훅을 모르고 그릴 것만 받는다. 나라 지도(`MapSection`)와 지역 지도(`RegionMap` `layout="panel"`)가 같이 쓴다.
 */

/** 지도 위에 뜨는 작은 유리 판(시안 지도 위 판 모서리 12) */
export const FLOAT = "glass rounded-panel border border-line";

/** 왼쪽 판(제목·범례) 너비 20rem. 지도를 이만큼 비운 오른쪽 영역에 맞춘다 */
const SIDE = 20 * 16;

/**
 * 지도가 판에 가리지 않게 처음 크기에서 비울 여백(2026-11-15 사용자 지적: 범례가 서해안·제주를 덮음).
 * 왼쪽은 판 자리(16 + 320) + 24, 오른쪽은 확대 칸 자리. 카드가 좁으면 지도가 너무 작아지지 않게 왼쪽 여백을 폭의 45%까지만
 * (1280px 창의 지도 칸 약 856px에서 판과 겹치지 않는다)
 */
export const PANEL_FIT_PADDING: FitPadding = (width) => ({
  top: 24,
  right: 72,
  bottom: 40,
  left: Math.min(16 + SIDE + 24, Math.round(width * 0.45)),
});

type MapPanelProps = {
  /** 왼쪽 위 판: 제목·설명·보기 방식 */
  header: ReactNode;
  /** 꽉 채울 지도(`MapCanvas`는 `absolute inset-0`) */
  map: ReactNode;
  zoom: ReactNode;
  legend: ReactNode;
  legendLabel: string;
  hint: string;
  /** 왼쪽 아래 출처 줄(시안 v11 `.db-map-attribution`). 없으면 줄을 그리지 않는다 */
  attribution?: string;
  tooltip?: ReactNode;
  /** 새 달을 받는 동안 흐리게 */
  dimmed: boolean;
};

export function MapPanel({ header, map, zoom, legend, legendLabel, hint, attribution, tooltip, dimmed }: MapPanelProps) {
  return (
    // 최소 높이는 시안 지도 카드 620px. 줄 높이가 더 크면(오른쪽 두 장) 그만큼 늘어난다
    <section className="glass relative min-h-155 self-stretch overflow-hidden rounded-card border border-line">
      <div aria-busy={dimmed} className={`absolute inset-0 transition-opacity ${dimmed ? "opacity-60" : ""}`}>
        {map}
      </div>
      {/*
       * 왼쪽 세로 줄: 위에 제목 판, 아래에 범례 판. 한 줄로 묶어 두 판이 겹치지 않는다(제목 판이 길어져도 범례가 줄어든다).
       * 줄 자체는 누름을 받지 않고 판만 받는다(판 사이 빈 곳에서는 지도를 끌 수 있게)
       */}
      {/* 아래는 출처 줄 자리(바닥 14 + 줄 높이 + 틈)만큼 띄운다 */}
      <div className="@container pointer-events-none absolute top-4 bottom-10 left-4 flex w-[min(20rem,calc(100%-6rem))] flex-col justify-between gap-4">
        <div className={`pointer-events-auto flex shrink-0 flex-col gap-3 p-4 ${FLOAT}`}>{header}</div>
        <LegendPanel label={legendLabel}>{legend}</LegendPanel>
      </div>
      <div className="absolute top-4 right-4">{zoom}</div>
      <p className="pointer-events-none absolute right-4 bottom-4 text-xs text-muted">{hint}</p>
      {/* 시안 `.db-map-attribution`: 왼쪽 20, 아래 14, 9px */}
      {attribution !== undefined && (
        <p className="pointer-events-none absolute bottom-3.5 left-5 text-[9px] text-[#788c9f]">{attribution}</p>
      )}
      {tooltip}
    </section>
  );
}

/**
 * 접고 펼 때 시간(높이·폭·화살표 같이). 처음과 끝을 함께 부드럽게 하는 곡선(Material standard):
 * `ease-out`은 첫 프레임에 높이가 40px 빠져 툭 움직이는 느낌이었다
 */
const LEGEND_TRANSITION = "duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none";

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 범례 판 (2026-11-15 사용자). 접으면 "범례 ⌄" 글자 크기까지 왼쪽 아래로 줄어든다:
 * 판은 세로 줄 아래에 붙어 있어 높이가 줄면 위가 내려오고, 폭이 줄면 오른쪽이 들어온다.
 * 높이는 내용 칸의 `grid-template-rows` 1fr ↔ 0fr, 폭은 브라우저가 auto와 길이 사이를 움직이지 못해 접기 줄 글자 폭을 재서 px로 준다.
 * 접기 줄은 판 아래에 둔다(사용자 2안): 판이 위에서 내려오며 줄어 버튼이 누른 자리에 그대로 남는다.
 * 범례가 길면 판 안(접기 줄 위)에서 스크롤한다. 접힌 내용은 `inert`(초점·읽기에서 뺀다).
 */
function LegendPanel({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const contentId = useId();
  const labelRef = useRef<HTMLSpanElement>(null);
  const [collapsedWidth, setCollapsedWidth] = useState<number | null>(null);
  /** 접고 펴는 움직임이 끝났는지(펼침이 끝나야 스크롤을 켠다) */
  const [settled, setSettled] = useState(true);

  // 접힌 폭 = 글자 폭 + 틈 12 + 화살표 12 + 버튼 좌우 여백 16·16 + 테두리 1·1. 언어가 바뀌면 다시 잰다
  useLayoutEffect(() => {
    const el = labelRef.current;
    if (el === null) return;
    setCollapsedWidth(Math.ceil(el.scrollWidth) + 12 + 12 + 32 + 2);
  }, [label]);

  return (
    <div
      style={{ width: open || collapsedWidth === null ? "100%" : `${collapsedWidth}px` }}
      className={`pointer-events-auto flex min-h-0 flex-col overflow-hidden transition-[width] ${LEGEND_TRANSITION} ${FLOAT}`}
    >
      <div
        id={contentId}
        inert={!open}
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && e.propertyName === "grid-template-rows") setSettled(true);
        }}
        className={`grid min-h-0 transition-[grid-template-rows] ${LEGEND_TRANSITION} ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        {/*
         * 접히는 동안 줄이 바뀌지 않게 내용 폭은 세로 줄 폭(`100cqw`)에 묶는다. 판이 좁아지면 오른쪽이 잘린다.
         * 스크롤은 펼침이 끝난 뒤에만 켠다(움직이는 동안 높이가 내용보다 작아 스크롤바가 깜박였다).
         * 내용은 접을 때 먼저 흐려지고, 펼 때 판이 어느 정도 커진 뒤 나타난다
         */}
        {/* 가로는 늘 자른다: 내용 폭 `100cqw`가 판 테두리(좌우 1px)만큼 넓어, 세로 스크롤을 켜면 가로 스크롤이 함께 생겼다 */}
        <div className={`min-h-0 overflow-x-hidden ${open && settled ? "overflow-y-auto" : "overflow-y-hidden"}`}>
          <div
            className={`w-[100cqw] px-4 pt-4 pb-1 transition-opacity motion-reduce:transition-none ${
              open ? "opacity-100 delay-100 duration-200" : "opacity-0 duration-150"
            }`}
          >
            {children}
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => {
          setOpen((v) => !v);
          // 움직임이 없으면 끝 이벤트가 오지 않으니 바로 자리 잡은 것으로 둔다
          setSettled(prefersReducedMotion());
        }}
        className="flex shrink-0 cursor-pointer items-center justify-between gap-3 bg-dialog px-4 py-3 text-sm font-medium whitespace-nowrap text-ink focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-selection"
      >
        <span ref={labelRef}>{label}</span>
        <ChevronDownIcon className={`size-3 shrink-0 text-muted transition-transform ${LEGEND_TRANSITION} ${open ? "" : "rotate-180"}`} />
      </button>
    </div>
  );
}
