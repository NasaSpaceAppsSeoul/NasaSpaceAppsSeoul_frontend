import { InsightTable } from "../../../components/insight/InsightTable";
import { CellIllustration } from "../../../components/method/CellIllustration";
import { MethodFigure } from "../../../components/method/MethodFigure";
import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { ChangeNote, MethodParagraphs } from "../../../components/method/MethodText";
import { WhyList } from "../../../components/method/WhyList";
import { useMethodMessages } from "../../../i18n/method";

/*
 * 03 화재 칸 (`plans/method-page.md` 12-5): 요지, 설명용 칸 그림(고정), 왜 칸을 세나, 칸 크기 비교표와 그 한계,
 * 거르는 규칙 표, 바뀐 과정(고정 열원 마스크). 숫자 근거는 `method-troubleshooting.md` T1·T2·T3·T13.
 */
export function CellSection({ id }: { id: string }) {
  const c = useMethodMessages().cell;
  return (
    <MethodSection id={id} index={c.index} title={c.title} lead={c.lead}>
      <MethodFigure title={c.figure.title} sub={c.figure.sub} caption={c.figure.caption}>
        <CellIllustration modis={c.figure.modis} viirs={c.figure.viirs} />
      </MethodFigure>
      <MethodSubheading>{c.whyTitle}</MethodSubheading>
      <WhyList items={c.items} />
      <MethodSubheading>{c.gridTitle}</MethodSubheading>
      <MethodParagraphs paragraphs={[c.gridLead]} />
      <div data-reveal className="my-5 overflow-hidden rounded-xl border border-line">
        <InsightTable caption={c.gridTable.caption} head={c.gridTable.head} rows={c.gridTable.rows} variant="plain" />
      </div>
      <MethodParagraphs paragraphs={c.gridBody} />
      <MethodSubheading>{c.filterTitle}</MethodSubheading>
      <div data-reveal className="overflow-hidden rounded-xl border border-line">
        <InsightTable caption={c.filterTable.caption} head={c.filterTable.head} rows={c.filterTable.rows} variant="plain" />
      </div>
      <ChangeNote title={c.change.title} body={c.change.body} />
    </MethodSection>
  );
}
