import { useMessages } from "../../i18n";

/*
 * 지도 카드의 보기 방식 전환(화재 칸·위치 / 평소 대비, 06-maps-panel-kr-l). 모양은 시안 v9 `.db-segment`.
 * "평소 대비"는 자리만 잡는다(9장에서 백엔드 일괄 판정으로). 눌리지 않고 "준비 중"을 읽어 준다.
 * 지도/목록 전환은 2026-11-15 사용자 결정으로 뺐다(`plans/cosmic-redesign.md` 8-2).
 */
export function MapToggles() {
  const t = useMessages().map;
  return (
    <div role="group" aria-label={`${t.modes.cells} / ${t.modes.usual}`} className="flex w-fit gap-0.5 rounded-control border border-line bg-wash p-0.75">
      <button type="button" aria-pressed="true" className="rounded-control-sm bg-inverse px-3 py-1.5 text-xs font-medium text-surface">
        {t.modes.cells}
      </button>
      <button
        type="button"
        aria-disabled="true"
        aria-label={`${t.modes.usual} · ${t.soon}`}
        title={t.soon}
        className="cursor-not-allowed rounded-control-sm px-3 py-1.5 text-xs text-muted"
      >
        {t.modes.usual}
      </button>
    </div>
  );
}
