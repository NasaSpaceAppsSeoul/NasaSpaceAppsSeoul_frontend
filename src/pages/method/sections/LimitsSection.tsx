import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { MethodBullets, MethodParagraphs } from "../../../components/method/MethodText";
import { WhyList } from "../../../components/method/WhyList";
import { useMethodMessages } from "../../../i18n/method";

/* 09 한계 (`plans/method-page.md` 12-11): 앞 절의 한계를 모은 카드 10개(2열), 시험하지 않은 선택과 맺음 문장 */
export function LimitsSection({ id }: { id: string }) {
  const l = useMethodMessages().limits;
  return (
    <MethodSection id={id} index={l.index} title={l.title} lead={l.lead}>
      <WhyList items={l.items} columns={2} />
      <MethodSubheading>{l.untestedTitle}</MethodSubheading>
      <MethodBullets items={l.untested} />
      <div className="mt-4">
        <MethodParagraphs paragraphs={[l.untestedNote]} />
      </div>
    </MethodSection>
  );
}
