import { NotFound } from "../../components/NotFound";
import { useDashboardParams } from "../../hooks/useDashboardParams";
import { useLocale, useMessages } from "../../i18n";
import { localizePath } from "../../lib/locale";

export function InsightPage() {
  const t = useMessages();
  const locale = useLocale();
  const params = useDashboardParams();

  // 잘못된 나라 코드·달 형식은 서버에 보내지 않고 없는 주소로 안내한다 (`decisions.md` 1-5)
  if (!params.valid) return <NotFound homeHref={localizePath("/", locale)} />;

  return (
    <main className="py-12">
      <h1 className="text-title-lg">{t.pages.insight}</h1>
    </main>
  );
}
