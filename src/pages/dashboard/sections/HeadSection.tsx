import { MonthStepper } from "../../../components/dashboard/MonthStepper";
import { useLocale, useMessages } from "../../../i18n";
import { formatMonth } from "../../../lib/format";
import { clampMonth, shiftMonth } from "../../../lib/month";
import { ownName, regionName } from "../../../lib/region";
import type { DashboardNavigate, DashboardScope } from "../scope";

/*
 * 화면 머리 (screens/kr/dashboard-*.png).
 * 나라: 보조 줄 + 큰 제목 + 오른쪽 달 이동. 시·도·시·군·구: 단계 표시(작은 파란 글자) + 제목.
 */
export function HeadSection({ scope, navigate }: { scope: DashboardScope; navigate: DashboardNavigate }) {
  const t = useMessages();
  const locale = useLocale();
  const { region, month, range, meta, levelNames } = scope;
  const monthLabel = formatMonth(month, locale);

  if (region.level === "nat") {
    const subParts = [regionName(region, scope.index, locale), levelNames.lv2];
    return (
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-xs text-muted">
            {meta.data_end !== null ? t.dashboard.natSub(subParts[0] ?? "", levelNames.lv2, meta.data_end) : subParts.join(" · ")}
          </p>
          <h1 className="text-title-lg font-semibold text-ink">{t.dashboard.natTitle(monthLabel)}</h1>
        </div>
        <MonthStepper
          month={month}
          isLatest={month === range.last}
          // 주소의 달이 범위 밖이어도 한 번에 범위 안으로 돌아오게 맞춘다(설계안 9절)
          onPrevious={month > range.first ? () => navigate.toMonth(clampMonth(shiftMonth(month, -1), range)) : null}
          onNext={month < range.last ? () => navigate.toMonth(clampMonth(shiftMonth(month, 1), range)) : null}
        />
      </header>
    );
  }

  const level = region.level === "prov" ? levelNames.lv1 : levelNames.lv2;
  return (
    <header className="flex flex-col gap-4">
      <p className="text-xs font-medium text-action">{t.dashboard.stage(level)}</p>
      <h1 className="text-title-lg text-ink">{t.dashboard.regionTitle(ownName(region, locale), monthLabel)}</h1>
    </header>
  );
}
