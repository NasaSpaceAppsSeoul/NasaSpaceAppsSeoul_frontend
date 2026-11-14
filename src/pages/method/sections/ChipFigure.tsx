import { useState, type ReactNode } from "react";
import { CountryTabs } from "../../../components/method/CountryTabs";
import { FigureDataTable } from "../../../components/method/FigureDataTable";
import { MethodFigure } from "../../../components/method/MethodFigure";
import { SameMonthChart } from "../../../components/method/SameMonthChart";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useBaseline } from "../../../hooks/useBaseline";
import { useLanding } from "../../../hooks/useLanding";
import { useSeries } from "../../../hooks/useSeries";
import { useLocale, useMessages } from "../../../i18n";
import { useMethodMessages } from "../../../i18n/method";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "../../../lib/country";
import { errorKind } from "../../../lib/errorKind";
import { formatFireDays, formatRatio } from "../../../lib/format";
import { caseMonth, chipFigureModel } from "../../../lib/methodFigures";

/*
 * 06절 그림: 고른 나라의 대표 달(`/landing` `case_month_ratio`, 백엔드 `LandingService.java:25`와 같은 달)의 2001–2025 값을
 * `/series/{나라}`에서, 보통 범위를 `/baseline/{나라}`에서 받아 그린다(`plans/method-page.md` 8-3·12-8).
 * 칩은 백엔드 규칙(순위 1위·범위 비교)으로, 프론트가 최댓값으로 새로 판정하지 않는다.
 * 세 요청 중 하나라도 받는 중이면 회색 자리, 실패하면 실패한 요청만 다시 받는 구역 에러. 이미 받은 값이 있으면
 * 다시 받기가 실패해도 그 값으로 그린다. 제목의 배수·순위는 그림과 같은 `/series`의 그 달 줄에서 읽고(백엔드도 같은 줄에서 만든다),
 * 1위가 아니거나 값이 없으면 제목을 짧게. 배수는 소수 두 자리(`decisions.md` 1-11). 막대가 하나도 없으면 안내.
 */
export function ChipFigure() {
  const t = useMethodMessages();
  const f = t.chip.figure;
  const chipName = useMessages().chip;
  const locale = useLocale();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const landing = useLanding(country);
  const series = useSeries(country, country);
  const baseline = useBaseline(country, country);
  const queries = [landing, series, baseline];
  const failed = queries.filter((q) => q.isError && q.data === undefined);
  const format = (value: number) => formatFireDays(value, locale);
  const name = t.countryTabs[country];

  const tabs = (
    <CountryTabs label={t.countryTabs.label} countries={COUNTRIES} names={t.countryTabs} value={country} onChange={setCountry} />
  );
  const figure = (title: string, body: ReactNode) => (
    <MethodFigure title={title} sub={f.sub} caption={f.caption(name)} action={tabs}>
      {body}
    </MethodFigure>
  );

  if (queries.some((q) => q.isPending || (q.isError && q.data === undefined && q.isFetching))) {
    return figure(f.title, <Skeleton className="aspect-[720/290]" />);
  }
  const firstError = failed[0];
  if (firstError !== undefined || landing.data === undefined || series.data === undefined || baseline.data === undefined) {
    return figure(
      f.title,
      <SectionError
        kind={errorKind(firstError?.error ?? null)}
        onRetry={() => {
          for (const q of failed) void q.refetch();
        }}
      />,
    );
  }

  const target = caseMonth(landing.data.stats);
  if (target === null) return figure(f.title, <p className="py-10 text-center text-sm text-muted">{f.empty}</p>);

  const { bars, band, headline } = chipFigureModel(series.data.months, baseline.data.by_month, target);
  if (bars.length === 0) return figure(f.title, <p className="py-10 text-center text-sm text-muted">{f.empty}</p>);
  const title =
    headline === null
      ? f.titleShort(target.year, target.month)
      : f.titleFull(target.year, target.month, formatRatio(headline.ratio, locale), headline.n);
  const record = bars.find((bar) => bar.chip === "record");

  return figure(
    title,
    <>
      <SameMonthChart
        bars={bars}
        band={band}
        label={f.label(name, target.month)}
        format={format}
        chipName={chipName}
        barTitle={f.bar}
        recordNote={record === undefined ? null : f.record(record.year, format(record.value))}
        bandLabels={{ high: f.high, median: f.median, low: f.low }}
      />
      <FigureDataTable
        caption={f.label(name, target.month)}
        head={[f.yearHead, f.valueHead, f.chipHead]}
        rows={bars.map((bar) => ({ key: String(bar.year), cells: [String(bar.year), format(bar.value), chipName[bar.chip]] }))}
      />
    </>,
  );
}
