import { useState } from "react";
import { CountryTabs } from "../../../components/method/CountryTabs";
import { DetectionChart } from "../../../components/method/DetectionChart";
import { FigureDataTable } from "../../../components/method/FigureDataTable";
import { MethodFigure } from "../../../components/method/MethodFigure";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useLanding } from "../../../hooks/useLanding";
import { useLocale, useMessages } from "../../../i18n";
import { useMethodMessages } from "../../../i18n/method";
import { COUNTRIES, DEFAULT_COUNTRY, type Country } from "../../../lib/country";
import { errorKind } from "../../../lib/errorKind";
import { formatCount, formatPercent } from "../../../lib/format";
import { detectRows } from "../../../lib/landing";

/*
 * 05절 그림: 고른 나라의 `/landing` `detect_by_size`(크기별 감지율·우연 기준) (`plans/method-page.md` 12-7).
 * 단계 이름은 백엔드가 한국어 다섯 이름으로 보내므로 공용 문구의 이름 표로 옮기고, 표에 없는 이름은 받은 그대로(8-3, H-5).
 * 나라 탭·로딩·실패·다시 시도는 04절 그림과 같다. 숫자는 숨긴 표로도 둔다.
 */

/** 서버가 보내는 가장 큰 구간 이름(백엔드 `LandingService` 구간 순서의 마지막) */
const LARGE_BIN = "100 ha 이상";
export function DetectionFigure() {
  const t = useMethodMessages();
  const f = t.validate.figure;
  const binNames = useMessages().about.detection.bins;
  const locale = useLocale();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const landing = useLanding(country);
  const percent = (value: number | null) => formatPercent(value, locale);
  const count = (n: number | null) => (n === null ? "—" : f.count(formatCount(n, locale)));

  let body;
  if (landing.isPending || (landing.isError && landing.isFetching)) {
    body = <Skeleton className="aspect-[720/250]" />;
  } else if (landing.isError) {
    body = <SectionError kind={errorKind(landing.error)} onRetry={() => void landing.refetch()} />;
  } else if (landing.data.detect_by_size.length === 0) {
    body = <p className="py-10 text-center text-sm text-muted">{f.empty}</p>;
  } else {
    // 칠레: CONAF 공식 기록은 200 ha 이상만 있다. 서버 구간 이름 "100 ha 이상"을 화면에서만 "200 ha 이상"으로,
    // 0건인 작은 불 칸은 "공식 기록 없음"으로 보인다(9장 2차, 사용자). 다른 나라는 그대로
    const chile = country === "CHL";
    const rows = detectRows(landing.data.detect_by_size, binNames).map((row) =>
      chile && row.bin === LARGE_BIN ? { ...row, label: f.chlLargeBin } : row,
    );
    const noRecord = (n: number | null) => chile && n === 0;
    body = (
      <>
        <DetectionChart
          key={country}
          rows={rows}
          label={f.label(t.countryTabs[country])}
          noRecord={chile ? f.noRecord : undefined}
          percent={percent}
          count={count}
          rowTitle={f.row}
        />
        <FigureDataTable
          caption={f.label(t.countryTabs[country])}
          head={[f.binHead, f.detectedHead, f.chanceHead, f.countHead]}
          rows={rows.map((row) => ({
            key: row.bin,
            cells: noRecord(row.n)
              ? [row.label, f.noRecord, "—", "—"]
              : [row.label, percent(row.detected), percent(row.chance), count(row.n)],
          }))}
        />
      </>
    );
  }

  return (
    <MethodFigure
      title={f.title}
      sub={f.sub}
      caption={f.caption(t.countryTabs[country])}
      note={country === "CHL" ? `${f.note} ${f.noteChl}` : f.note}
      action={
        <CountryTabs label={t.countryTabs.label} countries={COUNTRIES} names={t.countryTabs} value={country} onChange={setCountry} />
      }
    >
      {body}
    </MethodFigure>
  );
}
