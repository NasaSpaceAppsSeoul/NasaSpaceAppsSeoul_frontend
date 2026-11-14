import { useState } from "react";
import { AnnualLineChart } from "../../../components/method/AnnualLineChart";
import { CountryTabs } from "../../../components/method/CountryTabs";
import { MethodFigure } from "../../../components/method/MethodFigure";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useLanding } from "../../../hooks/useLanding";
import { useLocale } from "../../../i18n";
import { useMethodMessages } from "../../../i18n/method";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "../../../lib/country";
import { errorKind } from "../../../lib/errorKind";
import { formatFireDays } from "../../../lib/format";
import { annualBars, hasAnnualData } from "../../../lib/landing";

/*
 * 04절 그림: 고른 나라의 `/landing` `annual`(보정 전·후 연간 값)을 선 두 개로 (`plans/method-page.md` 12-6).
 * 나라 탭은 이 그림만의 상태다(주소 규칙의 예외, `HeatmapSection`과 같은 관례, 8-3). 처음은 한국.
 * 받는 동안은 그림 크기의 회색 자리(해시로 들어온 뒤 자리가 밀리지 않게 비율 고정), 실패면 그 자리에 구역 에러 + 다시 시도.
 * 값이 모두 0이면 자료 없음과 구분되지 않아(H-3) 그림 대신 안내. 다시 시도 중에는 회색 자리.
 */
export function AnnualFigure() {
  const t = useMethodMessages();
  const f = t.harmonize.figure;
  const locale = useLocale();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const landing = useLanding(country);
  const format = (value: number) => formatFireDays(value, locale);

  const tabs = (
    <CountryTabs
      label={t.countryTabs.label}
      countries={COUNTRIES}
      names={t.countryTabs}
      value={country}
      onChange={setCountry}
    />
  );

  let body;
  // 다시 시도 중에는 에러 상자 대신 회색 자리(누른 것이 받아들여졌음을 보인다)
  if (landing.isPending || (landing.isError && landing.isFetching)) {
    body = <Skeleton className="aspect-[720/330]" />;
  } else if (landing.isError) {
    body = <SectionError kind={errorKind(landing.error)} onRetry={() => void landing.refetch()} />;
  } else {
    const bars = annualBars(landing.data.annual);
    body = hasAnnualData(bars) ? (
      <AnnualLineChart
        bars={bars}
        label={f.label(t.countryTabs[country])}
        beforeLabel={f.before}
        afterLabel={f.after}
        breakMark={f.breakMark}
        yearHead={f.yearHead}
        missing={f.missing}
        format={format}
        pointTitle={f.point}
      />
    ) : (
      <p className="py-10 text-center text-sm text-muted">{f.empty}</p>
    );
  }

  return (
    <MethodFigure title={f.title} sub={f.sub} caption={f.caption(t.countryTabs[country])} note={f.note} action={tabs}>
      {body}
    </MethodFigure>
  );
}
