import { MonthDialog } from "../../../components/dashboard/MonthDialog";
import { RegionListDialog, type ListOption } from "../../../components/dashboard/RegionListDialog";
import { SearchDialog } from "../../../components/dashboard/SearchDialog";
import type { RegionSummary } from "../../../api/types";
import { useLocale, useMessages } from "../../../i18n";
import { COUNTRIES, parseCountry } from "../../../lib/country";
import { formatMonth } from "../../../lib/format";
import { ownName, parentOf, regionPath, sortByName } from "../../../lib/region";
import type { CopyState } from "../../../lib/copyState";
import { ShareDialog } from "../../../components/dashboard/ShareDialog";
import type { ControlsDialog, DashboardNavigate, DashboardScope } from "../scope";

/*
 * 선택 줄의 대화상자 4개 (overlays/kr/province·district·search·month-*). 열림 상태는 화면이 들고 있다
 * (지역을 찾지 못했을 때 화면이 바깥에서 검색을 열 수 있게).
 */
type ControlsDialogsProps = {
  scope: DashboardScope;
  dialog: ControlsDialog;
  close: () => void;
  navigate: DashboardNavigate;
  /** 공유 대화상자의 주소, 복사 결과, 복사하기(화면이 만들고 복사한다. 구역은 주소를 읽지 않는다) */
  share: { url: string; state: CopyState; copy: () => void };
};

export function ControlsDialogs({ scope, dialog, close, navigate, share }: ControlsDialogsProps) {
  const t = useMessages();
  const d = t.dashboard.dialogs;
  const locale = useLocale();
  const { country, region, province, regions, index, levelNames, meta } = scope;
  const countryName = t.countries[country];

  const pick = (go: () => void) => {
    close();
    go();
  };
  const levelName = (r: RegionSummary) =>
    r.level === "nat" ? countryName : r.level === "prov" ? levelNames.lv1 : levelNames.lv2;
  const asOption = (r: RegionSummary): ListOption => ({ key: r.id, title: ownName(r, locale), sub: levelName(r), selected: r.id === region.id });

  const provinces = sortByName(regions.filter((r) => r.level === "prov"), index, locale);
  const provinceOptions: ListOption[] = [
    { key: country, title: t.dashboard.controls.all(levelNames.lv1), sub: d.wholeCountry(countryName), selected: region.level === "nat" },
    ...provinces.map(asOption),
  ];

  // 시·도 단계가 없는 나라는 모든 시·군·구, 한국은 고른 시·도의 시·군·구
  const parentId = meta.labels.single ? country : (province?.id ?? null);
  const districts = sortByName(
    regions.filter((r) => r.level === "dist" && parentOf(r, country, meta.labels.single) === parentId),
    index,
    locale,
  );
  const districtOptions: ListOption[] = [
    {
      key: parentId ?? country,
      title: t.dashboard.controls.all(levelNames.lv2),
      sub: province !== null ? ownName(province, locale) : d.wholeCountry(countryName),
      selected: region.level !== "dist",
    },
    ...districts.map(asOption),
  ];

  return (
    <>
      <RegionListDialog
        open={dialog === "province"}
        onClose={close}
        title={d.pickTitle(levelNames.lv1)}
        description={d.pickDescription(levelNames.lv1)}
        options={provinceOptions}
        onPick={(key) => pick(() => navigate.toRegion(key === country ? null : key))}
      />
      <RegionListDialog
        open={dialog === "district"}
        onClose={close}
        title={d.pickTitle(levelNames.lv2)}
        description={d.pickDescription(levelNames.lv2)}
        options={districtOptions}
        onPick={(key) => pick(() => navigate.toRegion(key === country ? null : key))}
      />
      <SearchDialog
        open={dialog === "search"}
        onClose={close}
        countries={COUNTRIES.map((code) => ({ code, label: t.countries[code], selected: code === country }))}
        regions={regions}
        index={index}
        levelName={levelName}
        onPickCountry={(code) => {
          const next = parseCountry(code);
          if (next !== null) pick(() => (next === country ? navigate.toRegion(null) : navigate.toCountry(next)));
        }}
        onPickRegion={(r) => pick(() => navigate.toRegion(r.id))}
      />
      <MonthDialog
        open={dialog === "month"}
        onClose={close}
        range={scope.range}
        selected={scope.month}
        onPick={(month) => pick(() => navigate.toMonth(month))}
      />
      <ShareDialog
        open={dialog === "share"}
        onClose={close}
        label={[...regionPath(region, country, meta.labels.single, index).map((r) => ownName(r, locale)), formatMonth(scope.month, locale)].join(" / ")}
        url={share.url}
        state={share.state}
        onCopy={share.copy}
      />
    </>
  );
}
