import { Navigate, useLocation, type RouteObject } from "react-router-dom";
import { AboutPage } from "../pages/about/AboutPage";
import { DashboardPage } from "../pages/dashboard/DashboardPage";
import { InsightPage } from "../pages/insight/InsightPage";
import { NotFoundPage } from "../pages/not-found/NotFoundPage";
import { RouteErrorPage } from "../pages/route-error/RouteErrorPage";
import { DEFAULT_COUNTRY } from "../lib/country";
import { RootLayout } from "./RootLayout";

/** 나라를 고르지 않고 대시보드로 오면 기본 나라(한국)로 보낸다. 고른 달(`?month=`)을 잃지 않도록 쿼리와 해시를 그대로 들고 넘어간다. */
function DefaultCountryRedirect() {
  const { search, hash } = useLocation();
  return <Navigate to={{ pathname: DEFAULT_COUNTRY, search, hash }} replace />;
}

/**
 * 언어와 상관없이 같은 화면 목록.
 * 고른 값은 주소가 원본이다: 나라와 지역은 경로에, 달은 `?month=YYYY-MM`에 둔다.
 */
const pages: RouteObject[] = [
  { index: true, element: <AboutPage /> },
  { path: "dashboard", element: <DefaultCountryRedirect /> },
  { path: "dashboard/:country", element: <DashboardPage /> },
  { path: "dashboard/:country/:regionId", element: <DashboardPage /> },
  { path: "insight/:country/:regionId", element: <InsightPage /> },
  { path: "*", element: <NotFoundPage /> },
];

/**
 * 한글은 `/`, 영어는 `/en` 아래에 같은 화면을 둔다.
 * `/en`은 대소문자를 구분한다. `lib/locale`이 주소에서 언어를 읽는 방식과 같아야 한다.
 *
 * 화면을 그리다 난 예외는 경로 없는 자식 층(`errorElement`)에서 받는다.
 * 뿌리에 달면 `RootLayout`을 통째로 대신해 언어(`LocaleProvider`)와 머리글·푸터를 잃는다.
 * 화면 목록을 받는 함수로 둔 것은 테스트가 예외를 던지는 화면을 넣어 이 동작을 확인하기 위해서다.
 */
export function localeRoutes(children: RouteObject[]): RouteObject[] {
  const guarded: RouteObject[] = [{ errorElement: <RouteErrorPage />, children }];
  return [
    { path: "/", element: <RootLayout locale="ko" />, children: guarded },
    { path: "/en", caseSensitive: true, element: <RootLayout locale="en" />, children: guarded },
  ];
}

export const routes: RouteObject[] = localeRoutes(pages);
