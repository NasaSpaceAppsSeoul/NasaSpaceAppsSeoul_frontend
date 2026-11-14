import { useState } from "react";
import { Link } from "react-router-dom";
import { EarthPanel } from "../../../components/about/EarthPanel";
import { HeroSearchBar } from "../../../components/about/HeroSearchBar";
import { SectionError } from "../../../components/SectionError";
import { useMeta } from "../../../hooks/useMeta";
import { useRegions } from "../../../hooks/useRegions";
import { useLocale, useMessages } from "../../../i18n";
import { COUNTRIES } from "../../../lib/country";
import { errorKind } from "../../../lib/errorKind";
import { dashboardPath } from "../../../lib/dashboardPath";
import { localizePath } from "../../../lib/locale";
import { indexRegions, regionName } from "../../../lib/region";
import { CountryButton } from "./CountryButton";
import { HeroDialogs } from "./HeroDialogs";

/*
 * 첫 화면 히어로 (Figma Make `design/extra/landing-hero.jpg`, `plans/about-revise.md` 0·1·10절).
 * 왼쪽 글(작은 제목·큰 제목·설명) → 지역 검색 줄 → 예시 줄 → 나라 버튼 3개 → "작동 방식 보기"(기법 페이지).
 * 오른쪽은 3D 지구. 1280(xl) 미만에서는 지구가 글 아래로 내려간다(10절 ④).
 * 검색은 한국 `/regions`·`/meta`를 쓴다(소개 화면은 한국 고정, `decisions.md` 2-7). 예전 "지역 둘러보기"는 검색에 합쳤다(11절).
 * 받는 동안은 검색 줄을 막고, 실패하면 예시 줄 자리에 구역 에러를 보인다.
 */

/** 예시 지역: [시·도 ID, 한글 이름]. 화면 이름은 받은 `/regions`로 그 언어에 맞게 만든다 */
const EXAMPLES: readonly (readonly [string, string])[] = [
  ["경북", "의성군"],
  ["강원", "고성군"],
  ["대구", "중구"],
];

export function HeroSection() {
  const t = useMessages();
  const locale = useLocale();
  const h = t.about.hero;
  const regions = useRegions("KOR");
  const meta = useMeta("KOR");
  const [searchOpen, setSearchOpen] = useState(false);

  const failed = regions.isError ? regions : meta.isError ? meta : null;
  const ready = regions.isSuccess && meta.isSuccess;
  const items = regions.data?.items ?? [];
  const index = indexRegions(items);
  // 예시 지역(시·도 + 이름으로 찾는다. 같은 이름의 시·군·구가 여러 시·도에 있다). 못 찾은 것은 뺀다
  const examples = EXAMPLES.flatMap(([province, name]) =>
    items.filter((r) => r.level === "dist" && r.province === province && r.label_ko === name),
  );

  return (
    <section className="flex flex-col gap-10 pt-12 pb-8 xl:pt-20">
      {/*
       * xl에서 글 칸은 560px 고정, 지구는 남은 칸(2026-11-14 사용자 결정 A). 비율(42%)로 두면 1280에서 463px라
       * 영문 검색 안내 문구가 잘린다. 글 칸 최대 640px(1절)은 지구가 아래로 내려가는 1024에서 검색 줄이 늘어나지 않게
       */}
      <div className="grid gap-12 xl:grid-cols-[35rem_minmax(0,1fr)] xl:items-center">
        <div className="flex max-w-160 flex-col">
          <p className="flex items-center gap-3 font-mono text-xs font-medium tracking-widest text-muted uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-fire" />
            {h.eyebrow}
          </p>
          <h1 className="mt-7 text-6xl leading-none font-medium tracking-tighter whitespace-pre-line xl:text-7xl">
            {h.title}
          </h1>
          <p className="mt-8 max-w-md text-lg text-muted">{h.lead}</p>

          <div className="mt-10">
            <HeroSearchBar
              placeholder={t.dashboard.controls.searchPlaceholder}
              actionLabel={h.find}
              disabled={!ready}
              onOpen={() => setSearchOpen(true)}
            />
          </div>
          {failed !== null ? (
            <SectionError
              kind={errorKind(failed.error)}
              onRetry={() => {
                if (regions.isError) void regions.refetch();
                if (meta.isError) void meta.refetch();
              }}
              className="mt-4"
            />
          ) : examples.length > 0 ? (
            // 예시는 누르면 그 대시보드로 바로 간다(11절: 예시가 검색 칸의 약속과 맞게)
            <nav aria-label={h.examplesLabel} className="mt-4 flex flex-wrap items-baseline gap-x-2 text-sm text-muted">
              <span aria-hidden="true">{h.examplesLead}</span>
              {examples.map((r, i) => (
                <span key={r.id} className="flex items-baseline gap-2">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  <Link
                    to={dashboardPath(locale, "KOR", r.id)}
                    className="underline decoration-border underline-offset-4 hover:text-ink hover:decoration-ink focus-visible:outline-2 focus-visible:outline-selection"
                  >
                    {regionName(r, index, locale)}
                  </Link>
                </span>
              ))}
            </nav>
          ) : (
            // 받기 전에는 글만. Make는 Mono지만 한글이 Mono에 없어 글자 사이가 벌어져 본문 글꼴로 둔다
            <p className="mt-4 text-sm text-muted">{h.examples}</p>
          )}
          <nav aria-label={h.countriesLabel} className="mt-6">
            <ul className="grid grid-cols-3 gap-2">
              {COUNTRIES.map((country) => (
                <li key={country}>
                  <CountryButton country={country} />
                </li>
              ))}
            </ul>
          </nav>
          <Link
            to={localizePath("/method", locale)}
            className="mt-6 inline-flex items-center gap-2 self-start text-sm text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-selection"
          >
            {h.howItWorks}
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="h-120 xl:h-150">
          <EarthPanel />
        </div>
      </div>

      {/*
       * 다음 구역(01)으로 내려가는 안내. 주소는 바꾸지 않고 화면만 내린다(2026-11-14 사용자 확인):
       * 주소에 `#connected`가 남으면 언어를 바꿀 때 해시를 들고 가는 규칙(`decisions.md` 1-7) 때문에 다시 01로 내려간다.
       * 일반 `<a href>` 이동도 피한다(라우터가 처음 기록 항목과 같은 키로 읽어 스크롤 복원이 옛 위치로 되돌릴 수 있다).
       */}
      <a
        href="#connected"
        onClick={(event) => {
          // 새 탭·새 창 열기(수정키, 왼쪽 버튼 외)는 브라우저에 맡긴다
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const target = document.getElementById("connected");
          if (target === null) return;
          event.preventDefault();
          const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
          // 키보드·화면 낭독기도 01에서 이어 읽게 초점을 옮긴다(스크롤은 위에서 했으니 다시 하지 않는다)
          target.focus({ preventScroll: true });
        }}
        className="flex flex-col items-center gap-3 self-center font-mono text-xs tracking-widest text-muted uppercase hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-selection"
      >
        {h.scrollCue}
        {/* Make `.scroll-cue i`: 흐린 세로선 안에서 밝은 짧은 선이 아래로 흐른다. 움직임 줄이기면 멈춘다 */}
        <span aria-hidden="true" className="relative h-8 w-px overflow-hidden bg-border">
          <span className="absolute top-0 left-0 h-3.5 w-px animate-scroll-line bg-ink motion-reduce:animate-none" />
        </span>
      </a>

      {ready && (
        <HeroDialogs
          open={searchOpen}
          close={() => setSearchOpen(false)}
          regions={regions.data.items}
          index={index}
          meta={meta.data}
        />
      )}
    </section>
  );
}
