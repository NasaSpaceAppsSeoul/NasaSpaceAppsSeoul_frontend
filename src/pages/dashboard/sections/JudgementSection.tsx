import { Button } from "../../../components/Button";
import { CumulativeCard } from "../../../components/dashboard/CumulativeCard";
import { JudgementCard } from "../../../components/dashboard/JudgementCard";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useJudgement } from "../../../hooks/useJudgement";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { judgementView } from "../../../lib/judgementView";
import { regionName, regionNameById } from "../../../lib/region";
import type { ControlsDialog, DashboardNavigate, DashboardScope } from "../scope";

/*
 * 숫자 카드와 누적 카드(나라만). `/judgement`의 로딩·에러·값을 여기서 나눈다.
 * 센서 환산 배지의 근거(`source`)는 나라 시계열의 그 달에서 찾는다(모든 지역이 나라 값을 쓴다, D-1).
 */
type JudgementSectionProps = {
  scope: DashboardScope;
  navigate: DashboardNavigate;
  openDialog: (dialog: ControlsDialog) => void;
};

export function JudgementSection({ scope, navigate, openDialog }: JudgementSectionProps) {
  const t = useMessages();
  const locale = useLocale();
  const { country, region, month, index } = scope;
  const query = useJudgement(country, region.id, month);

  if (query.isLoading) return <Skeleton className="h-80" />;
  if (query.isError) {
    const kind = errorKind(query.error);
    const action =
      kind === "range" ? (
        <Button size="sm" onClick={() => navigate.toMonth(scope.range.last)}>
          {t.dashboard.latestMonth}
        </Button>
      ) : kind === "region" ? (
        <Button size="sm" onClick={() => openDialog("search")}>
          {t.errors.openRegionPicker}
        </Button>
      ) : undefined;
    return <SectionError kind={kind} onRetry={() => void query.refetch()} action={action} />;
  }
  if (query.data === undefined) return <Skeleton className="h-80" />;

  const source = scope.countrySeries.months.find((m) => m.month === query.data.month)?.source ?? null;
  const view = judgementView(query.data, source);
  const refName = view.ref !== null ? regionNameById(view.ref.id, view.ref.label, index, locale) : null;
  const national = region.level === "nat";

  return (
    <div className="flex flex-col gap-6">
      <JudgementCard
        view={view}
        regionLabel={regionName(region, index, locale)}
        refName={refName}
        showYtd={!national}
        showDetectionDays={region.level === "dist"}
        stale={query.isPlaceholderData}
      />
      {national && view.ytd !== null && (
        <CumulativeCard
          month={view.month}
          sum={view.ytd.sum}
          usual={view.ytd.usual}
          partial={view.kind === "partial"}
          stale={query.isPlaceholderData}
        />
      )}
    </div>
  );
}
