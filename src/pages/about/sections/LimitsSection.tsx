import { Link } from "react-router-dom";
import { ButtonObject } from "../../../components/about/ButtonObject";
import { NumberedHeading } from "../../../components/about/NumberedHeading";
import { useLocale, useMessages } from "../../../i18n";
import { localizePath } from "../../../lib/locale";

/*
 * 03 신뢰와 한계 (새 시안 v9 `.limits`, `design/cosmic/src/App.tsx`). 정적 문구 구역.
 * 위 구분선, 두 칸(1.1 : 1, 1280 미만은 한 칸): 왼쪽 번호 줄과 제목, 오른쪽 설명(20/32)·구분선 아래 안내(15/24)·주황 "대시보드 보기".
 * 시안에서 뺀 COUNT·CONNECT·QUALIFY 줄은 없다. 대시보드 링크는 언어를 유지한다(about-revise 9-3).
 * 글자색은 시안 값(설명 #c0c1c5, 안내 #e2e2df)에 가까운 토큰(`subtle`, `ink`)을 쓴다.
 */
export function LimitsSection() {
  const t = useMessages().about.limits;
  const locale = useLocale();
  return (
    <section aria-labelledby="limits-title" className="border-t border-border pt-20 pb-12">
      <div className="grid gap-16 pb-16 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div data-reveal>
          <NumberedHeading id="limits-title" index={t.index} title={t.title} />
        </div>
        <div data-reveal data-reveal-delay="1" className="break-keep xl:pt-11">
          <p className="max-w-[490px] text-xl/8 text-subtle">{t.body}</p>
          <p className="mt-8 mb-10 border-t border-border pt-8 text-[15px]/6 text-ink">{t.guidance}</p>
          {/* 주황 버튼 + 마름모 장식(시안 `.dashboard-button`: 높이 56, 최소 224, 왼쪽 여백 20, 글자 15/500). 호버는 마름모만 돈다 */}
          <Link
            to={localizePath("/dashboard", locale)}
            className={
              "group inline-flex h-14 min-w-56 items-center justify-between gap-4 rounded-control bg-fire py-2 pr-2 pl-5 " +
              "text-[15px] font-medium whitespace-nowrap text-page " +
              "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-selection"
            }
          >
            {t.dashboard}
            <ButtonObject />
          </Link>
        </div>
      </div>
    </section>
  );
}
