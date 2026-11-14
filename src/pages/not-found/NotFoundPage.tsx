import { Link } from "react-router-dom";
import { useLocale, useMessages } from "../../i18n";
import { localizePath } from "../../lib/locale";

export function NotFoundPage() {
  const t = useMessages();
  const locale = useLocale();
  return (
    <main className="mx-auto flex max-w-360 flex-col items-start gap-4 px-6 py-12 lg:px-16">
      <h1 className="text-title-lg">{t.notFound.title}</h1>
      <Link className="text-action underline" to={localizePath("/", locale)}>
        {t.notFound.home}
      </Link>
    </main>
  );
}
