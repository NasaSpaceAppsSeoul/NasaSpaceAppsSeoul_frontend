import type { Insight } from "../../../api/types";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Badge, Chip } from "../../../components/Chip";
import { StatTile } from "../../../components/insight/StatTile";
import { useJudgement } from "../../../hooks/useJudgement";
import { useLocale, useMessages } from "../../../i18n";
import { formatCount, formatDayDate, formatDayRange, formatFireDays } from "../../../lib/format";
import { headTiles, isInProgress, type NoneReason, type Tile } from "../../../lib/insight";
import { judgementView } from "../../../lib/judgementView";
import { regionNameById } from "../../../lib/region";
import type { InsightScope } from "../scope";

/*
 * 머리 카드: 배지 줄, 제목, 단위 안내, 숫자 칸 4개.
 * 칩·준실시간·추정값은 `/insight`의 `head`에 없어 `/judgement`로 만든다(G-7 2). 판정만 실패하면 배지 자리에 다시 시도.
 * 집계 중 표시는 판정이 없어도 보이도록 `head.reason`으로 정한다. `head.rank`는 쓰지 않는다(3-1).
 */
export function HeadSection({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const t = useMessages();
  const it = t.insight;
  const locale = useLocale();
  const judgement = useJudgement(scope.country, scope.region.id, scope.month);
  const tiles = headTiles({ month: scope.month, head: insight.head, calendar: insight.calendar, strip: insight.years.strip });
  const noneText = (reason: NoneReason) => it.tiles.none[reason];
  const view = judgement.data === undefined ? null : judgementView(judgement.data, null);
  const refName = view?.ref != null ? regionNameById(view.ref.id, view.ref.label, scope.index, locale) : null;
  const regionType = insight.head.region_type;

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={regionType === "sparse" ? "yellow" : "sand"}>{it.badges[regionType]}</Badge>
        <Badge tone="sand">{it.badges.viirs}</Badge>
        {isInProgress(scope.countryStatus, insight.head.reason) && <Badge tone="sand">{t.dashboard.card.partial}</Badge>}
        {view?.chip != null && <Chip value={view.chip} />}
        {view?.ref?.chip != null && refName !== null && (
          <Badge tone="orange">{it.badges.refChip(refName, t.chip[view.ref.chip])}</Badge>
        )}
        {view?.nrt === true && <Badge tone="blue">{t.dashboard.card.nrt}</Badge>}
        {judgement.data?.estimated === true && <Badge tone="neutral">{t.heatmap.tooltip.estimated}</Badge>}
        {judgement.isError && (
          <span role="alert" className="flex items-center gap-2 text-sm text-muted">
            {it.badges.judgementFailed}
            <Button size="sm" onClick={() => void judgement.refetch()}>
              {t.common.retry}
            </Button>
          </span>
        )}
      </div>
      {/* 화면 제목이라 h1. 모양은 다른 카드 머리(`SectionHeading`)와 같다 */}
      <header className="flex flex-col gap-3">
        <p className="text-xs font-semibold text-action">{it.eyebrow}</p>
        <h1 className="text-title-lg text-ink">{it.title(scope.name, scope.monthLabel)}</h1>
        <p className="text-base text-muted">{it.lead(scope.monthName)}</p>
      </header>
      <p className="rounded-card bg-page px-6 py-4 text-sm text-muted">{it.unitNote}</p>
      <div className="grid grid-cols-4 gap-4">
        <StatTile
          label={it.tiles.total}
          {...tileText(tiles.total, (v) => formatFireDays(v, locale), () => `${scope.name} · ${scope.monthLabel}`, noneText)}
        />
        <StatTile
          label={it.tiles.years(scope.monthName)}
          {...tileText(tiles.years, (v) => it.tiles.yearsValue(v.detected, v.total), (v) => `${v.from}–${v.to}`, noneText)}
        />
        <StatTile
          label={it.tiles.days}
          {...tileText(
            tiles.days,
            (v) => it.tiles.daysValue(v.fireDays, v.dmaxDate === null ? null : formatDayDate(v.dmaxDate, locale)),
            (v) => (v.dmax === null ? null : it.tiles.daysSub(formatCount(v.dmax, locale))),
            noneText,
          )}
        />
        <StatTile
          label={it.tiles.cluster}
          {...tileText(
            tiles.cluster,
            (v) => it.tiles.cells(formatCount(v.cells, locale)),
            (v) => {
              const range = formatDayRange(v.start, v.end, locale);
              return v.multiRegion ? `${range} · ${it.tiles.nearby}` : range;
            },
            noneText,
          )}
        />
      </div>
    </Card>
  );
}

/** 칸 하나의 큰 값과 보조 줄. 값이 없으면 "—"와 이유 */
function tileText<T>(
  tile: Tile<T>,
  value: (v: T) => string,
  sub: (v: T) => string | null,
  none: (reason: NoneReason) => string,
): { value: string; sub: string | null } {
  return tile.kind === "value" ? { value: value(tile.value), sub: sub(tile.value) } : { value: "—", sub: none(tile.reason) };
}
