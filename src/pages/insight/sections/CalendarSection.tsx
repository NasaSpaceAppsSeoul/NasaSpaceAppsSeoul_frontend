import type { ReactNode } from "react";
import type { Insight } from "../../../api/types";
import { InsightPanel, InsightSection } from "../../../components/insight/InsightSection";
import { DayCalendar, DayLegend } from "../../../components/insight/DayCalendar";
import { InsightTable } from "../../../components/insight/InsightTable";
import { SectionError } from "../../../components/SectionError";
import { useLocale, useMessages } from "../../../i18n";
import { formatCount, formatDayDate, formatDayRange } from "../../../lib/format";
import { calendarCells, calendarSummary, dayDate, isInProgress, type DayCell } from "../../../lib/insight";
import type { InsightScope } from "../scope";

/*
 * 일별 달력과 요약 줄. 숫자는 그날 감지된 화재 칸 수(화재 감지일과 다른 숫자, G-7 7).
 * 2012-02 전은 값이 없어도 MODIS 점이 들어오므로 그 사실을 한 줄 붙인다(G-7 4).
 */
export function CalendarSection({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const t = useMessages().insight;
  const locale = useLocale();
  const { calendar, head } = insight;
  const section = (children: ReactNode, note?: ReactNode) => (
    <InsightSection first id="calendar" index="01" title={t.calendar.eyebrow} lead={t.calendar.title(scope.monthName)} note={note}>
      {children}
    </InsightSection>
  );
  if (calendar === null) return section(<SectionError kind="other" onRetry={scope.retry} />);

  const cluster = calendar.main_cluster;
  const { leading, cells } = calendarCells({
    month: scope.month,
    daily: calendar.daily,
    cluster,
    dmaxDate: head.dmax_date,
    official: insight.official ?? [],
    inProgress: isInProgress(scope.countryStatus, head.reason),
    dataEnd: scope.meta.data_end,
  });
  const dateOf = (day: number) => formatDayDate(dayDate(scope.month, day), locale);
  const cellsText = (n: number) => t.tiles.cells(formatCount(n, locale));
  const label = (cell: DayCell) =>
    [
      dateOf(cell.day),
      cell.future ? t.calendar.future : cellsText(cell.value),
      cell.isPeak ? t.calendar.peak : null,
      cell.inCluster ? t.calendar.inCluster : null,
      cell.official,
    ]
      .filter((part): part is string => part !== null)
      .join(" · ");

  const s = calendarSummary(scope.month, head, calendar);
  const dayAndCells = (v: { date: string; cells: number } | null) =>
    v === null ? "—" : `${formatDayDate(v.date, locale)} · ${cellsText(v.cells)}`;
  const summary = [
    s.fireDays === null ? "—" : t.calendar.days(s.fireDays),
    dayAndCells(s.peak),
    s.clusters.kind === "events" ? t.calendar.clusterValue.events(s.clusters.events, s.clusters.big) : t.calendar.clusterValue[s.clusters.kind],
    dayAndCells(s.near50),
  ];

  // 밑줄이 하나도 없으면(묶음 없음, 묶음 기간에 이 지역 감지 없음) 밑줄 설명을 뺀다
  const underlined = cells.some((cell) => cell.inCluster);

  return section(
    <>
      {head.reason === "PRE_2012_DISTRICT" && <p className="text-sm text-muted">{t.calendar.modis}</p>}
      <InsightPanel>
        <DayCalendar
          leading={leading}
          cells={cells}
          weekdays={t.calendar.weekdays}
          valueText={(cell) => cellsText(cell.value)}
          label={label}
          peakText={t.calendar.peak}
          futureText={t.calendar.future}
        />
        <DayLegend note={underlined ? t.calendar.legendNote : t.calendar.legendNoteBasic} />
      </InsightPanel>
      <InsightTable
          framed
        caption={t.calendar.eyebrow}
        head={[t.calendar.summary.fireDays, t.calendar.summary.peak, t.calendar.summary.clusters, t.calendar.summary.near50]}
        rows={[{ key: "summary", cells: summary }]}
        variant="plain"
        fixed
        alignRight={[1, 2, 3]}
      />
    </>,
    cluster === null || !underlined ? t.calendar.lead : t.calendar.leadCluster(formatDayRange(cluster.start, cluster.end, locale)),
  );
}
