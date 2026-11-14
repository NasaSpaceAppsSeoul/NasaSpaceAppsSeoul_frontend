import { Link } from "react-router-dom";
import type { Insight } from "../../../api/types";
import { SectionHeading } from "../../../components/about/SectionHeading";
import { Card } from "../../../components/Card";
import { InsightTable } from "../../../components/insight/InsightTable";
import { useLocale, useMessages } from "../../../i18n";
import { formatFireDays } from "../../../lib/format";
import { isInProgress, neighborRows } from "../../../lib/insight";
import { insightPath } from "../../../lib/insightPath";
import { regionNameById } from "../../../lib/region";
import type { InsightScope } from "../scope";

/*
 * 주변 지역 표. 첫 줄이 선택 지역, 이웃은 다시 정렬한다(G-7 9). 이웃 이름은 그 이웃의 같은 달 인사이트로 간다.
 * 이웃 응답에는 빌린 기준이 없어 "기준" 열은 지역 성격만 쓴다. 순위는 충분 지역·집계가 끝난 달만(3-1).
 */
export function NeighborsSection({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const messages = useMessages();
  const t = messages.insight.neighbors;
  const locale = useLocale();
  const labels = new Map(insight.neighbors.map((n) => [n.id, n.label_ko]));
  // 표 안에서는 이웃과 같은 규칙(다른 시·도 이웃이 섞이므로 "시·도 + 이름")으로 쓴다
  // 이웃이 목록에 없고 이름도 비어 오면 ID를 그대로 쓴다(다른 지역 이름을 빌리지 않는다)
  const nameOf = (id: string) =>
    regionNameById(id, id === scope.region.id ? scope.region.label_ko : (labels.get(id) ?? id), scope.index, locale);
  const collator = new Intl.Collator(locale === "ko" ? "ko" : "en");
  const rows = neighborRows(
    { id: scope.region.id, region_type: insight.head.region_type, value: insight.head.value },
    insight.neighbors,
    isInProgress(scope.countryStatus, insight.head.reason),
    (a, b) => collator.compare(nameOf(a), nameOf(b)),
  );

  return (
    <Card className="flex flex-col gap-6">
      <SectionHeading eyebrow={t.eyebrow} title={t.title} lead={t.lead} />
      <InsightTable
        caption={t.eyebrow}
        head={[t.region, t.basis, t.value(scope.monthName), t.note]}
        rows={rows.map((r) => ({
          key: r.id,
          highlight: r.isSelf,
          cells: [
            r.isSelf ? (
              nameOf(r.id)
            ) : (
              <Link to={insightPath(locale, scope.country, r.id, scope.month)} className="underline decoration-border underline-offset-4 hover:decoration-ink">
                {nameOf(r.id)}
              </Link>
            ),
            t.basisValue[r.basis],
            r.value === null ? "—" : formatFireDays(r.value, locale),
            r.isSelf ? t.selected : r.rank !== null ? messages.dashboard.card.rank(r.rank.n, r.rank.rank) : "",
          ],
        }))}
      />
      {rows.length === 1 && <p className="text-sm text-muted">{t.empty}</p>}
      {insight.unavailable.includes("neighbors") && <p className="text-sm text-muted">{t.partial}</p>}
    </Card>
  );
}
