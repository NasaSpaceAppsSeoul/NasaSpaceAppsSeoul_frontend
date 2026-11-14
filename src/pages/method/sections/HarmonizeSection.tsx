import { InsightTable } from "../../../components/insight/InsightTable";
import { ChainSteps } from "../../../components/method/ChainSteps";
import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { ChangeNote, Formula, MethodBullets } from "../../../components/method/MethodText";
import { WhyList } from "../../../components/method/WhyList";
import { useMethodMessages } from "../../../i18n/method";
import { AnnualFigure } from "./AnnualFigure";

/*
 * 04 센서 맞추기 (`plans/method-page.md` 12-6): 요지, 연간 보정 전·후 그림(나라 탭, API), 보정 사슬, 계수 공식과 오차 표,
 * 왜 이렇게 했나, 바뀐 과정(낮과 밤), 배제한 대안 표, 남은 한계. 숫자 근거는 `method-troubleshooting.md` T4~T8(최종 노트북).
 */
export function HarmonizeSection({ id }: { id: string }) {
  const h = useMethodMessages().harmonize;
  return (
    <MethodSection id={id} index={h.index} title={h.title} lead={h.lead}>
      <AnnualFigure />
      <MethodSubheading>{h.chainTitle}</MethodSubheading>
      <ChainSteps steps={h.chain} label={h.chainLabel} />
      <Formula note={h.formulaNote}>{h.formula}</Formula>
      <div data-reveal className="overflow-hidden rounded-xl border border-line">
        <InsightTable caption={h.coefTable.caption} head={h.coefTable.head} rows={h.coefTable.rows} variant="plain" />
      </div>
      <MethodSubheading>{h.whyTitle}</MethodSubheading>
      <WhyList items={h.items} />
      <ChangeNote title={h.change.title} body={h.change.body} />
      <MethodSubheading>{h.excludedTitle}</MethodSubheading>
      <div data-reveal className="overflow-hidden rounded-xl border border-line">
        <InsightTable caption={h.excludedTable.caption} head={h.excludedTable.head} rows={h.excludedTable.rows} variant="plain" />
      </div>
      <MethodSubheading>{h.limitsTitle}</MethodSubheading>
      <MethodBullets items={h.limits} />
    </MethodSection>
  );
}
