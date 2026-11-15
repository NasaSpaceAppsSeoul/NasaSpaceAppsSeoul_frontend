import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { ChangeNote, MethodBullets } from "../../../components/method/MethodText";
import { StatsTable } from "../../../components/method/StatsTable";
import { WhyList } from "../../../components/method/WhyList";
import { failedOf, useAllLanding, useAllMeta } from "../../../hooks/useAllCountries";
import { useLocale } from "../../../i18n";
import { useMethodMessages } from "../../../i18n/method";
import { COUNTRIES, type Country } from "../../../lib/country";
import { corrCell, officialCell, pctCell, queryCell, satelliteCell } from "../../../lib/methodStats";
import { DetectionFigure } from "./DetectionFigure";

/*
 * 05 검증 (`plans/method-page.md` 12-7): 요지, 지역별 검사 결과 표, 크기별 감지율 그림(나라 탭, API), 어떻게 쟀나,
 * BC 판단 보류 이유, 바뀐 과정(검증 방법), 검사의 한계. 숫자 근거는 `method-troubleshooting.md` T9(최종 노트북 ⑦·⑰).
 * 결과 표의 값은 모두 서버(9장 3차): 위성끼리 단절은 `/landing` `break_test`(보정 전 `jump_raw`, 후·범위 `after`,
 * `/meta` `validation.break_test_*`와 같은 값), 나머지는 `/meta`.
 */
export function ValidateSection({ id }: { id: string }) {
  const t = useMethodMessages();
  const v = t.validate;
  const r = v.resultTable;
  const locale = useLocale();
  const { byCountry: meta, list: metas } = useAllMeta();
  const { byCountry: landing, list: landings } = useAllLanding();

  const satellite = (country: Country) =>
    queryCell(landing[country], (l) => satelliteCell(l.break_test.jump_raw, l.break_test.after, locale));
  const official = (country: Country) =>
    queryCell(meta[country], (m) => {
      const ob = m.validation.official_break;
      const text = officialCell(ob, locale);
      if (text === null || ob === null) return null;
      return `${text}${ob.inconclusive ? r.inconclusive : ""}${country === "CHL" ? r.chlOfficial : ""}`;
    });

  const line = (key: string, label: string, cell: (country: Country) => string) => ({
    key,
    cells: [label, ...COUNTRIES.map(cell)],
  });
  const rows = [
    line("satellite", r.rows.satellite, satellite),
    line("loyo", r.rows.loyo, (c) => queryCell(meta[c], (m) => pctCell(m.method_stats?.loocv_annual_error_pct, locale))),
    line("official", r.rows.official, official),
    line("rank", r.rows.rank, (c) =>
      queryCell(meta[c], (m) => corrCell([m.method_stats?.rank_corr.annual_vs_count, m.method_stats?.rank_corr.annual_vs_area], locale)),
    ),
    line("large", r.rows.large, (c) => queryCell(meta[c], (m) => corrCell([m.method_stats?.rank_corr.big_fires_vs_cells], locale))),
  ];

  return (
    <MethodSection id={id} index={v.index} title={v.title} lead={v.lead}>
      <StatsTable
        caption={r.caption}
        head={[r.head, ...COUNTRIES.map((country) => t.countryTabs[country])]}
        rows={rows}
        failed={failedOf([...metas, ...landings])}
      />
      <DetectionFigure />
      <MethodSubheading>{v.howTitle}</MethodSubheading>
      <WhyList items={v.items} />
      <ChangeNote title={v.bc.title} body={v.bc.body} />
      <ChangeNote title={v.grc.title} body={v.grc.body} />
      <ChangeNote title={v.change.title} body={v.change.body} />
      <MethodSubheading>{v.limitsTitle}</MethodSubheading>
      <MethodBullets items={v.limits} />
    </MethodSection>
  );
}
