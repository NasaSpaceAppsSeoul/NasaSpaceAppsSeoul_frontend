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
import { formatFireDays } from "../../../lib/format";
import { detectRows } from "../../../lib/landing";

/*
 * 05절 그림: 고른 나라의 `/landing` `detect_by_size`(크기별 감지율·우연 기준) (`plans/method-page.md` 12-7).
 * 단계 이름은 백엔드가 한국어 다섯 이름으로 보내므로 공용 문구의 이름 표로 옮기고, 표에 없는 이름은 받은 그대로(8-3, H-5).
 * 나라 탭·로딩·실패·다시 시도는 04절 그림과 같다. 숫자는 숨긴 표로도 둔다.
 */
export function DetectionFigure() {
  const t = useMethodMessages();
  const f = t.validate.figure;
  const binNames = useMessages().about.detection.bins;
  const locale = useLocale();
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const landing = useLanding(country);
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const count = (n: number) => f.count(formatFireDays(n, locale));

  let body;
  if (landing.isPending || (landing.isError && landing.isFetching)) {
    body = <Skeleton className="aspect-[720/250]" />;
  } else if (landing.isError) {
    body = <SectionError kind={errorKind(landing.error)} onRetry={() => void landing.refetch()} />;
  } else if (landing.data.detect_by_size.length === 0) {
    body = <p className="py-10 text-center text-sm text-muted">{f.empty}</p>;
  } else {
    const items = landing.data.detect_by_size;
    const rows = detectRows(items, binNames).map((row, i) => ({ ...row, n: items[i]?.n ?? 0 }));
    const show = (value: number | null) => (value === null ? "—" : percent(value));
    body = (
      <>
        <DetectionChart rows={rows} label={f.label(t.countryTabs[country])} percent={percent} count={count} rowTitle={f.row} />
        <FigureDataTable
          caption={f.label(t.countryTabs[country])}
          head={[f.binHead, f.detectedHead, f.chanceHead, f.countHead]}
          rows={rows.map((row) => ({ key: row.bin, cells: [row.label, show(row.detected), show(row.chance), count(row.n)] }))}
        />
      </>
    );
  }

  return (
    <MethodFigure
      title={f.title}
      sub={f.sub}
      caption={f.caption(t.countryTabs[country])}
      note={f.note}
      action={
        <CountryTabs label={t.countryTabs.label} countries={COUNTRIES} names={t.countryTabs} value={country} onChange={setCountry} />
      }
    >
      {body}
    </MethodFigure>
  );
}
