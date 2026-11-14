import { useLocale, useMessages } from "../../i18n";
import { formatFireDays } from "../../lib/format";
import type { HeatLevel, LegendItem } from "../../lib/heatmap";

/*
 * 색 범례(그 지역의 경계 숫자, 4-1)와 칸 상태 설명 6칸(components/sheet/04-calendar-legend). 견본은 히트맵과 같은 원형 점.
 */
const SWATCH: Record<HeatLevel, string> = {
  0: "bg-heat-0",
  1: "bg-heat-2",
  2: "bg-heat-4",
  3: "bg-heat-5",
  4: "bg-heat-7",
};

export function HeatLegend({ items }: { items: LegendItem[] }) {
  const t = useMessages();
  const l = t.heatmap.legend;
  const locale = useLocale();
  const n = (v: number) => formatFireDays(v, locale);
  const label = (item: LegendItem) =>
    item.level === 0
      ? "0"
      : item.from === null && item.to !== null
        ? l.below(n(item.to))
        : item.to === null && item.from !== null
          ? l.above(n(item.from))
          : l.between(n(item.from ?? 0), n(item.to ?? 0));
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
        {items.map((item) => (
          <li key={item.level} className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-4 rounded-full border border-white/10 ${SWATCH[item.level]}`} />
            {label(item)}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">{l.note(t.dashboard.unit)}</p>
    </div>
  );
}

type StateKey = "zero" | "converted" | "noData" | "partial" | "selected" | "future";

/** 각 상태의 견본 칸. 칸과 같은 유틸리티·토큰을 쓴다 */
const STATE_SWATCH: Record<StateKey, string> = {
  zero: "border border-white/10 bg-heat-0",
  converted: "border border-white/10 bg-heat-3 heat-dots",
  noData: "border border-white/10 heat-hatch",
  partial: "border border-white/10 bg-heat-3 outline-1 outline-offset-3 outline-dashed outline-heat-partial-ring",
  selected: "border border-white/10 bg-heat-3 outline-2 outline-offset-3 outline-solid outline-selection",
  future: "bg-transparent border border-dashed border-heat-future",
};

const STATE_ORDER: StateKey[] = ["zero", "converted", "noData", "partial", "selected", "future"];

export function StateLegend() {
  const s = useMessages().heatmap.states;
  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {STATE_ORDER.map((key) => (
        <li key={key} className="flex items-center gap-4 rounded-control bg-wash p-3">
          {/* 견본은 히트맵 점과 같은 16px 원(시안 달력 점) */}
          <span aria-hidden="true" className={`mx-2 size-4 shrink-0 rounded-full ${STATE_SWATCH[key]}`} />
          <span className="flex min-w-0 flex-col">
            <span className="text-sm text-ink">{s[key].title}</span>
            <span className="text-xs text-muted">{s[key].body}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
