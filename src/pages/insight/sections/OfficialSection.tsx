import type { Insight } from "../../../api/types";
import { SectionHeading } from "../../../components/about/SectionHeading";
import { Card } from "../../../components/Card";
import { InsightTable } from "../../../components/insight/InsightTable";
import { SectionError } from "../../../components/SectionError";
import { useLocale, useMessages } from "../../../i18n";
import { formatCount, formatFireDays, formatMonth } from "../../../lib/format";
import { detectRateLine, officialRows } from "../../../lib/insight";
import type { InsightScope } from "../scope";

/*
 * 공식 기록 표와 감지율 상자 (8-4, F-5). 면적 0은 빈칸, 원인은 받은 그대로(영문 화면도, F-5 4).
 * 강조 줄은 첫 줄(면적이 가장 큰 기록). 감지율은 기록이 없어 `rate`가 `null`이면 상자를 그리지 않는다.
 */
export function OfficialSection({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const t = useMessages().insight.official;
  const locale = useLocale();
  const heading = <SectionHeading eyebrow={t.eyebrow} title={t.title} lead={t.lead(scope.meta.labels.official)} />;
  if (insight.official === null) {
    return (
      <Card className="flex flex-col gap-6">
        {heading}
        <SectionError kind="other" onRetry={scope.retry} />
      </Card>
    );
  }
  const rows = officialRows(insight.official);
  const rate = detectRateLine(insight.detect_rate);

  return (
    <Card className="flex flex-col gap-6">
      {heading}
      {rows.length === 0 ? (
        <p className="text-sm text-muted">{t.empty}</p>
      ) : (
        <InsightTable
          caption={t.eyebrow}
          head={[t.date, t.place, t.cause, t.area]}
          rows={rows.map((r, i) => ({
            key: r.key,
            highlight: i === 0,
            cells: [r.date, r.place, r.cause, r.area === null ? "" : formatFireDays(r.area, locale)],
          }))}
        />
      )}
      {rate !== null && (
        <p className="rounded-card bg-page px-6 py-4 text-sm text-muted">
          {t.rate(formatMonth(rate.since, locale), formatCount(rate.n, locale), formatCount(rate.detected, locale), rate.windowDays, rate.percent)}
        </p>
      )}
    </Card>
  );
}
