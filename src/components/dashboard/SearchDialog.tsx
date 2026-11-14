import { useState } from "react";
import { useLocale, useMessages } from "../../i18n";
import { regionName, searchRegions, type NamedRegion, type RegionIndex, type RegionLevel } from "../../lib/region";
import { Dialog } from "../Dialog";
import { SearchIcon } from "../icons";
import { MenuRow } from "../MenuRow";

/*
 * 지역 검색 (overlays/kr/search.png). 맨 위에 나라 3개를 늘 둔다(2-2). 입력하면 지금 나라의 `/regions`에서 거른다(7-3).
 */
export type CountryOption = { code: string; label: string; selected: boolean };

/** 나라는 맨 위 나라 버튼으로 고르므로 결과 묶음에는 시·도와 시·군·구만 둔다. */
const LEVEL_ORDER: RegionLevel[] = ["prov", "dist"];

type SearchDialogProps<T extends NamedRegion> = {
  open: boolean;
  onClose: () => void;
  countries: CountryOption[];
  regions: readonly T[];
  index: RegionIndex;
  /** 결과 줄의 보조 글자(단계 이름) */
  levelName: (region: T) => string;
  onPickCountry: (code: string) => void;
  onPickRegion: (region: T) => void;
};

export function SearchDialog<T extends NamedRegion>(props: SearchDialogProps<T>) {
  const t = useMessages().dashboard.dialogs;
  return (
    <Dialog open={props.open} onClose={props.onClose} title={t.searchTitle} description={t.searchDescription}>
      {/* 열 때마다 검색어가 비도록 대화상자 안쪽에 상태를 둔다 */}
      <SearchBody {...props} />
    </Dialog>
  );
}

function SearchBody<T extends NamedRegion>({ countries, regions, index, levelName, onPickCountry, onPickRegion }: SearchDialogProps<T>) {
  const messages = useMessages();
  const t = messages.dashboard.dialogs;
  const locale = useLocale();
  const [query, setQuery] = useState("");
  // 나라는 맨 위 나라 버튼으로 고르므로 검색 대상에서 뺀다("결과 없음"과 20곳 한도가 실제 결과에 맞게)
  const result = searchRegions(
    regions.filter((r) => r.level !== "nat"),
    query,
    index,
  );

  return (
    <div className="flex flex-col gap-4">
      <label className="flex h-12 items-center gap-2 rounded-control border border-border px-3 focus-within:border-selection focus-within:outline-1 focus-within:outline-selection">
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

      <section aria-label={t.countriesHeading} className="flex flex-col gap-1">
        {countries.map((c) => (
          <MenuRow key={c.code} title={c.label} selected={c.selected} onSelect={() => onPickCountry(c.code)} />
        ))}
      </section>

      {query.trim() !== "" && (
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
                  <MenuRow key={region.id} title={regionName(region, index, locale)} onSelect={() => onPickRegion(region)} />
                ))}
              </div>
            );
          })}
          {result.truncated && <p className="px-3 text-xs text-muted">{t.truncated}</p>}
        </section>
      )}
    </div>
  );
}
