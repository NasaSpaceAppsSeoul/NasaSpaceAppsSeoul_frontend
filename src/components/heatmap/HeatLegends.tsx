import { useLocale, useMessages } from "../../i18n";
import { formatFireDays } from "../../lib/format";
import type { HeatLevel, LegendItem } from "../../lib/heatmap";
import { InfoTip } from "../InfoTip";

/*
 * 히트맵 아래 범례 두 줄 (시안 v11 `FireCalendar.tsx` `.db-calendar-legend`·`.db-calendar-status`, 2026-11-15 사용자).
 * 색 범례: 왼쪽 "단위 · 옅음 → 짙음", 오른쪽 견본 5개(그 지역의 경계 숫자, 4-1).
 * 상태 범례: 칸 상태 6가지(components/sheet/04-calendar-legend)를 칩 한 줄로. 견본 모양은 칸과 같고(지금 그대로),
 * 설명 문장은 칩에 올리거나 초점을 주면 뜬다(시안은 5가지, "관측 자료 없음"은 우리 상태라 남긴다).
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
    // 시안 `.db-calendar-legend`: Mono 10, 사이 20, 왼쪽 이름은 남은 자리를 밀어 견본을 오른쪽 끝으로
    <div className="flex flex-wrap items-center gap-5 font-mono text-[10px] text-[#969fac]">
      <p className="mr-auto text-[#7c8798]">{l.title(t.dashboard.unit)}</p>
      <ul className="flex flex-wrap items-center gap-5">
        {items.map((item) => (
          <li key={item.level} className="inline-flex items-center gap-1.75 whitespace-nowrap">
            <span aria-hidden="true" className={`size-3 rounded-full border border-white/10 ${SWATCH[item.level]}`} />
            {label(item)}
          </li>
        ))}
      </ul>
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

/** 시안 순서(집계 중 → 감지 없음 → 환산 → 선택 → 집계 전)에 "관측 자료 없음"을 환산 뒤에 */
const STATE_ORDER: StateKey[] = ["partial", "zero", "converted", "noData", "selected", "future"];

export function StateLegend() {
  const s = useMessages().heatmap.states;
  return (
    // 시안 `.db-calendar-status`: 위 선 #282e38, 위 여백 20, 칩 사이 24
    <ul className="flex flex-wrap gap-6 border-t border-[#282e38] pt-5">
      {STATE_ORDER.map((key, i) => (
        <li key={key}>
          <InfoTip
            label={s[key].title}
            text={s[key].body}
            align={i >= STATE_ORDER.length - 2 ? "end" : "start"}
            triggerClassName="flex cursor-help items-center gap-2 rounded-sm text-[10px] text-[#9ca7b7] hover:text-ink"
          >
            {/* 견본은 히트맵 점과 같은 16px 원. 고리(outline)가 붙는 견본도 옆 글자와 겹치지 않게 여백 */}
            <span aria-hidden="true" className={`m-1 size-4 shrink-0 rounded-full ${STATE_SWATCH[key]}`} />
            {s[key].title}
          </InfoTip>
        </li>
      ))}
    </ul>
  );
}
