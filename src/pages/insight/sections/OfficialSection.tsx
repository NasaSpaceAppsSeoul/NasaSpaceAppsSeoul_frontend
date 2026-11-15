import type { ReactNode } from "react";
import type { Insight } from "../../../api/types";
import { InsightSection } from "../../../components/insight/InsightSection";
import { InsightTable } from "../../../components/insight/InsightTable";
import { SectionError } from "../../../components/SectionError";
import { useLocale, useMessages } from "../../../i18n";
import { formatCount, formatFireDays, formatMonth } from "../../../lib/format";
import { detectRateLine, officialRows, SMALL_AREA_HA } from "../../../lib/insight";
import type { InsightScope } from "../scope";

/*
 * 03 절 "공식 기록 대조"(판 없음): 공식 기록 표와 감지율 한 줄 (8-4, F-5). 면적 0은 빈칸, 0.1 ha 미만은 "0.1 미만"(반올림하면 0으로 보여서),
 * 원인은 받은 그대로(영문 화면도, F-5 4).
 * 강조 줄은 첫 줄(면적이 가장 큰 기록). 감지율은 기록이 없어 `rate`가 `null`이면 상자를 그리지 않는다.
 */
export function OfficialSection({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const t = useMessages().insight.official;
  const locale = useLocale();
  const section = (children: ReactNode) => (
    <InsightSection id="official" index="03" title={t.eyebrow} lead={t.title} note={t.lead(scope.meta.labels.official)}>
      {children}
    </InsightSection>
  );
  if (insight.official === null) return section(<SectionError kind="other" onRetry={scope.retry} />);
  const rows = officialRows(insight.official);
  const rate = detectRateLine(insight.detect_rate);

  return section(
    <>
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t.empty}</p>
      ) : (
        <InsightTable
          framed
          caption={t.eyebrow}
          head={[t.date, t.place, t.cause, t.area]}
          rows={rows.map((r, i) => ({
            key: r.key,
            highlight: i === 0,
            cells: [r.date, r.place, r.cause, r.area === null ? "" : r.area < SMALL_AREA_HA ? t.areaSmall : formatFireDays(r.area, locale)],
          }))}
        />
      )}
      {rate !== null && (
        <p className="text-sm text-muted">
          {t.rate(formatMonth(rate.since, locale), formatCount(rate.n, locale), formatCount(rate.detected, locale), rate.windowDays, rate.percent)}
        </p>
      )}
    </>,
  );
}
