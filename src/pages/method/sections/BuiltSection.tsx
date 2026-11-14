import { InsightTable } from "../../../components/insight/InsightTable";
import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { StepList } from "../../../components/method/StepList";
import { WhyList } from "../../../components/method/WhyList";
import { useMethodMessages } from "../../../i18n/method";

/*
 * 10 만든 방법과 배운 것 (`plans/method-page.md` 12-12, 팀 인사이트 B안): 기술 표, 새 지역 추가 다섯 단계,
 * 만들며 내린 판단 카드. 기술 표의 판·버전은 백엔드 README·`common/build.gradle`로 확인한 것만 적는다.
 */
export function BuiltSection({ id }: { id: string }) {
  const b = useMethodMessages().built;
  return (
    <MethodSection id={id} index={b.index} title={b.title} lead={b.lead}>
      <div data-reveal className="overflow-hidden rounded-xl border border-line">
        <InsightTable caption={b.table.caption} head={b.table.head} rows={b.table.rows} variant="plain" />
      </div>
      <MethodSubheading>{b.stepsTitle}</MethodSubheading>
      <StepList steps={b.steps} label={b.stepsLabel} />
      <MethodSubheading>{b.lessonsTitle}</MethodSubheading>
      <WhyList items={b.lessons} />
    </MethodSection>
  );
}
