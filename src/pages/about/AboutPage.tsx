import { useMessages } from "../../i18n";

export function AboutPage() {
  const t = useMessages();
  return (
    <main className="mx-auto max-w-360 px-6 py-12 lg:px-16">
      <h1 className="text-title-lg">{t.pages.about}</h1>
    </main>
  );
}
