import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { useMeta } from "../hooks/useMeta";
import { LocaleProvider } from "../i18n";
import { DEFAULT_COUNTRY } from "../lib/country";
import { localizePath, switchLocalePath, type Locale } from "../lib/locale";
import { routeInfo, routeTheme } from "../lib/route";
import { CosmicBackdrop } from "../components/CosmicBackdrop";

/** 머리글·화면·푸터(목 모드 표시 줄은 2026-11-14 사용자가 뺌, `decisions.md` 10-9). 머리글과 푸터에 넘길 값은 여기서 주소로 만든다(컴포넌트는 주소를 읽지 않는다). */
function Shell({ locale }: { locale: Locale }) {
  const { pathname, search, hash } = useLocation();
  const { section, country } = routeInfo(pathname);
  // 푸터의 출처·처리일: 주소의 나라, 나라가 없는 화면(소개 등)은 한국 (2026-11-14 사용자 결정)
  const meta = useMeta(country ?? DEFAULT_COUNTRY);

  // 언어를 바꿔도 고른 달(`?month=`)과 위치(해시)를 들고 간다 (`decisions.md` 1-7)
  const localeHref = (target: Locale) => `${switchLocalePath(pathname, target)}${search}${hash}`;

  return (
    // 폭: 소개 구역(첫 화면)은 시안 v9처럼 내용 최대 1200px + 좌우 48px(= 1296px).
    // 대시보드·인사이트는 8-3에서 시안 폭(1280px)으로 맞출 때까지 지금 폭
    <div
      className={
        "mx-auto flex min-h-screen flex-col " + (section === "about" ? "max-w-324 px-12" : "max-w-360 px-6 lg:px-16")
      }
    >
      <Header
        homeHref={localizePath("/", locale)}
        hrefs={{ about: localizePath("/", locale), dashboard: localizePath("/dashboard", locale) }}
        current={section}
        locale={locale}
        localeHrefs={{ ko: localeHref("ko"), en: localeHref("en") }}
      />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer sources={meta.data?.sources} processedOn={meta.data?.generated_at?.slice(0, 10)} />
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
  const { pathname } = useLocation();
  return (
    <LocaleProvider locale={locale}>
      {/* `isolate`: 고정 우주 배경(z -1)이 화면 내용 뒤, 바탕색 위에 놓이게 */}
      <div lang={locale} className="isolate min-h-screen">
        {/*
         * 우주 배경은 어두운 테마 화면에만(지금은 첫 화면). 8-3에서 모든 화면이 어두워지면 조건을 뺀다
         * (`plans/cosmic-redesign.md` 7-4)
         */}
        {routeTheme(pathname) === "dark" && <CosmicBackdrop />}
        <Shell locale={locale} />
      </div>
    </LocaleProvider>
  );
}
