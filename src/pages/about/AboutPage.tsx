import { useMessages } from "../../i18n";

export function AboutPage() {
  const t = useMessages();
  return (
    <main className="py-12">
      <h1 className="text-title-lg">{t.pages.about}</h1>
    </main>
  );
}
