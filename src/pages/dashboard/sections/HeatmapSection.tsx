import { useState } from "react";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { renderCalendarPng } from "../../../components/heatmap/calendarPng";
import { ExportDialog } from "../../../components/heatmap/ExportDialog";
import { HeatLegend, legendLabel, StateLegend } from "../../../components/heatmap/HeatLegends";
import { HeatmapGrid } from "../../../components/heatmap/HeatmapGrid";
import { HeatmapHeader } from "../../../components/heatmap/HeatmapHeader";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useBaseline } from "../../../hooks/useBaseline";
import { useCsvDownload } from "../../../hooks/useCsvDownload";
import { useSeries } from "../../../hooks/useSeries";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { basisValue, buildGrid, hasRawValues, heatLegend, startYearFor, type Basis, type YearMode } from "../../../lib/heatmap";
import { formatDayDate, formatFireDays, formatFullDate, formatMonth } from "../../../lib/format";
import { isLastDayOfMonth, monthYear } from "../../../lib/month";
import { regionName } from "../../../lib/region";
import { calendarFileName, saveFile } from "../../../lib/saveFile";
import type { ControlsDialog, DashboardNavigate, DashboardScope } from "../scope";

/*
 * 연도별·월별 화재 달력 (3장). `/series`(그 지역 전체)와 `/baseline`을 함께 기다린다.
 * 화면이 `key={region.id}`로 그려서 지역이 바뀌면 표시 연도와 보정 전/후가 기본으로 돌아간다.
 * 보정 전/후(9장 2차): 보정 전은 `/series` `raw_before`. 값이 하나도 없는 지역(시·도, 목 모드)은 보정 후로 고정하고 이유를 보인다.
 * 내려받기(9장): "월별 CSV"는 서버 `/export.csv`, "달력 PNG"는 지금 보이는 격자(표시 연도·보정 전/후)를 Canvas로 그린다.
 * 둘 다 확인 대화상자를 거친다(`ExportDialog`).
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
  const [chosenBasis, setBasis] = useState<Basis>("harmonized");
  const [exporting, setExporting] = useState<"csv" | "png" | null>(null);
  const csv = useCsvDownload(country, region.id);
  const [png, setPng] = useState<{ busy: boolean; failed: boolean }>({ busy: false, failed: false });

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
  const rawAvailable = hasRawValues(months);
  const basis: Basis = rawAvailable ? chosenBasis : "harmonized";
  const basisLabel = basis === "raw" ? t.heatmap.raw : t.heatmap.harmonized;
  const rows = buildGrid({ months, bins: base.heat_bins, basis, startYear, selected: scope.month, clickRange: scope.range });
  const label = regionName(region, index, locale);
  // 선택한 달 줄: 그 달 값과 집계 중 여부(칸 상태와 같은 기준 `status === "partial"`). 표시 연도 밖이어도 보인다
  const selectedRow = months.find((m) => m.month === scope.month);
  const selectedValue = selectedRow === undefined ? null : basisValue(selectedRow, basis);
  const selectedCollecting = selectedRow?.status === "partial";
  // 각주의 집계 중 문장: 자료 마지막 날(`data_end`)이 달 중간이면 그 달은 아직 모으는 중(머리 자료 카드와 같은 기준)
  const dataEnd = scope.meta.data_end;
  const collecting =
    dataEnd === null || isLastDayOfMonth(dataEnd)
      ? null
      : { month: formatMonth(dataEnd.slice(0, 7), locale), day: Number(dataEnd.slice(8, 10)), date: formatDayDate(dataEnd, locale) };
  const n = (v: number) => formatFireDays(v, locale);
  const legend = t.heatmap.legend;
  const downloadPng = () => {
    const ex = t.heatmap.exports.image;
    setPng({ busy: true, failed: false });
    renderCalendarPng(
      rows,
      {
      title: ex.title(label, startYear, lastYear),
      sub: basis === "raw" ? ex.subRaw : ex.sub,
      monthLabel: t.heatmap.monthHead,
      legendTitle: legend.title(t.dashboard.unit),
      levels: heatLegend(base.heat_bins).map((item) => ({ level: item.level, label: legendLabel(item, legend, n) })),
      states: {
        converted: basis === "raw" ? null : t.heatmap.states.converted.title,
        noData: t.heatmap.states.noData.title,
        partial: t.heatmap.states.partial.title,
        future: t.heatmap.states.future.title,
      },
      source: ex.source(dataEnd === null ? "—" : formatFullDate(dataEnd, locale)),
      period: (basis === "raw" ? ex.periodRaw : ex.period)(base.period[0], base.period[1]),
      },
      basis,
    )
      .then((blob) => {
        saveFile(blob, calendarFileName(country, region.id, basis));
        setPng({ busy: false, failed: false });
        setExporting((cur) => (cur === "png" ? null : cur));
      })
      // 실패는 대화상자 안 글자로 보인다(콘솔에만 남기지 않음)
      .catch(() => setPng({ busy: false, failed: true }));
  };
  // 평소 범위는 보정 후 기준이라 보정 전 값과 견주지 않는다(툴팁에서 그 줄을 뺀다)
  const bandFor = (m: number) => {
    if (basis === "raw") return null;
    const row = base.by_month.find((b) => b.month === m);
    return row !== undefined && row.band_low !== null && row.band_high !== null ? { low: row.band_low, high: row.band_high } : null;
  };

  return (
    // 시안 `.db-calendar`: 안쪽 32
    <Card className="flex flex-col p-8">
      <HeatmapHeader
        sub={t.heatmap.sub(startYear, lastYear, label)}
        basis={basis}
        onBasis={setBasis}
        rawUnavailable={rawAvailable ? null : t.heatmap.rawUnavailable}
        yearMode={district ? null : mode}
        onYearMode={setMode}
        mockMode={mockMode}
        onCsv={() => {
          // 받는 중이면 그 상태를 그대로 보인다(초기화하면 진행 중인 요청과 떨어져 두 번 받게 된다)
          if (!csv.isPending) csv.reset();
          setExporting("csv");
        }}
        onPng={() => {
          if (!png.busy) setPng({ busy: false, failed: false });
          setExporting("png");
        }}
      />
      <HeatmapGrid rows={rows} basis={basis} regionLabel={label} bandFor={bandFor} onSelect={navigate.toMonth} />
      {/* 시안 `.db-calendar-selection`: 위아래 선, 위아래 16, 12px. 이름표 Mono 9, 달 이름은 굵게, 값은 오른쪽 끝 */}
      <p aria-live="polite" className="mt-6 flex flex-wrap items-center gap-4 border-y border-line py-4 text-xs text-[#bec5ce]">
        <span className="mono-tag text-[9px] text-[#9ba5b3]">{t.heatmap.selection.label}</span>
        <strong className="font-medium text-[#f0f1f3]">{formatMonth(scope.month, locale)}</strong>
        {/* 값이 없으면 칸 상태 순서(값 없음이 먼저)대로 "관측 자료 없음"만 */}
        <span className="ml-auto">
          {selectedValue === null
            ? t.heatmap.states.noData.title
            : t.heatmap.selection.detail(formatFireDays(selectedValue, locale), t.dashboard.unit, basisLabel, selectedCollecting)}
        </span>
      </p>
      <div className="mt-6 flex flex-col gap-6">
        <HeatLegend items={heatLegend(base.heat_bins)} basis={basis} />
        <StateLegend basis={basis} />
      </div>
      {/* 시안 `.db-panel-footnote`: 11px, 줄 높이 1.6, 위 16 */}
      <p className="mt-4 text-[11px] leading-[1.6] text-[#8e99aa]">{t.heatmap.footnote(collecting)}</p>
      <ExportDialog
        open={exporting === "csv"}
        // 받는 중에는 닫지 않는다(닫으면 실패가 화면에 나오지 않는다)
        onClose={() => {
          if (!csv.isPending) setExporting(null);
        }}
        title={t.heatmap.exports.csv.title}
        detail={t.heatmap.exports.csv.detail}
        busy={csv.isPending}
        error={csv.isError ? { kind: errorKind(csv.error) } : null}
        onDownload={() => csv.mutate(undefined, { onSuccess: () => setExporting((cur) => (cur === "csv" ? null : cur)) })}
      />
      <ExportDialog
        open={exporting === "png"}
        onClose={() => {
          if (!png.busy) setExporting(null);
        }}
        title={t.heatmap.exports.png.title}
        detail={t.heatmap.exports.png.detail}
        busy={png.busy}
        error={png.failed ? { message: t.heatmap.exports.pngFailed } : null}
        onDownload={downloadPng}
      />
    </Card>
  );
}
