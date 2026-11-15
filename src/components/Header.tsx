import { Link } from "react-router-dom";
import { useMessages } from "../i18n";
import type { Locale } from "../lib/locale";

/*
 * 머리글 (components/sheet/03-nav-a·b): 왼쪽 워드마크(첫 화면으로), 오른쪽 EN/KR 전환.
 * 가운데 소개·대시보드 알약 메뉴는 뺐다(UI 다듬기 2026-11-15 사용자). 대시보드는 첫 화면의 "대시보드 보기"·검색으로 간다.
 * 주소를 읽지 않는다. 링크 주소와 선택 상태는 `app`이 만들어 넘긴다.
 */

type HeaderProps = {
  homeHref: string;
  locale: Locale;
  /** 같은 화면의 다른 언어 주소(쿼리·해시 포함) */
  localeHrefs: Record<Locale, string>;
};

/** 디자인 순서: EN, KR */
const LOCALE_ORDER: Locale[] = ["en", "ko"];

export function Header({ homeHref, locale, localeHrefs }: HeaderProps) {
  const t = useMessages();
  return (
    // 높이 104px(선 포함)과 아래 얇은 구분선: 디자인 시안 v9 `.site-header`(2026-11-14 사용자, 모든 화면)
    <header className="flex h-26 items-center justify-between gap-4 border-b border-header-line">
      <Link to={homeHref} className="text-xl font-medium text-ink">
        {t.brand}
      </Link>

      <div role="group" aria-label={t.language.label} className="flex gap-1 rounded-control border border-segment-line bg-segment p-1">
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
