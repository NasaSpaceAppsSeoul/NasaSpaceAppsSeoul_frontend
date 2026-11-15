import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLocale, useMessages } from "../../i18n";
import {
  ancestorNames,
  ownName,
  searchRegions,
  sortByName,
  type NamedRegion,
  type RegionIndex,
  type RegionLevel,
  type SearchResult,
} from "../../lib/region";
import { Dialog } from "../Dialog";
import { SearchIcon } from "../icons";
import { MenuRow } from "../MenuRow";

/*
 * 지역 검색 (overlays/kr/search.png). 첫 화면 히어로와 대시보드 선택 줄이 같이 쓴다.
 * - 입력 전: 나라 3개(2-2) 계층 목록. `regions`의 나라 줄 아래에 그 나라 시·도를 들여 써서 소속을 보인다.
 *   더 작은 지역은 입력해 찾는다는 안내를 끝에 둔다(`plans/about-revise.md` 11절).
 * - 입력 후: 찾은 것만 위에 둔다. 이름이 맞는 나라 줄만 남기고, 그 아래 `/regions`에서 거른 결과(7-3)를 묶는다(UI 다듬기 2026-11-15).
 *   결과 줄은 자기 이름 + 보조 줄에 소속("경북 · 대한민국").
 * - 나라 칩(첫 화면만, `chips`): 검색 칸 위. 부르는 쪽이 고른 나라에 맞춰 목록 자료를 바꾼다(UI 다듬기 2026-11-15, 참고 `PlaceSearch`).
 * - 키보드(두 화면 모두): 검색 칸에서 ↑↓로 목록 줄 강조를 옮기고 Enter로 연다. 한글 조합 중 Enter는 무시. Esc는 `Dialog`가 닫는다.
 *   강조 기본값은 없음(첫 ↓가 첫 줄). 같은 이름이 여러 곳일 수 있어 입력해도 자동으로 고르지 않고, 결과가 하나뿐일 때만 그 줄을 강조한다.
 *   강조가 없으면 Enter는 아무것도 열지 않는다.
 *   아래에 "↑ ↓ 이동 · Enter 열기 · Esc 닫기"(참고 `.ps-footer`).
 */
export type CountryOption = {
  code: string;
  label: string;
  selected: boolean;
  /** 나라 줄 보조 글자(예: "나라 대시보드 · 2026년 10월까지 자료"). 없으면 한 줄 */
  sub?: string;
};

/** 검색 칸 위 나라 칩. `value`가 `null`이면 "전체"(대화상자 처음 모습) */
export type SearchChips = {
  options: { code: string; label: string; sub?: string }[];
  value: string | null;
  onChange: (code: string | null) => void;
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
  chips?: SearchChips;
  /** 목록 아래 알림(칩으로 고른 나라의 `/regions`를 받지 못했을 때 구역 에러 등) */
  notice?: ReactNode;
  /** 입력 전 나라 줄 아래에 시·도 등을 펼칠지(기본 펼침). 첫 화면 "전체"는 나라 줄만(사용자 2026-11-15) */
  withTree?: boolean;
  /**
   * `regions`가 여러 나라 것일 때 지역의 나라 이름(첫 화면 "전체" 검색). 주면 결과를 나라별로 묶고(나라 줄 순서),
   * 보조 줄에 단계와 소속("시·군·구 · 경북 · 대한민국")을 쓴다
   */
  regionCountry?: (region: T) => string;
};

/**
 * 키보드로 고를 줄 목록. 렌더할 때 그리는 순서대로 줄을 등록해 강조 번호와 Enter 동작을 맞춘다.
 * 렌더마다 새로 만드는 지역 객체라 렌더 밖으로 새지 않는다.
 */
type Rows = { listId: string; active: number; actions: (() => void)[] };

function rowProps(rows: Rows, onSelect: () => void) {
  const i = rows.actions.push(onSelect) - 1;
  return { id: `${rows.listId}-${i}`, active: i === rows.active, onSelect };
}

export function SearchDialog<T extends NamedRegion>(props: SearchDialogProps<T>) {
  const t = useMessages().dashboard.dialogs;
  return (
    // 위쪽에 붙이고 높이를 고정한다(결과 수가 바뀌어도 위 가장자리·입력 칸·아래 안내가 움직이지 않게)
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title={t.searchTitle}
      description={t.searchDescription}
      placement="top"
      // 높이를 고정하고 목록만 스크롤한다(제목·칩·검색 칸·아래 안내는 제자리, 참고 `.ps-modal`, UI 다듬기 2026-11-15)
      fixedHeight
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
  /**
   * 키보드로 옮긴 강조. `null`이면 기본: 강조 없음(열자마자 누른 Enter가 페이지를 옮기지 않게, 첫 ↓가 첫 줄).
   * 입력 중 결과가 하나뿐이면 그 결과
   */
  const [moved, setActive] = useState<number | null>(null);
  const listId = useId();
  const keysId = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const locale = useLocale();
  const searching = query.trim() !== "";
  // 나라는 맨 위 나라 줄로 고르므로 검색 대상에서 뺀다("결과 없음"과 20곳 한도가 실제 결과에 맞게)
  const result = searching ? searchRegions(props.regions.filter((r) => r.level !== "nat"), query, props.index) : null;
  // 같은 이름이 여러 곳일 수 있어("동구": 광주·대구·울산…) 자동으로 고르지 않는다. 결과가 하나뿐일 때만 그 줄을 강조(사용자 2026-11-15)
  // 입력 중에는 찾은 것만 위에 둔다: 이름이 맞는 나라 줄 → 지역 결과(사용자 2026-11-15). 지우면 원래 목록
  const needle = query.trim().toLowerCase().replace(/\s+/g, "");
  const shownCountries = searching
    ? props.countries.filter((c) => c.label.toLowerCase().replace(/\s+/g, "").includes(needle) || c.code.toLowerCase() === needle)
    : props.countries;
  const shown = { ...props, countries: shownCountries };
  const wanted = moved ?? (result !== null && shownCountries.length + result.items.length === 1 ? 0 : -1);

  // 목록은 여기서 바로 그린다(자식 컴포넌트로 두면 줄 등록이 이 렌더 뒤에 일어나 줄 수를 모른다)
  const rows: Rows = { listId, active: wanted, actions: [] };
  const ctx: ListContext = { t, locale, rows };
  // 시·도가 없는 나라는 처음 목록에 카운티 등을 이미 펼치므로 "입력해 찾으세요" 안내를 뺀다
  const listsDistricts = !props.regions.some((r) => r.level === "prov") && props.regions.some((r) => r.level === "dist");
  const list = (
    <>
      {countryTree(shown, ctx, !searching && (props.withTree ?? true))}
      {searching
        ? searchResults(props, ctx, result ?? { items: [], truncated: false }, shownCountries.length > 0)
        : !listsDistricts && props.notice === undefined && (props.withTree ?? true) && <p className="px-3 text-xs text-muted">{t.searchHint}</p>}
    </>
  );
  const count = rows.actions.length;
  // 강조가 그려진 줄(없으면 -1: 검색 결과가 없을 때 Enter가 엉뚱한 나라 줄을 열지 않게)
  const active = wanted >= 0 && wanted < count ? wanted : -1;

  const move = (next: number) => {
    setActive(next);
    // 그린 뒤 강조 줄이 목록 밖이면 보이게 굴린다
    requestAnimationFrame(() => document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" }));
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합을 마치는 Enter가 줄까지 열지 않게(참고 `PlaceSearch`)
    if (event.nativeEvent.isComposing || event.keyCode === 229 || count === 0) return;
    const from = active === -1 ? count : active;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      move(Math.min(count - 1, active + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      move(Math.max(0, from - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      rows.actions[active]?.();
    }
  };
  const reset = () => setActive(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {props.chips !== undefined && (
        <Chips
          chips={props.chips}
          onChange={(code) => {
            reset();
            if (scroller.current !== null) scroller.current.scrollTop = 0;
            props.chips?.onChange(code);
          }}
        />
      )}
      <label className="flex h-12 items-center gap-2 rounded-control border border-line bg-wash px-3 focus-within:border-selection focus-within:outline-1 focus-within:outline-selection">
        <SearchIcon className="size-4 shrink-0 text-muted" />
        <span className="sr-only">{t.searchTitle}</span>
        <input
          type="search"
          // 대화상자를 열면 바로 입력할 수 있게 한다(`Dialog`가 열린 직후 이 칸으로 포커스를 옮긴다)
          data-autofocus
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            reset();
          }}
          onKeyDown={onKeyDown}
          aria-describedby={keysId}
          // 화면 낭독기에 키보드 강조 줄을 알린다
          aria-controls={`${listId}-list`}
          aria-activedescendant={active === -1 ? undefined : `${listId}-${active}`}
          placeholder={messages.dashboard.controls.searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
        />
      </label>

      {/* 목록만 스크롤(참고 `.ps-results`: 최소 72, 남은 높이, 끝에서 바깥으로 스크롤이 넘지 않게). 초점 고리가 잘리지 않게 안쪽 여백 */}
      <div ref={scroller} id={`${listId}-list`} className="-mx-1 min-h-18 flex-1 overflow-y-auto overscroll-contain px-1 py-0.5">
        <div className="flex flex-col gap-4">
          {list}
          {props.notice}
        </div>
      </div>
      {/* 참고 `.ps-footer`: 위 선 흰 8%, 12px, #8e98a6 */}
      <p id={keysId} className="border-t border-white/8 pt-3 text-xs text-[#8e98a6]">
        {t.searchKeys}
      </p>
    </div>
  );
}

/** 검색 칸 위 나라 칩(참고 `.ps-countries`: 높이 34, 둥근 끝, 13px, 고르면 흰 바탕). 고르면 검색 칸으로 초점 */
function Chips({ chips, onChange }: { chips: SearchChips; onChange: (code: string | null) => void }) {
  const t = useMessages().dashboard.dialogs;
  const focusInput = (button: HTMLElement) =>
    button.closest("dialog")?.querySelector<HTMLInputElement>("[data-autofocus]")?.focus();
  const chip = (key: string, code: string | null, label: string, sub?: string) => {
    const on = chips.value === code;
    return (
      <button
        key={key}
        type="button"
        aria-pressed={on}
        onClick={(event) => {
          onChange(code);
          focusInput(event.currentTarget);
        }}
        className={
          "inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[13px] leading-none whitespace-nowrap " +
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-selection " +
          (on ? "border-[#f2f4f7] bg-[#f2f4f7] text-[#11161d]" : "border-white/14 text-[#c9d0da] hover:border-white/30")
        }
      >
        {label}
        {sub !== undefined && (
          <small className={`inline-flex items-center gap-1.5 text-xs leading-none ${on ? "text-[#4b5562]" : "text-[#8e98a6]"}`}>
            <span aria-hidden="true">·</span>
            {sub}
          </small>
        )}
      </button>
    );
  };
  return (
    <div role="group" aria-label={t.chipsLabel} className="flex flex-wrap gap-1.5">
      {chip("all", null, t.chipAll)}
      {chips.options.map((o) => chip(o.code, o.code, o.label, o.sub))}
    </div>
  );
}

type ListContext = { t: ReturnType<typeof useMessages>["dashboard"]["dialogs"]; locale: ReturnType<typeof useLocale>; rows: Rows };

/** 나라 줄들. 입력 전에는 `regions` 나라 아래에 시·도를 들여 쓴다(왼쪽 선이 소속을 보인다). */
function countryTree<T extends NamedRegion>(
  { countries, regionsCountry, regions, index, currentRegionId, levelName, onPickCountry, onPickRegion }: SearchDialogProps<T>,
  { t, locale, rows }: ListContext,
  withChildren: boolean,
) {
  // 나라 줄 아래 첫 단계: 시·도가 있으면 시·도, 없는 나라(캘리포니아·BC·NSW, `single`)는 그 아래 단계(카운티 등)를 들여 쓴다(UI 다듬기 2026-11-15)
  const childLevel: RegionLevel = regions.some((r) => r.level === "prov") ? "prov" : "dist";
  const provinces = withChildren ? sortByName(regions.filter((r) => r.level === childLevel), index, locale) : [];

  return (
    <section aria-label={t.countriesHeading} className="flex flex-col gap-1">
      {countries.map((c) => (
        <div key={c.code} className="flex flex-col gap-1">
          <MenuRow title={c.label} sub={c.sub} selected={c.selected} {...rowProps(rows, () => onPickCountry(c.code))} />
          {c.code === regionsCountry && provinces.length > 0 && (
            <ul role="list" aria-label={c.label} className="ml-4 flex flex-col gap-1 border-l border-border pl-2">
              {provinces.map((p) => (
                <li key={p.id}>
                  {/* 보조 줄에 단계와 소속("시·도 · 대한민국"). 한 줄로 줄여 봤다가 사용자 판단으로 되돌림(2026-11-14) */}
                  <MenuRow
                    title={ownName(p, locale)}
                    sub={[levelName(p), c.label].join(" · ")}
                    selected={p.id === currentRegionId}
                    {...rowProps(rows, () => onPickRegion(p))}
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

function searchResults<T extends NamedRegion>(
  { countries, regionsCountry, index, levelName, onPickRegion, notice, regionCountry }: SearchDialogProps<T>,
  { t, locale, rows }: ListContext,
  result: SearchResult<T>,
  /** 위에 나라 줄이 남아 있으면 구분선을 둔다 */
  divided: boolean,
) {
  const countryName = countries.find((c) => c.code === regionsCountry)?.label ?? regionsCountry;

  return (
    <section aria-live="polite" className={`flex flex-col gap-4 ${divided ? "border-t border-border pt-4" : ""}`}>
      {/* 목록을 받는 중이거나 받지 못했으면(부르는 쪽 `notice`) "결과 없음"이라 말하지 않는다 */}
      {result.items.length === 0 && !divided && notice === undefined && <p className="px-3 text-sm text-muted">{t.noResults}</p>}
      {/* 여러 나라 검색("전체"): 나라별로 묶고, 보조 줄에 단계와 소속. 같은 이름이 나라 사이에도 있어 나라를 먼저 보인다 */}
      {regionCountry !== undefined &&
        countries.map((c) => {
          const group = result.items.filter((r) => regionCountry(r) === c.label);
          if (group.length === 0) return null;
          return (
            <div key={c.code} className="flex flex-col gap-1">
              <h3 className="px-3 text-xs font-medium text-muted">{c.label}</h3>
              {group.map((region) => (
                <MenuRow
                  key={region.id}
                  title={ownName(region, locale)}
                  sub={[levelName(region), ...ancestorNames(region, index, locale, c.label)].join(" · ")}
                  {...rowProps(rows, () => onPickRegion(region))}
                />
              ))}
            </div>
          );
        })}
      {/* 단계별로 묶는다(시·도 → 시·군·구). "경북"처럼 시·도 이름을 넣으면 소속 시·군·구까지 걸리기 때문 */}
      {regionCountry === undefined && LEVEL_ORDER.map((level) => {
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
                {...rowProps(rows, () => onPickRegion(region))}
              />
            ))}
          </div>
        );
      })}
      {result.truncated && <p className="px-3 text-xs text-muted">{t.truncated}</p>}
    </section>
  );
}
