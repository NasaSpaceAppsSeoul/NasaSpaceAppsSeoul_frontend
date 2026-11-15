import type { ReactNode } from "react";
import { Button } from "../../../components/Button";
import { RegionList, type RegionListRow } from "../../../components/dashboard/RegionList";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useTop } from "../../../hooks/useTop";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { formatFireDays, formatMonth, formatMonthName } from "../../../lib/format";
import { beforeDistrictData, isInRange, monthNumber } from "../../../lib/month";
import { byValueThenName, neighborName } from "../../../lib/region";
import type { DashboardNavigate, DashboardScope } from "../scope";

/*
 * 숫자 카드 아래 목록 (5장, `decisions.md` 6절, `reference/api/E-map-top.md` E-3·E-4).
 * - 시·도: `/top?parent=시·도` 3곳 "평소보다 두드러진 곳". 서버 순서 그대로(그 지역의 같은 달 순위 → 값), 왼쪽 번호는 목록 순번.
 *   자기 순위(`rank`)는 보이지 않는다(3-1: `/top`에는 `region_type`이 없어 드문 지역을 가릴 수 없다).
 * - 시·군·구: `/top?parent=시·군·구` 맞닿은 지역 전부. 값 큰 순(같으면 이름순, 서버 동률 순서가 정해져 있지 않다), 0도 보인다.
 * 이름은 같은 시·도면 이름만, 다른 시·도면 시·도를 붙인다(`neighborName`). 줄을 누르면 그 지역으로(달 유지).
 * 빈 목록 문구는 달로 나눈다(2012-02 전은 시·군·구 값이 없다, 6-3). 화면이 `key={region.id}`로 그린다.
 * 모양은 참고 소스 지역 목록(판 없음, 머리 오른쪽에 지역 수와 달·단위, 열 이름 줄, 순번 줄. 한 줄에 한 지역, 2026-11-15 디자이너·사용자).
 */
type RegionListSectionProps = { scope: DashboardScope; navigate: DashboardNavigate };

export function RegionListSection({ scope, navigate }: RegionListSectionProps) {
  const t = useMessages();
  const locale = useLocale();
  const { country, region, index, month } = scope;
  const district = region.level === "dist";
  const query = useTop(country, month, region.id);
  const copy = district ? t.dashboard.neighbors : t.dashboard.top;
  const title = district ? t.dashboard.neighbors.title(formatMonthName(monthNumber(month), locale)) : t.dashboard.top.title;
  const sub = district ? t.dashboard.neighbors.sub : t.dashboard.top.sub(scope.levelNames.lv2);

  // 참고 `.db-region-head`: 왼쪽 제목·설명, 오른쪽(값이 있을 때만) 지역 수 15px 흰색 + 달·단위 13px 흐린 색, 머리 아래 20
  const frame = (body: ReactNode, meta?: { count: number; month: string }) => (
    <section className="flex flex-col">
      <header className="flex items-end justify-between gap-6 pb-5">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-muted">{sub}</p>
        </div>
        {meta !== undefined && (
          <p className="flex shrink-0 flex-col items-end gap-0.5 text-right">
            <strong className="text-[15px] font-medium text-[#f2f4f7]">{t.dashboard.regionCount(meta.count)}</strong>
            <span className="text-[13px] text-[#aeb7c3]">{`${formatMonth(meta.month, locale)} · ${t.dashboard.unit}`}</span>
          </p>
        )}
      </header>
      {body}
    </section>
  );

  if (query.isError && query.data === undefined) {
    const kind = errorKind(query.error);
    // `/top`의 달 범위는 감지 점 자료로 정해져(`SpatialService.checkMonth`) 나라 시계열의 마지막 달이 범위 밖일 수 있다.
    // 화면의 달 범위 안이면 에러가 아니라 지도처럼 "감지 지점 자료가 없습니다"(5-9, 스킬 burnline-api 9번)
    if (kind === "range" && isInRange(month, scope.range)) {
      return frame(<p className="py-6 text-sm text-muted">{t.map.notes.outOfRange}</p>);
    }
    // 정말 범위 밖이면 다시 해도 같아서, 숫자 카드처럼 최신 달로 가는 버튼을 준다
    const action =
      kind === "range" ? (
        <Button size="sm" onClick={() => navigate.toMonth(scope.range.last)}>
          {t.dashboard.latestMonth}
        </Button>
      ) : undefined;
    return frame(<SectionError kind={kind} onRetry={() => void query.refetch()} action={action} />);
  }
  if (query.data === undefined) {
    // 판 하나(화면 읽기가 "불러오는 중"을 한 번만 읽게), 높이는 시·도 목록 3줄과 비슷하게
    return frame(<Skeleton className="h-56 w-full" />);
  }

  const data = query.data;
  const labels = new Map(data.items.map((i) => [i.id, i.label_ko]));
  const nameOf = (id: string) => neighborName(id, labels.get(id) ?? id, region, index, locale);
  const ordered = district
    ? [...data.items].sort(byValueThenName((i) => i.value, (a, b) => nameOf(a).localeCompare(nameOf(b), locale)))
    : data.items;
  const rows: RegionListRow[] = ordered.map((i) => ({
    id: i.id,
    name: nameOf(i.id),
    // 시·도 목록은 이름 아래 달 한 줄. 인접 지역은 이름만
    sub: district ? null : formatMonth(data.month, locale),
    value: formatFireDays(i.value, locale),
    href: navigate.regionHref(i.id),
  }));
  // 화면에 보이는 목록의 달로 고른다(새 달을 받는 동안에는 지난 달 목록이 흐리게 보인다)
  const emptyText = beforeDistrictData(data.month) ? copy.preDistrict : copy.empty;

  return frame(
    <div aria-busy={query.isPlaceholderData} className={`transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
      {rows.length === 0 ? (
        <p className="py-6 text-sm text-muted">{emptyText}</p>
      ) : (
        // 달이 바뀌면 접힌 상태로 되돌린다(지역이 바뀌면 화면이 `key={region.id}`로 새로 그린다)
        <RegionList
          key={data.month}
          rows={rows}
          headLabel={scope.levelNames.lv2}
          unit={t.dashboard.unit}
          label={title}
          expandLabel={t.dashboard.listExpand}
          collapseLabel={t.dashboard.listCollapse}
        />
      )}
    </div>,
    { count: rows.length, month: data.month },
  );
}
