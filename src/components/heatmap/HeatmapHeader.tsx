import { useMessages } from "../../i18n";
import type { Basis, YearMode } from "../../lib/heatmap";
import { DownloadIcon } from "../icons";

/*
 * 히트맵 카드 머리와 버튼 줄 (시안 v11 `FireCalendar.tsx` `.db-calendar-title`·`.db-calendar-actions`, 2026-11-15 사용자).
 * 머리: 머리말 + 제목 + 부제 | 보정 전/후 전환. 버튼 줄: 표시 연도 분절 버튼 | 조용한 내려받기 버튼.
 * 보정 전/후 전환(9장 2차): 고른 쪽은 보정 후 앰버, 보정 전 파랑 알약(시안 `.db-harmonized-choice`·`.db-raw-choice`).
 * 보정 전 값이 없는 지역(시·도, 목 모드)은 "보정 전"을 비활성으로 두고 이유를 `title`과 버튼 줄 글자로 보인다.
 * CSV·달력 PNG는 확인 대화상자를 연다(9장, 4-8).
 * 비활성 버튼은 `aria-disabled`로 두어 키보드로도 포커스와 이유를 볼 수 있게 한다. 목 모드에는 서버 CSV가 없어 그 이유를 화면 글자로 보인다
 * (PNG는 프론트가 그려서 목 모드에서도 된다).
 */
type HeatmapHeaderProps = {
  sub: string;
  basis: Basis;
  onBasis: (basis: Basis) => void;
  /** 보정 전 값이 없어 전환을 막을 때 그 이유. 고를 수 있으면 `null` */
  rawUnavailable: string | null;
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

const BASIS_BUTTON = "rounded-control-sm border px-4 py-1.5 text-sm";
/** 고른 쪽 알약. 보정 전 파랑(시안 #18324e·#37648d·#85bdff에 가까운 `tone-blue`), 보정 후 앰버 */
const BASIS_PRESSED: Record<Basis, string> = {
  raw: "border-action/40 bg-tone-blue font-medium text-tone-blue-ink",
  harmonized: "border-fire/40 bg-tone-orange font-medium text-tone-orange-ink",
};

export function HeatmapHeader({ sub, basis, onBasis, rawUnavailable, yearMode, onYearMode, mockMode, onCsv, onPng }: HeatmapHeaderProps) {
  const t = useMessages();
  const h = t.heatmap;
  const basisButton = (value: Basis, label: string, disabledReason: string | null) => {
    const pressed = basis === value;
    return (
      <button
        type="button"
        aria-pressed={pressed}
        aria-disabled={disabledReason !== null}
        title={disabledReason ?? undefined}
        onClick={() => {
          if (disabledReason === null) onBasis(value);
        }}
        className={`${BASIS_BUTTON} ${
          pressed
            ? BASIS_PRESSED[value]
            : disabledReason !== null
              ? "cursor-not-allowed border-transparent text-muted"
              : "cursor-pointer border-transparent text-muted hover:text-ink"
        }`}
      >
        {label}
      </button>
    );
  };
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
        <div className="flex shrink-0 flex-col items-end gap-2">
          {/* 시안 v9 `.db-segment`: 옅은 막 + 흰 선 */}
          <div role="group" aria-label={`${h.raw} / ${h.harmonized}`} className="flex gap-0.5 rounded-control border border-line bg-wash p-0.75">
            {basisButton("raw", h.raw, rawUnavailable)}
            {basisButton("harmonized", h.harmonized, null)}
          </div>
          {/* 막은 이유를 화면 글자로도(마우스를 올리지 않아도 보이게) */}
          {rawUnavailable !== null && <p className="text-xs text-muted">{rawUnavailable}</p>}
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
