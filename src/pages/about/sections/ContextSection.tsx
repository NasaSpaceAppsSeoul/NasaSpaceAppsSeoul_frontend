import { useState } from "react";
import { MonthlyBars, type BarView } from "../../../components/about/MonthlyBars";
import { NumberedHeading } from "../../../components/about/NumberedHeading";
import { InfoTip } from "../../../components/InfoTip";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useSeries } from "../../../hooks/useSeries";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { formatFireDays, formatMonth, formatMonthName, formatMonthShort } from "../../../lib/format";
import { axisTicks, ytdBars, type Ytd } from "../../../lib/landing";

/*
 * 02 지역 맥락 (새 시안 v9 `.context`, `plans/about-revise.md` 9-5).
 * 한국 나라 시계열 `/series/KOR`의 마지막 달이 속한 해 1월~그 달 막대. 처음 선택은 마지막 달.
 * 고른 달은 주소에 두지 않는 일시 상태(9-5, `HeatmapSection.tsx` 관례). 로딩 회색 판, 실패 구역 에러, 값 없음 안내.
 */
export function ContextSection() {
  const c = useMessages().about.context;
  const series = useSeries("KOR", "KOR");
  const ytd = series.data !== undefined ? ytdBars(series.data.months) : null;

  return (
    <section aria-labelledby="context-title" className="grid gap-12 py-24 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] xl:items-start">
      {/* `data-reveal`: 스크롤 등장 묶음(`hooks/useScrollReveal`, AboutPage가 붙인다) */}
      <div data-reveal>
        <NumberedHeading id="context-title" index={c.index} title={c.title} lead={c.lead} size="sm" />
      </div>
      <div data-reveal data-reveal-delay="1" className="min-w-0 border-b border-white/20 pb-8">
        {series.isPending ? (
          <Skeleton className="h-96" />
        ) : series.isError ? (
          <SectionError kind={errorKind(series.error)} onRetry={() => void series.refetch()} />
        ) : ytd === null ? (
          <p className="text-base text-muted">{c.empty}</p>
        ) : (
          // 마지막 달이 바뀌면(다시 받아 달이 늘거나 해가 바뀜) 선택을 새 마지막 달로 되돌리도록 그 달을 열쇠로 둔다
          <ContextChart key={ytd.bars[ytd.bars.length - 1]?.key ?? ytd.year} ytd={ytd} />
        )}
      </div>
    </section>
  );
}

function ContextChart({ ytd }: { ytd: Ytd }) {
  const t = useMessages();
  const c = t.about.context;
  const locale = useLocale();
  const [selected, setSelected] = useState(ytd.bars.length - 1);

  const lastBar = ytd.bars[ytd.bars.length - 1];
  const range = c.range(ytd.year, formatMonthName(lastBar?.month ?? 1, locale), ytd.bars.length === 1);
  const title = c.chartTitle(t.countries.KOR, range);
  /** 집계 중(`partial`, 그 달 진행 중) / 준실시간(`nrt`, 확정 자료가 끝난 뒤의 달)을 따로 부른다(C-judgement 98행) */
  const pendingLabel = (pending: "partial" | "nrt" | null): string | null =>
    pending === "partial" ? c.inProgress : pending === "nrt" ? c.nrt : null;
  const bars: BarView[] = ytd.bars.map((b) => ({
    key: b.key,
    short: formatMonthShort(b.month, locale),
    label: formatMonth(b.key, locale),
    value: b.value,
    valueText: b.value === null ? null : formatFireDays(b.value, locale),
    pendingText: pendingLabel(b.pending),
  }));
  const ticks = axisTicks(ytd.bars.map((b) => b.value ?? 0));
  const current = bars[selected] ?? bars[bars.length - 1];
  const withPending = (text: string, pending: string | null) => (pending !== null ? `${text} · ${pending}` : text);

  return (
    <div>
      <p className="mb-4 font-mono text-xs tracking-[0.08em] text-muted uppercase">{c.chartKey}</p>
      <h3 className="text-[28px] leading-10 font-normal tracking-[-0.02em]">{title}</h3>
      <MonthlyBars
        bars={bars}
        ticks={ticks}
        formatTick={(v) => formatFireDays(v, locale)}
        selected={selected}
        onSelect={setSelected}
        label={c.chartLabel(title)}
      />
      {/*
       * 범례: 점선 달이 있을 때만. 실선·점선 견본과 ⓘ 도움말(마우스·초점에서 자세한 이유, 2026-11-15 사용자).
       * 견본 색은 막대와 같은 장식 상수(MonthlyBars 주석)
       */}
      {bars.some((b) => b.pendingText !== null) && (
        <div className="mt-2 mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-4 rounded-t-[3px] bg-[#5e6167]" />
            {c.legendFinal}
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="h-3 w-4 rounded-t-[3px] border border-dashed border-white/60 bg-[#5e6167]" />
            {c.legendInProgress}
          </span>
          <InfoTip label={c.legendHelpLabel} text={c.legendHelp} />
        </div>
      )}
      {/* 아래 요약: 선택한 달 · 1월~마지막 달 합계(값 있는 달만, 시안 .chart-summary) */}
      <dl aria-live="polite" className="mt-2 grid grid-cols-2 gap-6 border-t border-border pt-6">
        <div className="flex flex-col gap-2">
          <dt className="font-mono text-xs tracking-[0.08em] text-muted uppercase">{c.selected}</dt>
          <dd className="text-base">
            {current === undefined
              ? c.noValue
              : withPending(`${current.label} · ${current.valueText === null ? c.noValue : `${current.valueText} ${c.unit}`}`, current.pendingText)}
          </dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="font-mono text-xs tracking-[0.08em] text-muted uppercase">{c.total(range)}</dt>
          <dd className="text-base">{withPending(`${formatFireDays(ytd.total, locale)} ${c.unit}`, pendingLabel(ytd.totalPending))}</dd>
        </div>
      </dl>
    </div>
  );
}
