import { Breadcrumb, type Crumb } from "../../../components/dashboard/Breadcrumb";
import { MonthField } from "../../../components/dashboard/MonthPicker";
import { LinkIcon } from "../../../components/icons";
import { SearchField, SelectBox } from "../../../components/dashboard/SelectBox";
import { useLocale, useMessages } from "../../../i18n";
import type { Locale } from "../../../lib/locale";
import { ownName, regionName, regionPath } from "../../../lib/region";
import type { ControlsDialog, DashboardNavigate, DashboardScope } from "../scope";

/*
 * 선택 줄과 경로. 칸의 배치(검색 → 시·도 → 시·군·구 → 기준 월)는 지금 그대로, 모양은 시안 v9
 * (`.db-filter-bar`: 카드 없이 칸만, 아래 구분선, 그 아래 경로 줄 `.db-context-heading`).
 * CAL·BC(`labels.single`)는 시·도 칸을 그리지 않는다(2-3). 대화상자는 `ControlsDialogs`가 그린다.
 */
type ControlsSectionProps = {
  scope: DashboardScope;
  navigate: DashboardNavigate;
  openDialog: (dialog: ControlsDialog) => void;
};

/*
 * 칸 너비: 시안 `minmax(200px,1.4fr) minmax(100px,.65fr) minmax(150px,.85fr) auto`를 우리 칸 수에 맞춤.
 * 검색 칸이 가장 넓고 나머지는 같게. 1024px 아래(데스크톱만 하는 범위 밖)는 두 칸씩
 */
const GRID = {
  four: "lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.85fr))]",
  three: "lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.85fr))]",
} as const;

export function ControlsSection({ scope, navigate, openDialog }: ControlsSectionProps) {
  const t = useMessages();
  const c = t.dashboard.controls;
  const locale = useLocale();
  const { region, province, levelNames, meta, month } = scope;
  const single = meta.labels.single;
  const district = region.level === "dist" ? region : null;
  // 한국은 시·도를 고르기 전에는 시·군·구 칸을 열 수 없다(디자인)
  const districtLocked = !single && province === null;

  const crumbs = breadcrumb(scope, navigate, locale, c.all);
  // 경로 줄은 구분선 아래 따로 둔다(시안 `.db-context-heading`)
  return (
    <section className="flex flex-col">
      <div className={`grid grid-cols-2 items-stretch gap-6 border-b border-border pb-6 ${single ? GRID.three : GRID.four}`}>
        {/* 검색 칸이 맨 앞, 글자는 지금 보고 있는 곳(2026-11-14 사용자 결정, decisions 7-7) */}
        <SearchField label={c.search} value={currentPlace(scope, locale)} hint={c.searchHint} onOpen={() => openDialog("search")} />
        {!single && (
          <SelectBox
            label={levelNames.lv1}
            value={province !== null ? ownName(province, locale) : c.all(levelNames.lv1)}
            onOpen={() => openDialog("province")}
          />
        )}
        <SelectBox
          label={levelNames.lv2}
          value={district !== null ? ownName(district, locale) : districtLocked ? c.pickProvinceFirst(levelNames.lv1) : c.all(levelNames.lv2)}
          disabled={districtLocked}
          onOpen={() => openDialog("district")}
        />
        {/* 기준 월은 양옆 한 달 이동 + 가운데를 누르면 아래로 펼치는 격자(2026-11-15 사용자) */}
        <MonthField label={c.month} month={month} range={scope.range} onPick={navigate.toMonth} />
      </div>
      {/* 경로 줄 오른쪽 끝: 이 화면 공유(대화상자만 열고 복사는 안에서. 예전 "자료 가져가기" 카드에서 옮김, 2026-11-15 사용자) */}
      <div className="flex items-center justify-between gap-4 pt-6">
        <Breadcrumb items={crumbs} />
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => navigate.share()}
          className={
            "flex shrink-0 items-center gap-2 rounded-control border border-line bg-wash px-3 py-1.5 text-xs text-ink transition-colors " +
            "hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-selection"
          }
        >
          <LinkIcon className="size-3.5 text-muted" />
          {c.share}
        </button>
      </div>
    </section>
  );
}

/**
 * 검색 칸에 보일 지금 위치: 나라 "대한민국", 시·도 "대한민국 · 경북", 시·군·구 "경북 의성군"(같은 이름 시·군·구가 있어 시·도를 붙인다).
 * CAL·BC 카운티·지역구는 시·도가 없어 이름만("Butte").
 */
function currentPlace(scope: DashboardScope, locale: Locale): string {
  const { region, index, country } = scope;
  if (region.level === "dist") return regionName(region, index, locale);
  const nation = index.get(country);
  const nationName = nation !== undefined ? ownName(nation, locale) : country;
  return region.level === "prov" ? `${nationName} · ${ownName(region, locale)}` : nationName;
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
