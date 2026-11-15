import type { Insight } from "../../../api/types";
import { InsightFigureRow, InsightPanel, InsightSection } from "../../../components/insight/InsightSection";
import { ToneBadge } from "../../../components/Chip";
import { BarChart, type Bar } from "../../../components/insight/BarChart";
import { SectionError } from "../../../components/SectionError";
import { useLocale, useMessages } from "../../../i18n";
import { formatFireDays, formatMonthList, formatMonthName, formatMonthShort } from "../../../lib/format";
import { seasonView } from "../../../lib/insight";
import { niceMax } from "../../../lib/landing";
import { monthNumber } from "../../../lib/month";
import { regionNameById } from "../../../lib/region";
import type { InsightScope } from "../scope";

/*
 * 04 절 "계절적 맥락": 계절 막대 그림 판 (8-6). 충분 지역은 자기 월별 합계, 그 밖은 빌린 지역의 월별 합계와 "○○의 계절 패턴 참고" 배지.
 * 값은 중앙값이 아니라 합계다(G-3). 위험 시기 달은 주황, 이번 달은 아래 파란 점.
 * 위험 시기 문장의 주어는 백엔드 `risk_from`으로 정한다: 자기 지역 / 자기 시·도 / 가까운 시·도(빌린 지역).
 */
export function SeasonSection({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const t = useMessages().insight.season;
  const locale = useLocale();
  const { season } = insight;
  const view = seasonView(season, insight.head.region_type, insight.ref?.basis ?? null);
  const name = (id: string | null, fallback: string | null) =>
    id === null ? null : regionNameById(id, fallback ?? id, scope.index, locale);
  const refName = name(season.ref_id, insight.ref?.label_ko ?? null);

  if (view === null) {
    return (
      <InsightSection id="season" index="04" title={t.eyebrow} lead={t.title}>
        <SectionError kind="other" onRetry={scope.retry} />
      </InsightSection>
    );
  }

  const subject = view.borrowed ? (refName ?? scope.name) : scope.name;
  const riskName =
    view.riskFrom === "self" ? scope.name : view.riskFrom === "province" ? name(scope.region.province, null) ?? refName : refName;
  const current = monthNumber(scope.month);
  const bars: Bar[] = view.values.map((value, i) => ({
    key: String(i + 1),
    name: formatMonthShort(i + 1, locale),
    value,
    valueText: formatFireDays(value, locale),
    title: `${formatMonthName(i + 1, locale)} · ${formatFireDays(value, locale)}${i + 1 === current ? ` · ${t.current}` : ""}`,
    tone: view.riskMonths.includes(i + 1) ? "accent" : "base",
    marked: i + 1 === current,
  }));
  const period = view.period === null ? null : `${view.period[0]}–${view.period[1]}`;
  // 빌린 지역 설명과 위험 시기 문장은 한 단락(디자인)
  const notes = [
    view.borrowed && refName !== null ? t.borrowedNote(scope.name, refName) : null,
    riskName !== null && view.riskMonths.length > 0 ? t.risk(riskName, formatMonthList(view.riskMonths, locale)) : null,
  ].filter((note): note is string => note !== null);

  return (
    <InsightSection id="season" index="04" title={t.eyebrow} lead={t.title}>
      <InsightFigureRow
        figure={
          <InsightPanel>
            {view.empty ? (
              <p className="py-16 text-center text-sm text-muted">{t.empty}</p>
            ) : (
              <BarChart label={t.chartLabel} bars={bars} max={niceMax(view.values)} formatTick={(v) => formatFireDays(v, locale)} />
            )}
          </InsightPanel>
        }
        aside={
          <>
            <p className="text-base">{t.lead(subject, period)}</p>
            {view.borrowed && refName !== null && (
              <div>
                <ToneBadge tone="yellow">{t.borrowedBadge(refName)}</ToneBadge>
              </div>
            )}
            {notes.length > 0 && <p>{notes.join(" ")}</p>}
            <p className="text-xs">{t.footnote(subject)}</p>
          </>
        }
      />
    </InsightSection>
  );
}
