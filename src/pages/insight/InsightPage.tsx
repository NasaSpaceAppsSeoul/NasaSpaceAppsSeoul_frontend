import { useMessages } from "../../i18n";

export function InsightPage() {
  const t = useMessages();
  return (
    <main className="mx-auto max-w-360 px-6 py-12 lg:px-16">
      <h1 className="text-title-lg">{t.pages.insight}</h1>
    </main>
  );
}
