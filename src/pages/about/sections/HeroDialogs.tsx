import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { failedOf, useAllRegions } from "../../../hooks/useAllCountries";
import { useRegions } from "../../../hooks/useRegions";
import { indexRegions } from "../../../lib/region";
import { SearchDialog } from "../../../components/dashboard/SearchDialog";
import { SectionError } from "../../../components/SectionError";
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
 * 검색 칸 위 나라 칩(UI 다듬기 2026-11-15): 나라를 고르면 그 나라 줄과 그 나라 `/regions`로 목록·검색을 바꾼다.
 * "전체"(처음 모습, 대시보드로 가지 않음)는 나라 줄 여섯 개만 두고, 입력하면 여섯 나라 `/regions`에서 찾아 나라별로 묶는다(사용자).
 * 일부 주만 있는 나라 칩은 "미국 · 캘리포니아".
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

export function HeroDialogs({ open, close: closeDialog, regions: korRegions, index: korIndex, meta }: HeroDialogsProps) {
  const t = useMessages();
  const h = t.about.hero;
  const locale = useLocale();
  const navigate = useNavigate();
  // 나라 칩(UI 다듬기 2026-11-15): `null`은 "전체" = 대화상자 처음 모습(나라 목록 + 한국 시·도). 닫으면 처음으로 되돌린다
  const [chip, setChip] = useState<Country | null>(null);
  const close = () => {
    setChip(null);
    closeDialog();
  };
  // 고른 나라의 `/regions`(대시보드와 같은 키). 한국은 히어로가 이미 받은 한국 목록을 쓴다
  const chipRegions = useRegions(chip !== null && chip !== "KOR" ? chip : undefined);
  // "전체"에서 입력하면 여섯 나라 모두에서 찾는다(사용자 "나"안): 대화상자가 열려 있고 "전체"일 때 여섯 나라 `/regions`를 받는다
  const all = useAllRegions(open && chip === null);
  const country: Country = chip ?? "KOR";
  const chipItems = chipRegions.data?.items;
  // 여러 나라를 합친 목록과, 지역 ID → 나라(이름표·단계 이름·대시보드 주소에 쓴다)
  // 합치기는 렌더마다 한다(여섯 나라 합쳐 1천여 줄, "전체"이고 대화상자가 열려 있을 때만)
  const merged = { items: [] as RegionSummary[], countryOf: new Map<string, Country>() };
  if (open && chip === null) {
    COUNTRIES.forEach((c, i) => {
      const list = c === "KOR" ? korRegions : all.list[i]?.data?.items;
      list?.forEach((r) => {
        merged.items.push(r);
        merged.countryOf.set(r.id, c);
      });
    });
  }
  const chipIndex = useMemo(() => indexRegions(chipItems ?? []), [chipItems]);
  const regions = chip === null ? merged.items : country === "KOR" ? korRegions : (chipItems ?? []);
  const index = chip === null ? indexRegions(merged.items) : country === "KOR" ? korIndex : chipIndex;
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

  // 단계 이름: 한글은 그 지역 나라의 서버 이름(`labels.lv1`·`lv2`), 받기 전이나 영어는 문구 표(대시보드와 같음)
  const countryOfRegion = (r: RegionSummary): Country => (chip === null ? (merged.countryOf.get(r.id) ?? "KOR") : country);
  const levelName = (r: RegionSummary) => {
    const c = countryOfRegion(r);
    const labels = metaOf(c).data?.labels;
    const names = locale === "ko" && labels !== undefined ? { lv1: labels.lv1, lv2: labels.lv2 } : t.levelNames[c];
    return r.level === "nat" ? t.countries[c] : r.level === "prov" ? names.lv1 : names.lv2;
  };
  /** 나라 줄 보조 글자: "나라 대시보드 · 2026년 10월까지 자료". 날짜를 아직 모르면 앞부분만 */
  const countrySub = (c: Country) => {
    const dataEnd = metaOf(c).data?.data_end;
    return dataEnd !== null && dataEnd !== undefined
      ? `${h.countryRowSub} · ${h.dataEnd(formatMonth(dataEnd.slice(0, 7), locale))}`
      : h.countryRowSub;
  };

  // "전체" 검색에서 받지 못한 나라(한국은 히어로가 따로 막는다)
  const allFailed = failedOf(all.list.filter((_, i) => COUNTRIES[i] !== "KOR"));

  const go = (path: string) => {
    close();
    void navigate(path);
  };

  return (
    <SearchDialog
      open={open}
      onClose={close}
      countries={(chip === null ? listed : [chip]).map((code) => ({ code, label: t.countries[code], selected: false, sub: countrySub(code) }))}
      regionsCountry={country}
      regions={regions}
      index={index}
      levelName={levelName}
      onPickCountry={(code) => {
        const picked = parseCountry(code);
        if (picked !== null) go(dashboardPath(locale, picked));
      }}
      onPickRegion={(r) => go(dashboardPath(locale, countryOfRegion(r), r.id))}
      // "전체": 나라 줄만 두고(가장 큰 단위, 사용자), 입력하면 여섯 나라 결과를 나라별로 묶는다
      withTree={chip !== null}
      regionCountry={chip === null ? (r) => t.countries[countryOfRegion(r)] : undefined}
      chips={{
        options: listed.map((code) => {
          const parent = t.dashboard.dialogs.chipParent[code];
          return parent === undefined ? { code, label: t.countries[code] } : { code, label: parent, sub: t.countries[code] };
        }),
        value: chip,
        onChange: (code) => setChip(code === null ? null : parseCountry(code)),
      }}
      notice={
        chip === null ? (
          allFailed !== null ? (
            <SectionError kind={errorKind(allFailed.error)} onRetry={allFailed.retry} />
          ) : all.list.some((q) => q.isFetching && q.data === undefined) ? (
            <p role="status" className="px-3 text-xs text-muted">
              {t.common.loading}
            </p>
          ) : undefined
        ) : chipRegions.isError ? (
          <SectionError kind={errorKind(chipRegions.error)} onRetry={() => void chipRegions.refetch()} />
        ) : chipRegions.isFetching && chipItems === undefined ? (
          // 칩을 누른 직후 그 나라 목록을 받는 동안(빈 목록과 구분)
          <p role="status" className="px-3 text-xs text-muted">
            {t.common.loading}
          </p>
        ) : undefined
      }
    />
  );
}
