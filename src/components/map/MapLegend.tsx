import { useLocale, useMessages } from "../../i18n";
import { formatFireDays } from "../../lib/format";
import { mapLegend, type MapLegendItem } from "../../lib/map";

/*
 * 지도 범례 (06-maps-legends). 면 5색 + 값 없음 빗금, 점 4색, 선택 지역(있을 때만), 아래 안내 줄.
 * 구간 숫자는 나라별 `meta.labels.bins`(E-1). 세로형은 지도 오른쪽(나라), 가로형은 지도 아래(시·도·시·군·구, 7장).
 */
const FILL = ["bg-map-0", "bg-map-1", "bg-map-2", "bg-map-3", "bg-map-4"] as const;
const DOT = ["bg-dot-0", "bg-dot-1", "bg-dot-2", "bg-dot-3"] as const;

type MapLegendProps = {
  bins: readonly [number, number, number];
  showSelected: boolean;
  /** 표본·2012년 전·범위 밖 안내 */
  notes: readonly string[];
  orientation: "vertical" | "horizontal";
};

export function MapLegend({ bins, showSelected, notes, orientation }: MapLegendProps) {
  const t = useMessages().map.legend;
  const locale = useLocale();
  const n = (v: number) => formatFireDays(v, locale);
  const label = (item: MapLegendItem) =>
    item.kind === "zero" ? "0" : item.kind === "below" ? t.below(n(item.to)) : item.kind === "above" ? t.above(n(item.from)) : t.between(n(item.from), n(item.to));
  const horizontal = orientation === "horizontal";

  return (
    <div className={`flex gap-5 text-xs text-muted ${horizontal ? "flex-col sm:flex-row sm:flex-wrap" : "flex-col"}`}>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink">{t.fillTitle}</h3>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {mapLegend(bins).map((item) => (
            <li key={item.level} className="flex items-center gap-1 text-ink">
              <span aria-hidden="true" className={`size-3 rounded-[2px] border border-border ${FILL[item.level]}`} />
              {label(item)}
            </li>
          ))}
          <li className="flex items-center gap-1 text-ink">
            <span aria-hidden="true" className="heat-hatch size-3 rounded-[2px] border border-border" />
            {t.noValue}
          </li>
        </ul>
        <p>{t.rangeNote}</p>
        <p>{t.fillNote}</p>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-ink">{t.dotTitle}</h3>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {t.ages.map((age, i) => (
            <li key={age} className="flex items-center gap-1 text-ink">
              <span aria-hidden="true" className={`size-2.5 rounded-full border border-ink/35 ${DOT[i] ?? DOT[3]}`} />
              {age}
            </li>
          ))}
        </ul>
        <p>{t.dotNote}</p>
        <p>{t.dotZoomNote}</p>
      </div>
      {(showSelected || notes.length > 0) && (
        <div className="flex flex-col gap-2">
          {showSelected && (
            <p className="flex items-center gap-2 text-ink">
              <span aria-hidden="true" className="h-3 w-4 rounded-[2px] border-2 border-selection" />
              {t.selected}
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
