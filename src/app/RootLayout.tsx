import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { apiMode } from "../api/client";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { MockBanner } from "../components/MockBanner";
import { useMeta } from "../hooks/useMeta";
import { LocaleProvider } from "../i18n";
import { DEFAULT_COUNTRY } from "../lib/country";
import { localizePath, switchLocalePath, type Locale } from "../lib/locale";
import { routeInfo } from "../lib/route";

/** 머리글·목 표시 줄·화면·푸터. 머리글과 푸터에 넘길 값은 여기서 주소로 만든다(컴포넌트는 주소를 읽지 않는다). */
function Shell({ locale }: { locale: Locale }) {
  const { pathname, search, hash } = useLocation();
  const { section, country } = routeInfo(pathname);
  // 푸터의 출처·처리일: 주소의 나라, 나라가 없는 화면(소개 등)은 한국 (2026-11-14 사용자 결정)
  const meta = useMeta(country ?? DEFAULT_COUNTRY);

  // 언어를 바꿔도 고른 달(`?month=`)과 위치(해시)를 들고 간다 (`decisions.md` 1-7)
  const localeHref = (target: Locale) => `${switchLocalePath(pathname, target)}${search}${hash}`;

  return (
    <div className="mx-auto flex min-h-screen max-w-360 flex-col px-6 lg:px-16">
      <Header
        homeHref={localizePath("/", locale)}
        hrefs={{ about: localizePath("/", locale), dashboard: localizePath("/dashboard", locale) }}
        current={section}
        locale={locale}
        localeHrefs={{ ko: localeHref("ko"), en: localeHref("en") }}
      />
      {apiMode() === "mock" && <MockBanner />}
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
  return (
    <LocaleProvider locale={locale}>
      <div lang={locale} className="min-h-screen">
        <Shell locale={locale} />
      </div>
    </LocaleProvider>
  );
}
