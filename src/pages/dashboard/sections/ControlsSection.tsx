import { Breadcrumb, type Crumb } from "../../../components/dashboard/Breadcrumb";
import { SearchField, SelectBox } from "../../../components/dashboard/SelectBox";
import { useLocale, useMessages } from "../../../i18n";
import { formatMonth } from "../../../lib/format";
import type { Locale } from "../../../lib/locale";
import { ownName, regionPath } from "../../../lib/region";
import type { ControlsDialog, DashboardNavigate, DashboardScope } from "../scope";

/*
 * 선택 줄과 경로 (screens/kr/dashboard-*.png).
 * 나라 화면은 흰 카드 안에 라벨이 칸 위에, 시·도·시·군·구 화면은 카드 없이 단계 이름이 칸 안 앞에 붙는다.
 * CAL·BC(`labels.single`)는 시·도 칸을 그리지 않는다(2-3). 대화상자는 `ControlsDialogs`가 그린다.
 */
type ControlsSectionProps = {
  scope: DashboardScope;
  navigate: DashboardNavigate;
  openDialog: (dialog: ControlsDialog) => void;
};

export function ControlsSection({ scope, navigate, openDialog }: ControlsSectionProps) {
  const t = useMessages();
  const c = t.dashboard.controls;
  const locale = useLocale();
  const { region, province, levelNames, meta, month } = scope;
  const single = meta.labels.single;
  const national = region.level === "nat";
  const district = region.level === "dist" ? region : null;
  // 한국은 시·도를 고르기 전에는 시·군·구 칸을 열 수 없다(디자인)
  const districtLocked = !single && province === null;
  const prefix = (level: string) => (national ? undefined : level);
  const label = (text: string) => (national ? text : undefined);

  const fields = (
    <div className={`grid gap-4 ${single ? "md:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-4"}`}>
      {!single && (
        <SelectBox
          label={label(levelNames.lv1)}
          prefix={prefix(levelNames.lv1)}
          value={province !== null ? ownName(province, locale) : c.all(levelNames.lv1)}
          onOpen={() => openDialog("province")}
        />
      )}
      <SelectBox
        label={label(levelNames.lv2)}
        prefix={prefix(levelNames.lv2)}
        value={district !== null ? ownName(district, locale) : districtLocked ? c.pickProvinceFirst(levelNames.lv1) : c.all(levelNames.lv2)}
        disabled={districtLocked}
        onOpen={() => openDialog("district")}
      />
      <SearchField label={label(c.search)} value={c.searchPlaceholder} onOpen={() => openDialog("search")} />
      <SelectBox label={label(c.month)} value={formatMonth(month, locale)} onOpen={() => openDialog("month")} />
    </div>
  );

  const crumbs = breadcrumb(scope, navigate, locale, c.all);
  return national ? (
    <section className="flex flex-col gap-4 rounded-card bg-surface p-6">
      {fields}
      <Breadcrumb items={crumbs} />
    </section>
  ) : (
    <section className="flex flex-col gap-6">
      {fields}
      <Breadcrumb items={crumbs} />
    </section>
  );
}

/** 나라 → (시·도) → 지역. 나라 화면은 "전체 시·도 › 전체 시·군·구"까지 보여 준다(디자인). 앞 단계는 링크. */
function breadcrumb(scope: DashboardScope, navigate: DashboardNavigate, locale: Locale, all: (level: string) => string): Crumb[] {
  const { country, region, index, levelNames, meta } = scope;
  const path = regionPath(region, country, meta.labels.single, index);
  const crumbs: Crumb[] = path.map((r, i) => ({
    key: r.id,
    label: ownName(r, locale),
    href: i === path.length - 1 ? null : navigate.regionHref(r.level === "nat" ? null : r.id),
  }));
  if (region.level !== "nat") return crumbs;
  const rest = meta.labels.single ? [levelNames.lv2] : [levelNames.lv1, levelNames.lv2];
  return [...crumbs, ...rest.map((level) => ({ key: `all-${level}`, label: all(level), href: null }))];
}
