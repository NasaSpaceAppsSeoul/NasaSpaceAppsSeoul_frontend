import { useState } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { anchorHash, PageAnchorContext, type PageAnchor } from "../hooks/usePageAnchor";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { LocaleProvider } from "../i18n";
import { localizePath, switchLocalePath, type Locale } from "../lib/locale";
import { CosmicBackdrop } from "../components/CosmicBackdrop";

/** 머리글·화면·푸터(목 모드 표시 줄은 2026-11-14 사용자가 뺌, `decisions.md` 10-9). 머리글에 넘길 값은 여기서 주소로 만든다(컴포넌트는 주소를 읽지 않는다). 푸터는 고정 문구다. */
function Shell({ locale }: { locale: Locale }) {
  const { pathname, search, hash } = useLocation();
  // 화면이 알려 준 지금 보는 절(기법 페이지 목차, `hooks/usePageAnchor`). 없으면 주소의 해시
  const [anchor, setAnchor] = useState<PageAnchor>(undefined);

  // 언어를 바꿔도 고른 달(`?month=`)과 위치(해시)를 들고 간다 (`decisions.md` 1-7)
  const position = anchorHash(anchor, hash);
  const localeHref = (target: Locale) => `${switchLocalePath(pathname, target)}${search}${position}`;

  return (
    // 폭: 모든 화면이 같은 틀이라 머리글·푸터 위치가 화면마다 같다(2026-11-15 사용자).
    // 시안 대시보드 `.db-shell` 값: 내용 최대 1280px + 좌우 48px(= 1376px), 1120px 이하 좌우 32px.
    // (시안 첫 화면은 1200px였지만 화면마다 머리글이 40px씩 어긋나 하나로 맞췄다)
    <div className="mx-auto flex min-h-screen max-w-344 flex-col px-8 min-[1121px]:px-12">
      <Header
        homeHref={localizePath("/", locale)}
        locale={locale}
        localeHrefs={{ ko: localeHref("ko"), en: localeHref("en") }}
      />
      {/* 첫 화면 ↔ 대시보드 슬라이드는 이 칸만 움직인다(머리글·푸터·우주 배경은 고정, `app/routeTransition.ts`) */}
      <div className="route-page flex-1">
        <PageAnchorContext.Provider value={setAnchor}>
          <Outlet />
        </PageAnchorContext.Provider>
      </div>
      <Footer />
      {/*
       * 새 주소는 맨 위, 뒤로 가기는 보던 위치(`plans/about-revise.md` 10절 ⑥).
       * 대시보드·인사이트 안에서 달·지역을 고르는 이동은 `preventScrollReset`으로 위치를 그대로 둔다
       */}
      <ScrollRestoration />
    </div>
  );
}

/** 언어별 라우트 묶음의 뿌리. 주소가 정한 언어를 아래로 내려 준다. */
export function RootLayout({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider locale={locale}>
      {/* `isolate`: 고정 우주 배경(z -1)이 화면 내용 뒤, 바탕색 위에 놓이게 */}
      <div lang={locale} className="isolate min-h-screen">
        {/* 우주 배경은 모든 화면 뒤에 고정으로 한 장(`plans/cosmic-redesign.md` 8절) */}
        <CosmicBackdrop />
        <Shell locale={locale} />
      </div>
    </LocaleProvider>
  );
}
