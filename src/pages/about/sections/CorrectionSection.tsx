import { AnnualBarChart, type ChartBar } from "../../../components/about/AnnualBarChart";
import { Card } from "../../../components/Card";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useLanding } from "../../../hooks/useLanding";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { formatFireDays } from "../../../lib/format";
import { annualBars, BREAK_YEAR, hasAnnualData, niceMax, type AnnualBar } from "../../../lib/landing";
import { SectionHeading } from "../../../components/about/SectionHeading";

/*
 * 보정 전후 막대 (screens/kr/about.png "하나로 이어진 기록", `H-landing.md` H-3).
 * 두 값 모두 화재 감지일(칸 × 하루)이라 두 카드가 같은 세로축을 쓴다(2026-11-14 사용자 결정). 해는 받은 25개 전부.
 */
export function CorrectionSection() {
  const c = useMessages().about.correction;
  const landing = useLanding("KOR");

  return (
    <Card className="flex flex-col gap-6">
      <SectionHeading eyebrow={c.eyebrow} title={c.title} lead={c.lead} />
      {landing.isPending ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      ) : landing.isError ? (
        <SectionError kind={errorKind(landing.error)} onRetry={() => void landing.refetch()} />
      ) : (
        <CorrectionCharts bars={annualBars(landing.data.annual)} />
      )}
      <p className="text-sm text-muted">{c.footnote}</p>
    </Card>
  );
}

function CorrectionCharts({ bars }: { bars: AnnualBar[] }) {
  const c = useMessages().about.correction;
  const locale = useLocale();
  if (!hasAnnualData(bars)) return <p className="text-base text-muted">{c.empty}</p>;

  const first = bars[0]?.year ?? BREAK_YEAR;
  const last = bars[bars.length - 1]?.year ?? BREAK_YEAR;
  const max = niceMax(bars.flatMap((b) => [b.before, b.after]));
  const maxText = formatFireDays(max, locale);
  const common = {
    max,
    yearTicks: [first, 2006, BREAK_YEAR, 2018, last],
    markYear: BREAK_YEAR,
    empty: c.empty,
    formatTick: (value: number) => formatFireDays(value, locale),
    barTitle: (bar: ChartBar) => c.bar(bar.year, formatFireDays(bar.value, locale)),
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <AnnualBarChart
          {...common}
          title={c.rawTitle}
          sub={c.rawSub(first, last, maxText)}
          legend={c.rawLegend}
          note={c.rawNote}
          label={c.chartLabel(c.rawTitle, first, last)}
          bars={bars.map((b) => ({ year: b.year, value: b.before, era: b.era }))}
          tone="blue"
        />
        <AnnualBarChart
          {...common}
          title={c.harmonizedTitle}
          sub={c.harmonizedSub(first, last, maxText)}
          legend={c.harmonizedLegend}
          note={c.harmonizedNote}
          label={c.chartLabel(c.harmonizedTitle, first, last)}
          bars={bars.map((b) => ({ year: b.year, value: b.after, era: b.era }))}
          tone="orange"
        />
      </div>
      {/* 그래프가 있을 때만 그래프를 설명하는 줄을 보인다 */}
      <p className="text-sm font-semibold text-ink">{c.sameScale}</p>
    </div>
  );
}
