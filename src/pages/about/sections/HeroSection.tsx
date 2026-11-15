import { useState } from "react";
import { Link } from "react-router-dom";
import { ButtonObject } from "../../../components/about/ButtonObject";
import { EarthPanel } from "../../../components/about/EarthPanel";
import { HeroSearchBar } from "../../../components/about/HeroSearchBar";
import { SectionError } from "../../../components/SectionError";
import { useMeta } from "../../../hooks/useMeta";
import { useRegions } from "../../../hooks/useRegions";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { localizePath } from "../../../lib/locale";
import { indexRegions } from "../../../lib/region";
import { HeroDialogs } from "./HeroDialogs";

/*
 * 첫 화면 히어로 (Figma Make `design/extra/landing-hero.jpg`, `plans/about-revise.md` 0·1·10절).
 * 왼쪽 글(작은 제목·큰 제목·설명) → 지역 검색 줄 → 흰 "대시보드 보기" + "작동 방식 보기"(기법 페이지).
 * 예시 줄·나라별 바로가기 버튼·검색 줄 오른쪽 밝은 칸은 뺐다(UI 다듬기 2026-11-15 사용자, 참고 소스 `burnline-landing 4` 히어로).
 * 오른쪽은 3D 지구. 1280(xl) 미만에서는 지구가 글 아래로 내려간다(10절 ④).
 * 검색 줄은 한국 `/regions`·`/meta`를 받은 뒤 연다. 대화상자는 여섯 지역을 찾는다(`HeroDialogs`). 예전 "지역 둘러보기"는 검색에 합쳤다(11절).
 * 받는 동안은 검색 줄을 막고, 실패하면 검색 줄 아래에 구역 에러를 보인다.
 */

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

  return (
    <section className="flex flex-col gap-10 pt-12 pb-8 xl:pt-20">
      {/*
       * xl에서 글 칸은 560px 고정, 지구는 남은 칸(2026-11-14 사용자 결정 A). 비율(42%)로 두면 1280에서 463px라
       * 영문 검색 안내 문구가 잘린다. 글 칸 최대 640px(1절)은 지구가 아래로 내려가는 1024에서 검색 줄이 늘어나지 않게
       */}
      {/*
       * 세로는 위쪽 기준: 가운데 맞춤이면 글 칸 높이(언어마다 다름)에 따라 시작 위치가 언어 전환 때 밀린다(2026-11-15 사용자).
       * 글 칸 위 여백(xl:pt-8)은 지구 칸(600px)과 나란할 때 예전 가운데 위치와 비슷하게 둔 값이다
       */}
      <div className="grid gap-12 xl:grid-cols-[35rem_minmax(0,1fr)] xl:items-start">
        <div className="flex max-w-160 flex-col xl:pt-8">
          {/* 크기·자간·색은 시안 v9 `.eyebrow`·`h1`·`.hero-body` 값(기본 단계에 없는 것은 이유 주석과 임의 값) */}
          <p className="flex items-center gap-3 font-mono text-xs font-medium tracking-[0.08em] text-subtle uppercase">
            {/* 주황 점의 은은한 빛(시안 box-shadow, 장식) */}
            <span aria-hidden="true" className="size-1.5 rounded-full bg-fire shadow-[0_0_14px_rgba(244,122,50,0.7)]" />
            {h.eyebrow}
          </p>
          {/* 제목: 화면 너비에 따라 56~84px, 줄 간격 0.98, 자간 −0.052em(시안 h1) */}
          <h1 className="mt-7 max-w-150 text-[clamp(56px,5.7vw,84px)] leading-[0.98] font-medium tracking-[-0.052em] whitespace-pre-line">
            {h.title}
          </h1>
          {/* 설명: 최대 435px(시안 .hero-body) */}
          <p className="mt-8 max-w-[435px] text-lg text-subtle">{h.lead}</p>

          {/* 참고 `.hero-search`: 설명 아래 32 */}
          <div className="mt-8">
            <HeroSearchBar
              prompt={h.searchPrompt}
              label={`${h.find}, ${t.dashboard.controls.searchPlaceholder}`}
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
          ) : null}
          {/*
           * 참고 `.hero-actions`(검색 줄 아래 24, 사이 16): 흰 "대시보드 보기"(`.dashboard-button--light`, 높이 56·최소 224·둥근 12·15/500)
           * + "작동 방식 보기 →"(`.text-button`, 14px #b2b3b7). 나라별 바로가기 버튼은 뺐다(UI 다듬기 2026-11-15 사용자)
           */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              to={localizePath("/dashboard", locale)}
              className={
                "group inline-flex h-14 min-w-56 items-center justify-between gap-4 rounded-xl bg-[#f6f6f3] py-2 pr-2 pl-5 " +
                "text-[15px] font-medium whitespace-nowrap text-[#050506] " +
                "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-selection"
              }
            >
              {h.dashboard}
              <ButtonObject />
            </Link>
            <Link
              to={localizePath("/method", locale)}
              className="inline-flex h-14 items-center gap-2 text-sm whitespace-nowrap text-[#b2b3b7] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-selection"
            >
              {h.howItWorks}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
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
