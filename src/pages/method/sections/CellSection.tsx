import { InsightTable } from "../../../components/insight/InsightTable";
import { CellIllustration } from "../../../components/method/CellIllustration";
import { MethodFigure } from "../../../components/method/MethodFigure";
import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { ChangeNote, MethodParagraphs } from "../../../components/method/MethodText";
import { StatsTable } from "../../../components/method/StatsTable";
import { WhyList } from "../../../components/method/WhyList";
import { failedOf, useAllMeta } from "../../../hooks/useAllCountries";
import { useLocale } from "../../../i18n";
import { useMethodMessages } from "../../../i18n/method";
import { COUNTRIES } from "../../../lib/country";
import { gridCell, queryCell } from "../../../lib/methodStats";

/*
 * 03 화재 칸 (`plans/method-page.md` 12-5): 요지, 설명용 칸 그림(고정), 왜 칸을 세나, 칸 크기 비교표와 그 한계,
 * 거르는 규칙 표, 바뀐 과정(고정 열원 마스크). 숫자 근거는 `method-troubleshooting.md` T1·T2·T3·T13.
 * 칸 크기 표의 값은 여섯 지역 `/meta` `method_stats.grid_sensitivity`(9장 3차).
 */
export function CellSection({ id }: { id: string }) {
  const t = useMethodMessages();
  const c = t.cell;
  const locale = useLocale();
  const { byCountry: meta, list: metas } = useAllMeta();
  const gridRows = c.gridTable.rows.map((row) => ({
    key: row.key,
    highlight: row.highlight,
    cells: [
      row.label,
      ...COUNTRIES.map((country) => queryCell(meta[country], (m) => gridCell(m.method_stats?.grid_sensitivity, row.degree, locale))),
    ],
  }));
  return (
    <MethodSection id={id} index={c.index} title={c.title} lead={c.lead}>
      <MethodFigure title={c.figure.title} sub={c.figure.sub} caption={c.figure.caption}>
        <CellIllustration modis={c.figure.modis} viirs={c.figure.viirs} />
      </MethodFigure>
      <MethodSubheading>{c.whyTitle}</MethodSubheading>
      <WhyList items={c.items} />
      <MethodSubheading>{c.gridTitle}</MethodSubheading>
      <MethodParagraphs paragraphs={[c.gridLead]} />
      <div className="my-5">
        <StatsTable
          caption={c.gridTable.caption}
          head={[c.gridTable.head, ...COUNTRIES.map((country) => t.countryTabs[country])]}
          rows={gridRows}
          failed={failedOf(metas)}
        />
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
