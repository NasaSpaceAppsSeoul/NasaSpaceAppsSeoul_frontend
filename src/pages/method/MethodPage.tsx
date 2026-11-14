import { MethodHero } from "../../components/method/MethodHero";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import { useLocale } from "../../i18n";
import { useMethodMessages } from "../../i18n/method";
import { localizePath } from "../../lib/locale";
import { MethodContents } from "./sections/MethodContents";

/*
 * 기법·팀 인사이트 페이지 (`/method`, `plans/method-page.md` 12절). 머리 + 본문(목차와 절)을 배치한다.
 * 해시로 들어오거나 목차를 누르면 그 절로 옮긴다(`MethodContents`·`useActiveSection`).
 * 스크롤 등장 묶음은 첫 화면처럼 페이지가 붙인다(`AboutPage`와 같은 방식).
 */
export function MethodPage() {
  const t = useMethodMessages();
  const locale = useLocale();
  const reveal = useScrollReveal();

  return (
    <main ref={reveal} className="flex flex-col pb-30">
      <MethodHero
        backHref={localizePath("/", locale)}
        back={t.back}
        eyebrow={t.eyebrow}
        title={t.title}
        lead={t.lead}
        stats={t.stats}
        statsLabel={t.statsLabel}
      />
      <MethodContents />
    </main>
  );
}
