import { Outlet } from "react-router-dom";
import { LocaleProvider } from "../i18n";
import type { Locale } from "../lib/locale";

/** 언어별 라우트 묶음의 뿌리. 주소가 정한 언어를 아래로 내려 준다. */
export function RootLayout({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider locale={locale}>
      <div lang={locale} className="min-h-screen">
        <Outlet />
      </div>
    </LocaleProvider>
  );
}
