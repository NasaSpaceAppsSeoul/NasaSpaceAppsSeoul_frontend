import { Chip } from "../../../components/Chip";
import { InsightTable } from "../../../components/insight/InsightTable";
import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { ChangeNote, Formula, MethodBullets, MethodParagraphs } from "../../../components/method/MethodText";
import { WhyList } from "../../../components/method/WhyList";
import { useMethodMessages } from "../../../i18n/method";
import { ChipFigure } from "./ChipFigure";

/*
 * 06 판단 칩 (`plans/method-page.md` 12-8): 요지, 칩 네 개(사이트와 같은 칩 이름·색), 같은 달 연도별 그림(나라 탭, API),
 * 규칙 공식과 순서, 기준 기간 표, 왜 이 규칙인가 + 사분위 비교표, 바뀐 과정(보통 범위), 대가, 한계.
 * 숫자 근거는 `method-troubleshooting.md` T10(v3.1 4장, 최종 노트북 ⑮).
 */
const CHIPS = ["record", "above", "normal", "below"] as const;

export function ChipSection({ id }: { id: string }) {
  const c = useMethodMessages().chip;
  return (
    <MethodSection id={id} index={c.index} title={c.title} lead={c.lead}>
      <ul data-reveal aria-label={c.chipsLabel} className="flex flex-wrap gap-2.5">
        {CHIPS.map((chip) => (
          <li key={chip}>
            <Chip value={chip} />
          </li>
        ))}
      </ul>
      <ChipFigure />
      <Formula>
        {c.formula.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </Formula>
      <MethodParagraphs paragraphs={[c.orderTitle]} />
      <ol data-reveal className="mt-3 flex max-w-[44em] list-decimal flex-col gap-1.5 pl-5 text-base text-subtle marker:text-fire">
        {c.order.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ol>
      <MethodSubheading>{c.periodTitle}</MethodSubheading>
      <div data-reveal className="overflow-hidden rounded-xl border border-line">
        <InsightTable caption={c.periodTable.caption} head={c.periodTable.head} rows={c.periodTable.rows} variant="plain" />
      </div>
      <MethodSubheading>{c.whyTitle}</MethodSubheading>
      <WhyList items={c.items} />
      <div data-reveal className="mt-5 overflow-hidden rounded-xl border border-line">
        <InsightTable caption={c.compareTable.caption} head={c.compareTable.head} rows={c.compareTable.rows} variant="plain" />
      </div>
      <ChangeNote title={c.change.title} body={c.change.body} />
      <ChangeNote title={c.tradeoff.title} body={c.tradeoff.body} />
      <MethodSubheading>{c.limitsTitle}</MethodSubheading>
      <MethodBullets items={c.limits} />
    </MethodSection>
  );
}
