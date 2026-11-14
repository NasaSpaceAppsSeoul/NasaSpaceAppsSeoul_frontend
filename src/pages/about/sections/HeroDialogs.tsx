import { useNavigate } from "react-router-dom";
import { RegionListDialog, type ListOption } from "../../../components/dashboard/RegionListDialog";
import { SearchDialog } from "../../../components/dashboard/SearchDialog";
import type { Meta, RegionSummary } from "../../../api/types";
import { useMeta } from "../../../hooks/useMeta";
import { useLocale, useMessages } from "../../../i18n";
import { COUNTRIES, parseCountry, type Country } from "../../../lib/country";
import { dashboardPath } from "../../../lib/dashboardPath";
import { errorKind } from "../../../lib/errorKind";
import { formatMonth } from "../../../lib/format";
import { indexRegions, ownName, sortByName } from "../../../lib/region";

/*
 * 소개 머리의 대화상자 2개.
 * - 검색: 2장 검색 대화상자 그대로(맨 위 나라 3개, 한국 지역을 거른다).
 * - 지역 둘러보기 (overlays/kr/region.png): 디자인의 데모 고정 목록 대신 맨 위 나라 3개(2-2) + 한국 시·도(7-4 정렬).
 *   보조 줄은 단계 이름과 그 나라 `/meta`의 자료 끝 달(받았을 때만). 준비 안 된 나라는 빼고 그린다.
 * 고르면 그 대시보드로 간다. 달은 붙이지 않는다(최신 달, 7-2).
 */
export type HeroDialog = "search" | "browse" | null;

type HeroDialogsProps = {
  dialog: HeroDialog;
  close: () => void;
  /** 한국 `/regions` */
  regions: readonly RegionSummary[];
  /** 한국 `/meta` */
  meta: Meta;
};

const COUNTRY_KEY = "country:";

export function HeroDialogs({ dialog, close, regions, meta }: HeroDialogsProps) {
  const t = useMessages();
  const h = t.about.hero;
  const locale = useLocale();
  const navigate = useNavigate();
  // 나라 버튼이 이미 부른 것과 같은 키라 새 요청이 나가지 않는다
  const cal = useMeta("CAL");
  const bc = useMeta("BC");
  const others = { CAL: cal, BC: bc };
  const metaOf = (c: Country) => (c === "KOR" ? { data: meta, error: null } : others[c]);
  // 머리의 나라 버튼과 같이, `/meta`가 404 `COUNTRY_NOT_READY`인 나라는 목록에서 뺀다(2-6)
  const listed = COUNTRIES.filter((c) => errorKind(metaOf(c).error) !== "notReady");

  const index = indexRegions(regions);
  const levelNames = locale === "ko" ? { lv1: meta.labels.lv1, lv2: meta.labels.lv2 } : t.levelNames.KOR;
  const levelName = (r: RegionSummary) =>
    r.level === "nat" ? t.countries.KOR : r.level === "prov" ? levelNames.lv1 : levelNames.lv2;
  /** 보조 줄: 단계 이름 · 자료 끝 달("2026년 10월까지 자료"). 날짜를 아직 모르면 단계 이름만 */
  const withDataEnd = (label: string, dataEnd: string | null | undefined) =>
    dataEnd !== null && dataEnd !== undefined ? `${label} · ${h.dataEnd(formatMonth(dataEnd.slice(0, 7), locale))}` : label;

  const go = (path: string) => {
    close();
    navigate(path);
  };

  const browseOptions: ListOption[] = [
    ...listed.map((c) => ({
      key: `${COUNTRY_KEY}${c}`,
      title: t.countries[c],
      sub: withDataEnd(h.countryRowSub, metaOf(c).data?.data_end),
      selected: false,
    })),
    ...sortByName(regions.filter((r) => r.level === "prov"), index, locale).map((r) => ({
      key: r.id,
      title: ownName(r, locale),
      sub: withDataEnd(h.provinceRowSub(levelNames.lv1), meta.data_end),
      selected: false,
    })),
  ];

  return (
    <>
      <SearchDialog
        open={dialog === "search"}
        onClose={close}
        countries={COUNTRIES.map((code) => ({ code, label: t.countries[code], selected: false }))}
        regions={regions}
        index={index}
        levelName={levelName}
        onPickCountry={(code) => {
          const country = parseCountry(code);
          if (country !== null) go(dashboardPath(locale, country));
        }}
        onPickRegion={(r) => go(dashboardPath(locale, "KOR", r.id))}
      />
      <RegionListDialog
        open={dialog === "browse"}
        onClose={close}
        title={h.browseTitle}
        description={h.browseDescription}
        options={browseOptions}
        onPick={(key) => {
          const country = key.startsWith(COUNTRY_KEY) ? parseCountry(key.slice(COUNTRY_KEY.length)) : null;
          go(country !== null ? dashboardPath(locale, country) : dashboardPath(locale, "KOR", key));
        }}
      />
    </>
  );
}
