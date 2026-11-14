import { InsightTable } from "../../../components/insight/InsightTable";
import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { ChangeNote, MethodBullets } from "../../../components/method/MethodText";
import { WhyList } from "../../../components/method/WhyList";
import { useMethodMessages } from "../../../i18n/method";
import { DetectionFigure } from "./DetectionFigure";

/*
 * 05 검증 (`plans/method-page.md` 12-7): 요지, 지역별 검사 결과 표, 크기별 감지율 그림(나라 탭, API), 어떻게 쟀나,
 * BC 판단 보류 이유, 바뀐 과정(검증 방법), 검사의 한계. 숫자 근거는 `method-troubleshooting.md` T9(최종 노트북 ⑦·⑰).
 */
export function ValidateSection({ id }: { id: string }) {
  const v = useMethodMessages().validate;
  return (
    <MethodSection id={id} index={v.index} title={v.title} lead={v.lead}>
      <div data-reveal className="overflow-hidden rounded-xl border border-line">
        <InsightTable caption={v.resultTable.caption} head={v.resultTable.head} rows={v.resultTable.rows} variant="plain" />
      </div>
      <DetectionFigure />
      <MethodSubheading>{v.howTitle}</MethodSubheading>
      <WhyList items={v.items} />
      <ChangeNote title={v.bc.title} body={v.bc.body} />
      <ChangeNote title={v.change.title} body={v.change.body} />
      <MethodSubheading>{v.limitsTitle}</MethodSubheading>
      <MethodBullets items={v.limits} />
    </MethodSection>
  );
}
