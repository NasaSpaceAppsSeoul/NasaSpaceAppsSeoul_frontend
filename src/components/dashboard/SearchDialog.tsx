import { useState } from "react";
import { useLocale, useMessages } from "../../i18n";
import {
  ancestorNames,
  ownName,
  searchRegions,
  sortByName,
  type NamedRegion,
  type RegionIndex,
  type RegionLevel,
} from "../../lib/region";
import { Dialog } from "../Dialog";
import { SearchIcon } from "../icons";
import { MenuRow } from "../MenuRow";

/*
 * 지역 검색 (overlays/kr/search.png). 첫 화면 히어로와 대시보드 선택 줄이 같이 쓴다.
 * - 입력 전: 나라 3개(2-2) 계층 목록. `regions`의 나라 줄 아래에 그 나라 시·도를 들여 써서 소속을 보인다.
 *   더 작은 지역은 입력해 찾는다는 안내를 끝에 둔다(`plans/about-revise.md` 11절).
 * - 입력 후: 나라 3개는 그대로 위에 두고, 지금 나라의 `/regions`에서 거른 결과(7-3)를 단계별로 묶는다.
 *   결과 줄은 자기 이름 + 보조 줄에 소속("경북 · 대한민국").
 */
export type CountryOption = {
  code: string;
  label: string;
  selected: boolean;
  /** 나라 줄 보조 글자(예: "나라 대시보드 · 2026년 10월까지 자료"). 없으면 한 줄 */
  sub?: string;
};

/** 나라는 맨 위 나라 줄로 고르므로 결과 묶음에는 시·도와 시·군·구만 둔다. */
const LEVEL_ORDER: RegionLevel[] = ["prov", "dist"];

type SearchDialogProps<T extends NamedRegion> = {
  open: boolean;
  onClose: () => void;
  countries: CountryOption[];
  /** `regions`가 속한 나라 코드. 입력 전 목록에서 이 나라 아래에 시·도를 묶는다 */
  regionsCountry: string;
  regions: readonly T[];
  index: RegionIndex;
  /** 지금 보고 있는 지역(대시보드). 입력 전 시·도 줄에 선택 표시를 한다 */
  currentRegionId?: string;
  /** 묶음 제목·시·도 줄의 단계 이름 */
  levelName: (region: T) => string;
  onPickCountry: (code: string) => void;
  onPickRegion: (region: T) => void;
};

export function SearchDialog<T extends NamedRegion>(props: SearchDialogProps<T>) {
  const t = useMessages().dashboard.dialogs;
  return (
    // 결과 수에 따라 높이가 바뀌므로 위쪽에 붙인다(위 가장자리·입력 칸이 움직이지 않게)
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={t.searchTitle}
      description={t.searchDescription}
      placement="top"
    >
      {/* 열 때마다 검색어가 비도록 대화상자 안쪽에 상태를 둔다 */}
      <SearchBody {...props} />
    </Dialog>
  );
}

function SearchBody<T extends NamedRegion>(props: SearchDialogProps<T>) {
  const messages = useMessages();
  const t = messages.dashboard.dialogs;
  const [query, setQuery] = useState("");
  const searching = query.trim() !== "";

  return (
    <div className="flex flex-col gap-4">
      <label className="flex h-12 items-center gap-2 rounded-control border border-line bg-wash px-3 focus-within:border-selection focus-within:outline-1 focus-within:outline-selection">
        <SearchIcon className="size-4 shrink-0 text-muted" />
        <span className="sr-only">{t.searchTitle}</span>
        <input
          type="search"
          // 대화상자를 열면 바로 입력할 수 있게 한다(`Dialog`가 열린 직후 이 칸으로 포커스를 옮긴다)
          data-autofocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={messages.dashboard.controls.searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
        />
      </label>

      <CountryTree {...props} withChildren={!searching} />
      {searching ? <SearchResults {...props} query={query} /> : <p className="px-3 text-xs text-muted">{t.searchHint}</p>}
    </div>
  );
}

/** 나라 줄들. 입력 전에는 `regions` 나라 아래에 시·도를 들여 쓴다(왼쪽 선이 소속을 보인다). */
function CountryTree<T extends NamedRegion>({
  countries,
  regionsCountry,
  regions,
  index,
  currentRegionId,
  levelName,
  onPickCountry,
  onPickRegion,
  withChildren,
}: SearchDialogProps<T> & { withChildren: boolean }) {
  const t = useMessages().dashboard.dialogs;
  const locale = useLocale();
  const provinces = withChildren ? sortByName(regions.filter((r) => r.level === "prov"), index, locale) : [];

  return (
    <section aria-label={t.countriesHeading} className="flex flex-col gap-1">
      {countries.map((c) => (
        <div key={c.code} className="flex flex-col gap-1">
          <MenuRow title={c.label} sub={c.sub} selected={c.selected} onSelect={() => onPickCountry(c.code)} />
          {c.code === regionsCountry && provinces.length > 0 && (
            <ul role="list" aria-label={c.label} className="ml-4 flex flex-col gap-1 border-l border-border pl-2">
              {provinces.map((p) => (
                <li key={p.id}>
                  {/* 보조 줄에 단계와 소속("시·도 · 대한민국"). 한 줄로 줄여 봤다가 사용자 판단으로 되돌림(2026-11-14) */}
                  <MenuRow
                    title={ownName(p, locale)}
                    sub={[levelName(p), c.label].join(" · ")}
                    selected={p.id === currentRegionId}
                    onSelect={() => onPickRegion(p)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}

function SearchResults<T extends NamedRegion>({
  countries,
  regionsCountry,
  regions,
  index,
  levelName,
  onPickRegion,
  query,
}: SearchDialogProps<T> & { query: string }) {
  const t = useMessages().dashboard.dialogs;
  const locale = useLocale();
  const countryName = countries.find((c) => c.code === regionsCountry)?.label ?? regionsCountry;
  // 나라는 맨 위 나라 줄로 고르므로 검색 대상에서 뺀다("결과 없음"과 20곳 한도가 실제 결과에 맞게)
  const result = searchRegions(
    regions.filter((r) => r.level !== "nat"),
    query,
    index,
  );

  return (
    <section aria-live="polite" className="flex flex-col gap-4 border-t border-border pt-4">
      {result.items.length === 0 && <p className="px-3 text-sm text-muted">{t.noResults}</p>}
      {/* 단계별로 묶는다(시·도 → 시·군·구). "경북"처럼 시·도 이름을 넣으면 소속 시·군·구까지 걸리기 때문 */}
      {LEVEL_ORDER.map((level) => {
        const group = result.items.filter((r) => r.level === level);
        const first = group[0];
        if (first === undefined) return null;
        return (
          <div key={level} className="flex flex-col gap-1">
            <h3 className="px-3 text-xs font-medium text-muted">{levelName(first)}</h3>
            {group.map((region) => (
              <MenuRow
                key={region.id}
                title={ownName(region, locale)}
                sub={ancestorNames(region, index, locale, countryName).join(" · ")}
                onSelect={() => onPickRegion(region)}
              />
            ))}
          </div>
        );
      })}
      {result.truncated && <p className="px-3 text-xs text-muted">{t.truncated}</p>}
    </section>
  );
}
