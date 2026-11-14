import type { ReactNode } from "react";
import { ChevronDownIcon } from "../icons";
import type { FitPadding } from "./MapCanvas";

/*
 * 대시보드 지도 카드 틀 (`plans/cosmic-redesign.md` 8-3 배치 B, 시안 v9 `.db-map-panel`).
 * 지도가 카드를 꽉 채우고, 그 위에 유리 판이 뜬다: 왼쪽 위 제목·보기 방식, 오른쪽 위 확대 칸,
 * 왼쪽 아래 범례(접을 수 있음, 브라우저 기본 `<details>`), 오른쪽 아래 조작 안내.
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
  tooltip?: ReactNode;
  /** 새 달을 받는 동안 흐리게 */
  dimmed: boolean;
};

export function MapPanel({ header, map, zoom, legend, legendLabel, hint, tooltip, dimmed }: MapPanelProps) {
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
      <div className="pointer-events-none absolute inset-y-4 left-4 flex w-[min(20rem,calc(100%-6rem))] flex-col justify-between gap-4">
        <div className={`pointer-events-auto flex shrink-0 flex-col gap-3 p-4 ${FLOAT}`}>{header}</div>
        {/* 범례가 길면 판 안에서 스크롤하고, 접기 줄은 위에 붙어 남는다 */}
        <details open className={`group pointer-events-auto min-h-0 overflow-y-auto ${FLOAT}`}>
          <summary className="sticky top-0 flex cursor-pointer list-none items-center justify-between gap-3 bg-dialog px-4 py-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-selection">
            {legendLabel}
            <ChevronDownIcon className="size-3 text-muted transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4">{legend}</div>
        </details>
      </div>
      <div className="absolute top-4 right-4">{zoom}</div>
      <p className="pointer-events-none absolute right-4 bottom-4 text-xs text-muted">{hint}</p>
      {tooltip}
    </section>
  );
}
