import { useMessages } from "../../i18n";

/*
 * 지도 카드의 보기 방식 전환(화재 칸·위치 / 평소 대비, 06-maps-panel-kr-l). 모양은 시안 v9 `.db-segment`.
 * "평소 대비"는 백엔드 일괄 판정(`/judgement?month=`)으로 칠한다(9장).
 * 지도/목록 전환은 2026-11-15 사용자 결정으로 뺐다(`plans/cosmic-redesign.md` 8-2).
 */
export type MapMode = "cells" | "usual";

const MODES: readonly MapMode[] = ["cells", "usual"];

export function MapToggles({ mode, onChange }: { mode: MapMode; onChange: (mode: MapMode) => void }) {
  const t = useMessages().map;
  return (
    <div role="group" aria-label={`${t.modes.cells} / ${t.modes.usual}`} className="flex w-fit gap-0.5 rounded-control border border-line bg-wash p-0.75">
      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => onChange(m)}
          className={`rounded-control-sm px-3 py-1.5 text-xs focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-selection ${
            mode === m ? "bg-inverse font-medium text-surface" : "text-muted hover:text-ink"
          }`}
        >
          {t.modes[m]}
        </button>
      ))}
    </div>
  );
}
