import type { Insight } from "../../../api/types";
import { SectionHeading } from "../../../components/about/SectionHeading";
import { ButtonLink } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { InsightTable } from "../../../components/insight/InsightTable";
import { useLocale, useMessages } from "../../../i18n";
import { dashboardPath } from "../../../lib/dashboardPath";
import { guideRows, type GuideKey } from "../../../lib/insight";
import { ownName, parentOf, regionNameById } from "../../../lib/region";
import type { InsightScope } from "../scope";

/*
 * 읽는 법 표와 아래 버튼 2개. 드문 지역 설명 세 줄은 충분 지역이 아닐 때만. 출처는 `/meta`의 `sources`.
 * 뒤 버튼은 상위 지역(한국은 시·도, CAL·BC는 나라)의 같은 달 대시보드.
 */
export function GuideSection({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const t = useMessages().insight;
  const locale = useLocale();
  const parentId = parentOf(scope.region, scope.country, scope.meta.labels.single);
  const parent = parentId === null ? undefined : scope.index.get(parentId);
  const parentName = parent === undefined ? null : ownName(parent, locale);
  const refName = insight.ref === null ? parentName : regionNameById(insight.ref.id, insight.ref.label_ko, scope.index, locale);

  const meaning = (key: GuideKey): string => {
    if (key === "sources") return scope.meta.sources.join(" · ");
    if (key === "alternative") return t.guide.rows.alternative.meaning(refName ?? "");
    return t.guide.rows[key].meaning;
  };

  return (
    <Card className="flex flex-col gap-6">
      <SectionHeading eyebrow={t.guide.eyebrow} title={t.guide.title} />
      <InsightTable
        caption={t.guide.eyebrow}
        head={[t.guide.item, t.guide.meaning]}
        variant="plain"
        fixed
        rows={guideRows(insight.head.region_type).map((key) => ({
          key,
          cells: [t.guide.rows[key].item, meaning(key)],
        }))}
      />
      <div className="flex flex-wrap gap-4">
        <ButtonLink to={dashboardPath(locale, scope.country, scope.region.id, scope.month)} variant="dark" size="lg" className="min-w-106">
          {t.buttons.dashboard(scope.name, scope.monthLabel)}
        </ButtonLink>
        {parentId !== null && parentName !== null && (
          <ButtonLink to={dashboardPath(locale, scope.country, parentId, scope.month)} size="lg" className="min-w-76">
            {t.buttons.context(parentName)}
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}
