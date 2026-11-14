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
import { localizePath } from "../../../lib/locale";
import { CountryButton } from "./CountryButton";
import { HeroDialogs, type HeroDialog } from "./HeroDialogs";

/*
 * 첫 화면 히어로 (Figma Make `design/extra/landing-hero.jpg`, `plans/about-revise.md` 0·1·10절).
 * 왼쪽 글(작은 제목·큰 제목·설명) → 지역 검색 줄 → 예시 줄 → 나라 버튼 3개 → "작동 방식 보기"(기법 페이지).
 * 오른쪽은 3D 지구. 1280(xl) 미만에서는 지구가 글 아래로 내려간다(10절 ④).
 * 검색과 둘러보기는 한국 `/regions`·`/meta`를 쓴다(소개 화면은 한국 고정, `decisions.md` 2-7).
 * 받는 동안은 두 버튼을 막고, 실패하면 예시 줄 자리에 구역 에러를 보인다.
 */
export function HeroSection() {
  const t = useMessages();
  const locale = useLocale();
  const h = t.about.hero;
  const regions = useRegions("KOR");
  const meta = useMeta("KOR");
  const [dialog, setDialog] = useState<HeroDialog>(null);

  const failed = regions.isError ? regions : meta.isError ? meta : null;
  const ready = regions.isSuccess && meta.isSuccess;

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
              browseLabel={h.browse}
              disabled={!ready}
              onSearch={() => setDialog("search")}
              onBrowse={() => setDialog("browse")}
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
          ) : (
            // Make는 Mono지만 한글이 Mono에 없어 글자 사이가 벌어진다. 본문 글꼴로 둔다
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
       * 다음 구역(01)으로 내려가는 안내. 라우터 링크로 해시만 바꾼다: 일반 `<a href="#…">`는 브라우저가 만든 기록 항목을
       * 라우터가 처음 항목과 같은 키로 읽어, 스크롤 복원이 저장된 옛 위치로 되돌릴 수 있다
       */}
      <Link
        to={{ hash: "connected" }}
        className="flex flex-col items-center gap-3 self-center font-mono text-xs tracking-widest text-muted uppercase hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-selection"
      >
        {h.scrollCue}
        {/* Make `.scroll-cue i`: 흐린 세로선 안에서 밝은 짧은 선이 아래로 흐른다. 움직임 줄이기면 멈춘다 */}
        <span aria-hidden="true" className="relative h-8 w-px overflow-hidden bg-border">
          <span className="absolute top-0 left-0 h-3.5 w-px animate-scroll-line bg-ink motion-reduce:animate-none" />
        </span>
      </Link>

      {ready && <HeroDialogs dialog={dialog} close={() => setDialog(null)} regions={regions.data.items} meta={meta.data} />}
    </section>
  );
}
