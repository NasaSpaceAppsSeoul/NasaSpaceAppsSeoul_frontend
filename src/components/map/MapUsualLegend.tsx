import { useMessages } from "../../i18n";
import type { ErrorKind } from "../../lib/errorKind";
import { Button } from "../Button";
import type { UsualChip } from "../../lib/map";

/*
 * 지도 "평소 대비" 범례(06-maps-panel-kr-l 아래). 평가 4가지 + 평가 없음 빗금, 아래 안내 줄.
 * 평가별 구역 수는 프론트에서 세는 합계라 넣지 않는다(`plans/cosmic-redesign.md` ⑫, 9장 묶음 C).
 * 일괄 판정 실패 알림은 범례(접을 수 있음) 밖에 두어야 늘 보이므로 `MapUsualError`로 따로 그린다.
 */
const FILL: Record<UsualChip, string> = {
  record: "bg-usual-record",
  above: "bg-usual-above",
  normal: "bg-usual-normal",
  below: "bg-usual-below",
};
const ORDER: readonly UsualChip[] = ["record", "above", "normal", "below"];

type MapUsualLegendProps = {
  notes: readonly string[];
  orientation: "vertical" | "horizontal";
  /** 지역 지도에서 파란 테두리(선택 지역)가 보일 때 */
  showSelected?: boolean;
};

export function MapUsualLegend({ notes, orientation, showSelected = false }: MapUsualLegendProps) {
  const t = useMessages();
  const u = t.map.usual;
  const horizontal = orientation === "horizontal";
  return (
    <div className={`flex gap-5 text-xs text-muted ${horizontal ? "flex-col sm:flex-row sm:flex-wrap" : "flex-col"}`}>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink">{u.legendTitle}</h3>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {ORDER.map((chip) => (
            <li key={chip} className="flex items-center gap-1 text-ink">
              <span aria-hidden="true" className={`size-3 rounded-[2px] border border-border ${FILL[chip]}`} />
              {t.chip[chip]}
            </li>
          ))}
          <li className="flex items-center gap-1 text-ink">
            <span aria-hidden="true" className="heat-hatch size-3 rounded-[2px] border border-border" />
            {u.none}
          </li>
        </ul>
        <p>{u.basisNote}</p>
        <p>{u.noneNote}</p>
      </div>
      {(showSelected || notes.length > 0) && (
        <div className="flex flex-col gap-2">
          {showSelected && (
            <p className="flex items-center gap-2 text-ink">
              <span aria-hidden="true" className="h-3 w-4 rounded-[2px] border-[1.5px] border-selection/85" />
              {t.map.legend.selected}
            </p>
          )}
          {notes.map((note) => (
            <p key={note} className="text-ink">
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 일괄 판정을 받지 못했을 때 지도 머리 판에 붙는 알림(범례를 접어도 보인다). 지도는 빗금으로 남는다.
 * 다시 해서 나아질 수 있는 에러(`offline`·`other`)만 "다시 시도"(`SectionError`와 같은 기준).
 */
export function MapUsualError({ kind, onRetry }: { kind: ErrorKind; onRetry: () => void }) {
  const t = useMessages();
  return (
    <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-ink">
      <p>{t.map.usual.failed}</p>
      {(kind === "offline" || kind === "other") && (
        <Button size="sm" onClick={onRetry}>
          {t.common.retry}
        </Button>
      )}
    </div>
  );
}
