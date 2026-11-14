import { useLocale, useMessages } from "../../i18n";
import { formatFireDays, formatMonth } from "../../lib/format";
import type { HeatCell } from "../../lib/heatmap";
import { monthNumber } from "../../lib/month";
import type { TooltipLines } from "./HeatmapTooltip";

/** 그 달의 보통 해 범위. 자체 판정이 아니면 `null`(툴팁에서 그 줄을 뺀다). */
export type BandFor = (monthOfYear: number) => { low: number; high: number } | null;

/**
 * 칸의 읽는 이름과 툴팁 줄을 만든다(4-6). 값이 없는 칸은 이유 한 줄.
 * 순위는 쓰지 않는다(3-1: 드문 지역의 자기 순위를 보여 주지 않음).
 */
export function useCellText(regionLabel: string, bandFor: BandFor) {
  const t = useMessages();
  const card = t.dashboard.card;
  const h = t.heatmap;
  const locale = useLocale();

  return (cell: HeatCell): { label: string; tooltip: TooltipLines } => {
    const heading = `${regionLabel} · ${formatMonth(cell.month, locale)}`;
    const value = cell.value !== null ? `${formatFireDays(cell.value, locale)} ${t.dashboard.unit}` : null;
    const metaParts = [
      cell.state === "partial" ? card.partial : null,
      cell.estimated ? h.tooltip.estimated : null,
      cell.converted ? card.converted : null,
      cell.quality !== null ? card.quality[cell.quality] : null,
      cell.nrt ? card.nrt : null,
    ].filter((part): part is string => part !== null);
    const band = cell.value !== null ? bandFor(monthNumber(cell.month)) : null;
    const note =
      cell.state === "noData"
        ? h.tooltip.noData
        : cell.state === "future"
          ? h.tooltip.future
          : cell.state === "blank"
            ? h.tooltip.blank
            : null;
    const tooltip: TooltipLines = {
      heading,
      value,
      meta: metaParts.length > 0 ? metaParts.join(" · ") : null,
      // 하한이 음수면 0으로(3-6)
      band: band !== null ? card.band(formatFireDays(Math.max(0, band.low), locale), formatFireDays(band.high, locale)) : null,
      note,
    };
    const label = [heading, value, tooltip.meta, note, cell.selected ? h.states.selected.title : null]
      .filter((part): part is string => part !== null)
      .join(" · ");
    return { label, tooltip };
  };
}
