import { useLocale, useMessages } from "../../i18n";
import { formatFireDays } from "../../lib/format";
import type { Basis, LegendItem } from "../../lib/heatmap";
import { InfoTip } from "../InfoTip";
import { LEVEL_CLASS } from "./HeatmapCell";

/*
 * 히트맵 아래 범례 두 줄 (시안 v11 `FireCalendar.tsx` `.db-calendar-legend`·`.db-calendar-status`, 2026-11-15 사용자).
 * 색 범례: 왼쪽 "단위 · 옅음 → 짙음", 오른쪽 견본 5개(그 지역의 경계 숫자, 4-1).
 * 상태 범례: 칸 상태 6가지(components/sheet/04-calendar-legend)를 칩 한 줄로. 견본 모양은 칸과 같고(지금 그대로),
 * 설명 문장은 칩에 올리거나 초점을 주면 뜬다(시안은 5가지, "관측 자료 없음"은 우리 상태라 남긴다).
 */
type LegendText = { below: (to: string) => string; above: (from: string) => string; between: (from: string, to: string) => string };

/** 단계 견본 이름: 0 / a 미만 / a–b / c 이상. 화면 범례와 달력 PNG가 같이 쓴다 */
export function legendLabel(item: LegendItem, l: LegendText, n: (v: number) => string): string {
  return item.level === 0
    ? "0"
    : item.from === null && item.to !== null
      ? l.below(n(item.to))
      : item.to === null && item.from !== null
        ? l.above(n(item.from))
        : l.between(n(item.from ?? 0), n(item.to ?? 0));
}

export function HeatLegend({ items, basis }: { items: LegendItem[]; basis: Basis }) {
  const t = useMessages();
  const l = t.heatmap.legend;
  const locale = useLocale();
  const n = (v: number) => formatFireDays(v, locale);
  const label = (item: LegendItem) => legendLabel(item, l, n);
  return (
    // 시안 `.db-calendar-legend`: Mono 10, 사이 20, 왼쪽 이름은 남은 자리를 밀어 견본을 오른쪽 끝으로
    <div className="flex flex-wrap items-center gap-5 font-mono text-[10px] text-[#969fac]">
      <p className="mr-auto text-[#7c8798]">{l.title(t.dashboard.unit)}</p>
      <ul className="flex flex-wrap items-center gap-5">
        {items.map((item) => (
          <li key={item.level} className="inline-flex items-center gap-1.75 whitespace-nowrap">
            <span aria-hidden="true" className={`size-3 rounded-full border border-white/10 ${LEVEL_CLASS[basis][item.level]}`} />
            {label(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

type StateKey = "zero" | "converted" | "noData" | "partial" | "selected" | "future";

/** 집계 중·선택한 달 견본의 안쪽 색: 보정 전이면 파랑 계열 가운데 단계(칸 색과 같은 계열, 9장 3차 사용자) */
const SWATCH_FILL: Record<Basis, string> = { harmonized: "bg-heat-3", raw: "bg-heat-raw-4" };

/** 각 상태의 견본 칸. 칸과 같은 유틸리티·토큰을 쓴다. 집계 중 고리는 칸처럼 두 화면 모두 주황 */
function stateSwatch(key: StateKey, basis: Basis): string {
  const fill = SWATCH_FILL[basis];
  switch (key) {
    case "zero":
      return "border border-white/10 bg-heat-0";
    case "converted":
      return "border border-white/10 bg-heat-3 heat-dots";
    case "noData":
      return "border border-white/10 heat-hatch";
    case "partial":
      return `border border-white/10 ${fill} outline-1 outline-offset-3 outline-dashed outline-heat-partial-ring`;
    case "selected":
      return `border border-white/10 ${fill} outline-2 outline-offset-3 outline-solid outline-selection`;
    case "future":
      return "bg-transparent border border-dashed border-heat-future";
  }
}

/** 시안 순서(집계 중 → 감지 없음 → 환산 → 선택 → 집계 전)에 "관측 자료 없음"을 환산 뒤에 */
const STATE_ORDER: StateKey[] = ["partial", "zero", "converted", "noData", "selected", "future"];

/** 보정 전에는 환산 점무늬가 없으니 "센서 환산값" 칩을 뺀다 */
export function StateLegend({ basis }: { basis: Basis }) {
  const s = useMessages().heatmap.states;
  const order = basis === "raw" ? STATE_ORDER.filter((key) => key !== "converted") : STATE_ORDER;
  return (
    // 시안 `.db-calendar-status`: 위 선 #282e38, 위 여백 20, 칩 사이 24
    <ul className="flex flex-wrap gap-6 border-t border-[#282e38] pt-5">
      {order.map((key, i) => (
        <li key={key}>
          <InfoTip
            label={s[key].title}
            text={s[key].body}
            align={i >= order.length - 2 ? "end" : "start"}
            triggerClassName="flex cursor-help items-center gap-2 rounded-sm text-[10px] text-[#9ca7b7] hover:text-ink"
          >
            {/* 견본은 히트맵 점과 같은 16px 원. 고리(outline)가 붙는 견본도 옆 글자와 겹치지 않게 여백 */}
            <span aria-hidden="true" className={`m-1 size-4 shrink-0 rounded-full ${stateSwatch(key, basis)}`} />
            {s[key].title}
          </InfoTip>
        </li>
      ))}
    </ul>
  );
}
