import { useState } from "react";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { HeatLegend, StateLegend } from "../../../components/heatmap/HeatLegends";
import { HeatmapGrid } from "../../../components/heatmap/HeatmapGrid";
import { HeatmapHeader } from "../../../components/heatmap/HeatmapHeader";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useBaseline } from "../../../hooks/useBaseline";
import { useSeries } from "../../../hooks/useSeries";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { buildGrid, heatLegend, startYearFor, type YearMode } from "../../../lib/heatmap";
import { formatDayDate, formatFireDays, formatMonth } from "../../../lib/format";
import { isLastDayOfMonth, monthYear } from "../../../lib/month";
import { regionName } from "../../../lib/region";
import type { ControlsDialog, DashboardNavigate, DashboardScope } from "../scope";

/*
 * 연도별·월별 화재 달력 (3장). `/series`(그 지역 전체)와 `/baseline`을 함께 기다린다.
 * 화면이 `key={region.id}`로 그려서 지역이 바뀌면 표시 연도가 기본으로 돌아간다.
 */
type HeatmapSectionProps = {
  scope: DashboardScope;
  navigate: DashboardNavigate;
  openDialog: (dialog: ControlsDialog) => void;
  mockMode: boolean;
};

export function HeatmapSection({ scope, navigate, openDialog, mockMode }: HeatmapSectionProps) {
  const t = useMessages();
  const locale = useLocale();
  const { country, region, index } = scope;
  const series = useSeries(country, region.id);
  const baseline = useBaseline(country, region.id);
  const [mode, setMode] = useState<YearMode>("all");

  // 처음부터 받지 못했으면 그 구역 에러와 다시 시도(실패한 것만). 같은 나라 시계열을 쓰는 화면 본체(`DashboardBody`)와
  // 같게, 받아 둔 자료가 있으면 다시 받다 실패해도 그 자료로 계속 그린다
  const failed = [series, baseline].filter((query) => query.isError && query.data === undefined);
  const firstFailed = failed[0];
  if (firstFailed !== undefined) {
    const kind = errorKind(firstFailed.error);
    const action =
      kind === "region" ? (
        <Button size="sm" onClick={() => openDialog("search")}>
          {t.errors.openRegionPicker}
        </Button>
      ) : undefined;
    return <SectionError kind={kind} onRetry={() => failed.forEach((query) => void query.refetch())} action={action} />;
  }
  const months = series.data?.months;
  const base = baseline.data;
  const first = months?.[0];
  const last = months?.[months.length - 1];
  if (base === undefined || months === undefined) return <Skeleton className="h-96" />;
  // 시계열이 비었다(백엔드는 보통 2001-01부터 줄을 주므로 드물다): 자리 표시 대신 이유를 보인다
  if (first === undefined || last === undefined) {
    return (
      <Card>
        <p className="text-sm text-muted">{t.heatmap.empty}</p>
      </Card>
    );
  }

  const district = region.level === "dist";
  const firstYear = monthYear(first.month);
  const lastYear = monthYear(last.month);
  const startYear = startYearFor(mode, firstYear, district ? base.period[0] : null);
  const rows = buildGrid({ months, bins: base.heat_bins, startYear, selected: scope.month, clickRange: scope.range });
  const label = regionName(region, index, locale);
  // 선택한 달 줄: 그 달 값과 집계 중 여부(칸 상태와 같은 기준 `status === "partial"`). 표시 연도 밖이어도 보인다
  const selectedRow = months.find((m) => m.month === scope.month);
  const selectedValue = selectedRow?.value ?? null;
  const selectedCollecting = selectedRow?.status === "partial";
  // 각주의 집계 중 문장: 자료 마지막 날(`data_end`)이 달 중간이면 그 달은 아직 모으는 중(머리 자료 카드와 같은 기준)
  const dataEnd = scope.meta.data_end;
  const collecting =
    dataEnd === null || isLastDayOfMonth(dataEnd)
      ? null
      : { month: formatMonth(dataEnd.slice(0, 7), locale), day: Number(dataEnd.slice(8, 10)), date: formatDayDate(dataEnd, locale) };
  const bandFor = (m: number) => {
    const row = base.by_month.find((b) => b.month === m);
    return row !== undefined && row.band_low !== null && row.band_high !== null ? { low: row.band_low, high: row.band_high } : null;
  };

  return (
    // 시안 `.db-calendar`: 안쪽 32
    <Card className="flex flex-col p-8">
      <HeatmapHeader
        sub={t.heatmap.sub(startYear, lastYear, label)}
        yearMode={district ? null : mode}
        onYearMode={setMode}
        mockMode={mockMode}
      />
      <HeatmapGrid rows={rows} regionLabel={label} bandFor={bandFor} onSelect={navigate.toMonth} />
      {/* 시안 `.db-calendar-selection`: 위아래 선, 위아래 16, 12px. 이름표 Mono 9, 달 이름은 굵게, 값은 오른쪽 끝 */}
      <p aria-live="polite" className="mt-6 flex flex-wrap items-center gap-4 border-y border-line py-4 text-xs text-[#bec5ce]">
        <span className="mono-tag text-[9px] text-[#9ba5b3]">{t.heatmap.selection.label}</span>
        <strong className="font-medium text-[#f0f1f3]">{formatMonth(scope.month, locale)}</strong>
        {/* 값이 없으면 칸 상태 순서(값 없음이 먼저)대로 "관측 자료 없음"만 */}
        <span className="ml-auto">
          {selectedValue === null
            ? t.heatmap.states.noData.title
            : t.heatmap.selection.detail(formatFireDays(selectedValue, locale), t.dashboard.unit, t.heatmap.harmonized, selectedCollecting)}
        </span>
      </p>
      <div className="mt-6 flex flex-col gap-6">
        <HeatLegend items={heatLegend(base.heat_bins)} />
        <StateLegend />
      </div>
      {/* 시안 `.db-panel-footnote`: 11px, 줄 높이 1.6, 위 16 */}
      <p className="mt-4 text-[11px] leading-[1.6] text-[#8e99aa]">{t.heatmap.footnote(collecting)}</p>
    </Card>
  );
}
