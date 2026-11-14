import type { Insight } from "../../../api/types";
import { Button } from "../../../components/Button";
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
 * 머리(카드 없음, 2026-11-15 디자이너 요청 "카드가 너무 많다"): 배지 줄, 제목, 단위 안내 한 줄, 숫자 칸 4개.
 * 숫자 칸은 유리 판 하나를 세로선으로 나눈다(기법 페이지 머리 `MethodHero` 숫자와 같은 방식).
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
  const view = judgement.data === undefined ? null : judgementView(judgement.data, null, scope.meta.labels.season_start);
  const refName = view?.ref != null ? regionNameById(view.ref.id, view.ref.label, scope.index, locale) : null;
  const regionType = insight.head.region_type;

  return (
    <header className="flex flex-col gap-6 pt-4 pb-2 break-keep">
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
      {/* 화면 제목이라 h1. 기법 페이지 머리처럼 주황 점이 붙은 Mono 작은 제목 + 큰 제목 + 요지 */}
      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-2.5 font-mono text-[0.8125rem] text-muted uppercase [&:lang(en)]:tracking-[0.14em]">
          <span aria-hidden="true" className="size-1.75 rounded-full bg-fire" />
          {it.eyebrow}
        </p>
        <h1 className="text-[2.75rem] leading-tight font-medium tracking-tight text-ink">{it.title(scope.name, scope.monthLabel)}</h1>
        <p className="max-w-[40em] text-xl leading-relaxed text-subtle">{it.lead(scope.monthName)}</p>
        {/* 단위 안내: 상자 없이 흐린 글자 한 줄 */}
        <p className="text-sm text-muted">{it.unitNote}</p>
      </div>
      <ul aria-label={it.tiles.label} className="glass mt-2 grid grid-cols-4 divide-x divide-line overflow-hidden rounded-card border border-line">
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
      </ul>
    </header>
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
