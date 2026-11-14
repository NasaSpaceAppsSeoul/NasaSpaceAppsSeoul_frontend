import { useState } from "react";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { HeatLegend, StateLegend } from "../../../components/heatmap/HeatLegends";
import { HeatmapGrid } from "../../../components/heatmap/HeatmapGrid";
import { HeatmapHeader } from "../../../components/heatmap/HeatmapHeader";
import { YearRangeDialog } from "../../../components/heatmap/YearRangeDialog";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useBaseline } from "../../../hooks/useBaseline";
import { useSeries } from "../../../hooks/useSeries";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { formatMonth } from "../../../lib/format";
import { buildGrid, heatLegend, startYearFor, type YearMode } from "../../../lib/heatmap";
import { monthYear } from "../../../lib/month";
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
  const [yearsOpen, setYearsOpen] = useState(false);

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
  const bandFor = (m: number) => {
    const row = base.by_month.find((b) => b.month === m);
    return row !== undefined && row.band_low !== null && row.band_high !== null ? { low: row.band_low, high: row.band_high } : null;
  };

  return (
    <Card className="flex flex-col gap-6">
      <HeatmapHeader
        title={t.heatmap.title(label)}
        sub={t.heatmap.sub(t.dashboard.unit, startYear, formatMonth(last.month, locale))}
        yearLabel={district ? null : t.heatmap.yearButton(startYear, lastYear)}
        onOpenYears={() => setYearsOpen(true)}
        mockMode={mockMode}
      />
      <HeatmapGrid rows={rows} regionLabel={label} bandFor={bandFor} onSelect={navigate.toMonth} />
      <HeatLegend items={heatLegend(base.heat_bins)} />
      <StateLegend />
      <YearRangeDialog
        open={yearsOpen}
        onClose={() => setYearsOpen(false)}
        firstYear={firstYear}
        lastYear={lastYear}
        mode={mode}
        onPick={(next) => {
          setMode(next);
          setYearsOpen(false);
        }}
      />
    </Card>
  );
}
