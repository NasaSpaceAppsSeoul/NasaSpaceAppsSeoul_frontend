import type { MethodStats } from "../../../api/types";
import { InsightTable } from "../../../components/insight/InsightTable";
import { ChainSteps } from "../../../components/method/ChainSteps";
import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { ChangeNote, Formula, MethodBullets } from "../../../components/method/MethodText";
import { StatsTable } from "../../../components/method/StatsTable";
import { WhyList } from "../../../components/method/WhyList";
import { failedOf, useAllMeta } from "../../../hooks/useAllCountries";
import { useLocale } from "../../../i18n";
import { useMethodMessages } from "../../../i18n/method";
import { COUNTRIES } from "../../../lib/country";
import { pctCell, queryCell } from "../../../lib/methodStats";
import { AnnualFigure } from "./AnnualFigure";

/*
 * 04 센서 맞추기 (`plans/method-page.md` 12-6): 요지, 연간 보정 전·후 그림(나라 탭, API), 보정 사슬, 계수 공식과 오차 표,
 * 왜 이렇게 했나, 바뀐 과정(낮과 밤), 배제한 대안 표, 남은 한계. 숫자 근거는 `method-troubleshooting.md` T4~T8(최종 노트북).
 * 계수 표의 연간 오차는 여섯 지역 `/meta` `method_stats`(9장 3차).
 */

/** 계수 표 한 줄의 값: k_MS는 한 해씩 빼고 맞힌 오차, 나머지는 계수별 오차 */
// 서버가 dfea737 전 빌드면 `method_stats` 키가 없다(undefined) → 칸은 "—"(페이지가 깨지지 않게)
function coefError(stats: MethodStats | null | undefined, stat: "loocv" | keyof MethodStats["calibration_error_pct"]): number | null {
  if (stats === null || stats === undefined) return null;
  return stat === "loocv" ? stats.loocv_annual_error_pct : (stats.calibration_error_pct?.[stat] ?? null);
}

export function HarmonizeSection({ id }: { id: string }) {
  const t = useMethodMessages();
  const h = t.harmonize;
  const locale = useLocale();
  const { byCountry: meta, list: metas } = useAllMeta();
  const coefRows = h.coefTable.rows.map((row) => ({
    key: row.key,
    cells: [
      row.label,
      row.overlap,
      ...COUNTRIES.map((country) => queryCell(meta[country], (m) => pctCell(coefError(m.method_stats, row.stat), locale))),
    ],
  }));
  return (
    <MethodSection id={id} index={h.index} title={h.title} lead={h.lead}>
      <AnnualFigure />
      <MethodSubheading>{h.chainTitle}</MethodSubheading>
      <ChainSteps steps={h.chain} label={h.chainLabel} />
      <Formula note={h.formulaNote}>{h.formula}</Formula>
      <StatsTable
        caption={h.coefTable.caption}
        head={[...h.coefTable.head, ...COUNTRIES.map((country) => t.countryTabs[country])]}
        rows={coefRows}
        failed={failedOf(metas)}
      />
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
