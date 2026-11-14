import { useNavigate } from "react-router-dom";
import { SearchDialog } from "../../../components/dashboard/SearchDialog";
import type { Meta, RegionSummary } from "../../../api/types";
import { useMeta } from "../../../hooks/useMeta";
import { useLocale, useMessages } from "../../../i18n";
import { COUNTRIES, parseCountry, type Country } from "../../../lib/country";
import { dashboardPath } from "../../../lib/dashboardPath";
import { errorKind } from "../../../lib/errorKind";
import { formatMonth } from "../../../lib/format";
import type { RegionIndex } from "../../../lib/region";

/*
 * 첫 화면 히어로의 지역 검색 대화상자 (`plans/about-revise.md` 11절). 예전 "지역 둘러보기"를 합쳤다.
 * 입력 전에는 나라 목록(`COUNTRIES`) 아래 한국 시·도를 들여 쓴 계층 목록, 입력하면 한국 시·도·시·군·구를 거른다(소개는 한국 고정, 2-7).
 * 나라 줄 보조 글자는 "나라 대시보드 · 그 나라 `/meta`의 자료 끝 달"(받았을 때만). 준비 안 된 나라는 빼고 그린다(2-6).
 * 고르면 그 대시보드로 간다. 달은 붙이지 않는다(최신 달, 7-2).
 */
type HeroDialogsProps = {
  open: boolean;
  close: () => void;
  /** 한국 `/regions` */
  regions: readonly RegionSummary[];
  index: RegionIndex;
  /** 한국 `/meta` */
  meta: Meta;
};

export function HeroDialogs({ open, close, regions, index, meta }: HeroDialogsProps) {
  const t = useMessages();
  const h = t.about.hero;
  const locale = useLocale();
  const navigate = useNavigate();
  // 나라 버튼이 이미 부른 것과 같은 키라 새 요청이 나가지 않는다
  const cal = useMeta("CAL");
  const bc = useMeta("BC");
  const grc = useMeta("GRC");
  const chl = useMeta("CHL");
  const nsw = useMeta("NSW");
  const others = { CAL: cal, BC: bc, GRC: grc, CHL: chl, NSW: nsw };
  const metaOf = (c: Country) => (c === "KOR" ? { data: meta, error: null } : others[c]);
  // 머리의 나라 버튼과 같이, `/meta`가 404 `COUNTRY_NOT_READY`인 나라는 목록에서 뺀다(2-6)
  const listed = COUNTRIES.filter((c) => errorKind(metaOf(c).error) !== "notReady");

  const levelNames = locale === "ko" ? { lv1: meta.labels.lv1, lv2: meta.labels.lv2 } : t.levelNames.KOR;
  const levelName = (r: RegionSummary) =>
    r.level === "nat" ? t.countries.KOR : r.level === "prov" ? levelNames.lv1 : levelNames.lv2;
  /** 나라 줄 보조 글자: "나라 대시보드 · 2026년 10월까지 자료". 날짜를 아직 모르면 앞부분만 */
  const countrySub = (c: Country) => {
    const dataEnd = metaOf(c).data?.data_end;
    return dataEnd !== null && dataEnd !== undefined
      ? `${h.countryRowSub} · ${h.dataEnd(formatMonth(dataEnd.slice(0, 7), locale))}`
      : h.countryRowSub;
  };

  const go = (path: string) => {
    close();
    void navigate(path);
  };

  return (
    <SearchDialog
      open={open}
      onClose={close}
      countries={listed.map((code) => ({ code, label: t.countries[code], selected: false, sub: countrySub(code) }))}
      regionsCountry="KOR"
      regions={regions}
      index={index}
      levelName={levelName}
      onPickCountry={(code) => {
        const country = parseCountry(code);
        if (country !== null) go(dashboardPath(locale, country));
      }}
      onPickRegion={(r) => go(dashboardPath(locale, "KOR", r.id))}
    />
  );
}
