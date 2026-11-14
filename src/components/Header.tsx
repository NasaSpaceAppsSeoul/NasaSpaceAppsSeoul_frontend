import { Link } from "react-router-dom";
import { useMessages } from "../i18n";
import type { Locale } from "../lib/locale";
import type { RouteSection } from "../lib/route";

/*
 * 머리글 (components/sheet/03-nav-a·b): 왼쪽 워드마크, 가운데 소개·대시보드 알약 메뉴, 오른쪽 EN/KR 전환.
 * 주소를 읽지 않는다. 링크 주소와 선택 상태는 `app`이 만들어 넘긴다.
 */

type NavItem = RouteSection;

type HeaderProps = {
  homeHref: string;
  hrefs: Record<NavItem, string>;
  /** 지금 화면에 맞는 메뉴. 없는 주소 화면처럼 맞는 메뉴가 없으면 `null` */
  current: NavItem | null;
  locale: Locale;
  /** 같은 화면의 다른 언어 주소(쿼리·해시 포함) */
  localeHrefs: Record<Locale, string>;
};

const NAV_ITEMS: NavItem[] = ["about", "dashboard"];
/** 디자인 순서: EN, KR */
const LOCALE_ORDER: Locale[] = ["en", "ko"];

export function Header({ homeHref, hrefs, current, locale, localeHrefs }: HeaderProps) {
  const t = useMessages();
  return (
    // 양옆 칸을 같은 너비(1fr)로 두어 가운데 메뉴가 화면 중앙에 오게 한다(tokens.md "상단 내비는 화면 중앙 기준")
    // 높이 104px(선 포함)과 아래 얇은 구분선: 디자인 시안 v9 `.site-header`(2026-11-14 사용자, 모든 화면)
    <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-header-line h-26">
      <Link to={homeHref} className="justify-self-start text-xl font-medium text-ink">
        {t.brand}
      </Link>

      <nav aria-label={t.nav.label} className="rounded-full bg-nav p-1 ring-1 ring-nav-line">
        <ul className="flex gap-1">
          {NAV_ITEMS.map((item) => {
            const selected = item === current;
            return (
              <li key={item}>
                <Link
                  to={hrefs[item]}
                  aria-current={selected ? "page" : undefined}
                  className={
                    // 크기·전환은 시안 v9 `.primary-nav a`(좌우 16, 위아래 8, 배경 전환 180ms)
                    "block rounded-full px-4 py-2 text-sm font-medium transition-colors duration-180 " +
                    "focus-visible:outline-2 focus-visible:outline-selection " +
                    (selected ? "bg-nav-active text-nav-active-ink" : "text-nav-ink hover:bg-nav-hover")
                  }
                >
                  {t.nav[item]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        role="group"
        aria-label={t.language.label}
        className="flex gap-1 justify-self-end rounded-control border border-segment-line bg-segment p-1"
      >
        {LOCALE_ORDER.map((target) => {
          const selected = target === locale;
          return (
            <Link
              key={target}
              to={localeHrefs[target]}
              lang={target}
              hrefLang={target}
              // 읽히는 이름은 보이는 글자(EN/KR) 그대로 두고, 풀어 쓴 언어 이름은 툴팁으로 보탠다
              title={t.language[`${target}Name`]}
              aria-current={selected ? "true" : undefined}
              className={
                // 크기는 시안 v9 `.language-switch span`(34 × 32, 글자 12)
                "grid h-8 w-8.5 place-items-center rounded-control-sm text-xs font-medium " +
                "focus-visible:outline-2 focus-visible:outline-selection " +
                (selected ? "bg-segment-active text-segment-active-ink" : "text-segment-ink hover:text-ink")
              }
            >
              {t.language[target]}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
