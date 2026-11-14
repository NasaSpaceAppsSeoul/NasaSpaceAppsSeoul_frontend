import { useMessages } from "../../i18n";
import type { YearMode } from "../../lib/heatmap";
import { DownloadIcon } from "../icons";

/*
 * 히트맵 카드 머리와 버튼 줄 (시안 v11 `FireCalendar.tsx` `.db-calendar-title`·`.db-calendar-actions`, 2026-11-15 사용자).
 * 머리: 머리말 + 제목 + 부제 | 보정 전/후 전환. 버튼 줄: 표시 연도 분절 버튼 | 조용한 내려받기 버튼.
 * 자리만 잡는 것(1-9): 보정 전/후 전환(`raw_before`를 기다림). CSV·달력 PNG는 확인 대화상자를 연다(9장, 4-8).
 * 비활성 버튼은 `aria-disabled`로 두어 키보드로도 포커스와 이유를 볼 수 있게 한다. 목 모드에는 서버 CSV가 없어 그 이유를 화면 글자로 보인다
 * (PNG는 프론트가 그려서 목 모드에서도 된다).
 */
type HeatmapHeaderProps = {
  sub: string;
  /** 표시 연도. 시·군·구는 고를 것이 없어(늘 비교 기간부터, 4-7) `null` */
  yearMode: YearMode | null;
  onYearMode: (mode: YearMode) => void;
  mockMode: boolean;
  onCsv: () => void;
  onPng: () => void;
};

/** 시안 `.db-segment button`: 11px, 줄 높이 20, 7·12 여백, 모서리 4 */
const SEGMENT_BUTTON = "rounded-[4px] border border-transparent px-3 py-1.75 text-[11px] leading-5 font-medium";

/** 시안 `.db-quiet-button`: 테두리·바탕 없이 12px 글자와 16px 아이콘 */
const QUIET_BUTTON = "inline-flex items-center gap-2 py-2 text-xs text-[#b5b7be] aria-disabled:cursor-not-allowed";

export function HeatmapHeader({ sub, yearMode, onYearMode, mockMode, onCsv, onPng }: HeatmapHeaderProps) {
  const t = useMessages();
  const h = t.heatmap;
  const soon = t.common.comingSoon;
  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between gap-6">
        <div className="flex min-w-0 flex-col">
          <p className="mono-overline text-muted">{h.overline}</p>
          {/* 시안 `.db-calendar-title h2`: 24px, 머리말 아래 12 */}
          <h2 className="mt-3 text-2xl font-normal text-ink">{h.title}</h2>
          {/* 시안 `.db-support-copy`: 12px, 줄 높이 1.7, 위 8 */}
          <p className="mt-2 text-xs leading-[1.7] text-[#95a0b0]">{sub}</p>
        </div>
        {/* 시안 v9 `.db-segment`: 옅은 막 + 흰 선, 고른 "보정 후"는 앰버 알약(`.db-harmonized-choice`) */}
        <div role="group" aria-label={`${h.raw} / ${h.harmonized}`} className="flex shrink-0 gap-0.5 rounded-control border border-line bg-wash p-0.75">
          <button type="button" aria-disabled="true" title={soon} className="cursor-not-allowed rounded-control-sm border border-transparent px-4 py-1.5 text-sm text-muted">
            {h.raw}
          </button>
          <button
            type="button"
            aria-pressed="true"
            className="rounded-control-sm border border-fire/40 bg-tone-orange px-4 py-1.5 text-sm font-medium text-tone-orange-ink"
          >
            {h.harmonized}
          </button>
        </div>
      </header>
      {/* 시안 `.db-calendar-actions`: 위아래 24, 양끝 정렬 */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-6">
        {yearMode !== null ? (
          // 시안 `.db-calendar-actions .db-segment`: 바탕 없이 테두리 #303641, 고른 쪽은 #303641 바탕
          <div role="group" aria-label={h.years.label} className="flex gap-0.5 rounded-[6px] border border-[#303641] p-0.75">
            {(["all", "viirs"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={yearMode === mode}
                onClick={() => onYearMode(mode)}
                className={`${SEGMENT_BUTTON} ${
                  yearMode === mode ? "bg-[#303641] text-[#e7ebf0]" : "cursor-pointer text-[#969ba5] hover:bg-[#22262d] hover:text-ink"
                }`}
              >
                {h.years[mode]}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-6">
          {mockMode && <p className="text-xs text-muted">{h.csvMock}</p>}
          <button
            type="button"
            aria-disabled={mockMode}
            title={mockMode ? h.csvMock : undefined}
            onClick={() => {
              if (!mockMode) onCsv();
            }}
            className={`${QUIET_BUTTON} ${mockMode ? "" : "cursor-pointer hover:text-ink"}`}
          >
            <DownloadIcon />
            {h.csv}
          </button>
          <button type="button" onClick={onPng} className={`${QUIET_BUTTON} cursor-pointer hover:text-ink`}>
            <DownloadIcon />
            {h.png}
          </button>
        </div>
      </div>
    </div>
  );
}
