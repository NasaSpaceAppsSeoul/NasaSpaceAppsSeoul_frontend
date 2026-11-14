import { useMessages } from "../../i18n";

export function DashboardPage() {
  const t = useMessages();
  return (
    <main className="mx-auto max-w-360 px-6 py-12 lg:px-16">
      <h1 className="text-title-lg">{t.pages.dashboard}</h1>
    </main>
  );
}
