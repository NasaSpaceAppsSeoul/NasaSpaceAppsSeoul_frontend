import { useParams, useSearchParams } from "react-router-dom";
import { NotFound } from "../../components/NotFound";
import { useLocale, useMessages } from "../../i18n";
import { parseCountry } from "../../lib/country";
import { localizePath } from "../../lib/locale";
import { parseMonthParam } from "../../lib/month";

export function DashboardPage() {
  const t = useMessages();
  const locale = useLocale();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const country = parseCountry(params.country);
  const month = parseMonthParam(searchParams.get("month"));

  // 잘못된 나라 코드·달 형식은 서버에 보내지 않고 없는 주소로 안내한다 (`decisions.md` 1-5)
  if (country === null || !month.valid) return <NotFound homeHref={localizePath("/", locale)} />;

  return (
    <main className="py-12">
      <h1 className="text-title-lg">{t.pages.dashboard}</h1>
    </main>
  );
}
