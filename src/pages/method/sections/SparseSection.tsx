import { InsightTable } from "../../../components/insight/InsightTable";
import { BorrowFlow } from "../../../components/method/BorrowFlow";
import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { ChangeNote, Formula, MethodBullets, MethodParagraphs } from "../../../components/method/MethodText";
import { WhyList } from "../../../components/method/WhyList";
import { useMethodMessages } from "../../../i18n/method";

/*
 * 07 불이 드문 구역 (`plans/method-page.md` 12-9): 11.1 공식, 판정을 빌리는 순서, 현황 표, 충분 6곳, 왜 30%(관례·기준별 표),
 * 최대 해 제외·감지를 숨기지 않음·25년 합계 예외, 바뀐 과정(자체 판정 기준), 한계. 숫자 근거는 `method-troubleshooting.md` T11.
 * CAL·BC 현황은 시안 팀 출력값이라 9장에서 서버로 대조한다.
 */
export function SparseSection({ id }: { id: string }) {
  const s = useMethodMessages().sparse;
  return (
    <MethodSection id={id} index={s.index} title={s.title} lead={s.lead}>
      <Formula>{s.formula}</Formula>
      <MethodParagraphs paragraphs={s.intro} />
      <BorrowFlow steps={s.flow} label={s.flowLabel} />
      <MethodParagraphs paragraphs={[s.flowNote]} />
      <div data-reveal className="mt-5 mb-4 overflow-hidden rounded-xl border border-line">
        <InsightTable caption={s.statusTable.caption} head={s.statusTable.head} rows={s.statusTable.rows} variant="plain" />
      </div>
      <MethodParagraphs paragraphs={s.sufficient} />
      <MethodSubheading>{s.whyTitle}</MethodSubheading>
      <WhyList items={s.items} />
      <div data-reveal className="mt-5 overflow-hidden rounded-xl border border-line">
        <InsightTable caption={s.thresholdTable.caption} head={s.thresholdTable.head} rows={s.thresholdTable.rows} variant="plain" />
      </div>
      <div className="mt-7">
        <WhyList items={s.notes} />
      </div>
      <ChangeNote title={s.change.title} body={s.change.body} />
      <MethodSubheading>{s.limitsTitle}</MethodSubheading>
      <MethodBullets items={s.limits} />
    </MethodSection>
  );
}
