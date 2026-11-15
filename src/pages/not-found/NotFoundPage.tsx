import { NotFound } from "../../components/NotFound";
import { useLocale } from "../../i18n";
import { localizePath } from "../../lib/locale";

export function NotFoundPage() {
  return <NotFound homeHref={localizePath("/", useLocale())} />;
}
