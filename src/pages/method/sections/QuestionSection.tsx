import { MethodSection } from "../../../components/method/MethodSection";
import { WhyList } from "../../../components/method/WhyList";
import { useMethodMessages } from "../../../i18n/method";

/* 01 우리가 답하는 질문 (`plans/method-page.md` 12-2): 요지 한 줄 + 하는 것 · 하지 않는 것 · 왜 어려운가 카드. `id`는 `MethodContents`의 절 목록 */
export function QuestionSection({ id }: { id: string }) {
  const q = useMethodMessages().question;
  return (
    <MethodSection id={id} index={q.index} title={q.title} lead={q.lead}>
      <WhyList items={q.items} />
    </MethodSection>
  );
}
