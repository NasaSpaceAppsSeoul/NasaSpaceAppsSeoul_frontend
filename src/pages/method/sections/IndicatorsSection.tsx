import { InsightTable } from "../../../components/insight/InsightTable";
import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { ChangeNote, MethodBullets } from "../../../components/method/MethodText";
import { useMethodMessages } from "../../../i18n/method";

/*
 * 08 나머지 지표 (`plans/method-page.md` 12-10): 지표 표(계산·이유), 기준값 민감도 표, 바뀐 과정(v3.0 → v3.1 지표 정의), 한계.
 * 정의는 v3.1 5~7장과 백엔드(`ytd_ratio` 등) 기준. 숫자 근거는 `method-troubleshooting.md` T12.
 */
export function IndicatorsSection({ id }: { id: string }) {
  const d = useMethodMessages().indicators;
  return (
    <MethodSection id={id} index={d.index} title={d.title} lead={d.lead}>
      <div data-reveal className="overflow-hidden rounded-xl border border-line">
        <InsightTable caption={d.table.caption} head={d.table.head} rows={d.table.rows} variant="plain" />
      </div>
      <MethodSubheading>{d.sensitivityTitle}</MethodSubheading>
      <div data-reveal className="overflow-hidden rounded-xl border border-line">
        <InsightTable caption={d.sensitivityTable.caption} head={d.sensitivityTable.head} rows={d.sensitivityTable.rows} variant="plain" />
      </div>
      <ChangeNote title={d.change.title} body={d.change.body} items={d.changes} />
      <MethodSubheading>{d.limitsTitle}</MethodSubheading>
      <MethodBullets items={d.limits} />
    </MethodSection>
  );
}
