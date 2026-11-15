import { CountUp } from "../CountUp";
import { Link } from "react-router-dom";

/*
 * 기법 페이지 머리 (시안 `method_page.html` `.hero`): 돌아가기 링크, 주황 점이 붙은 Mono 작은 제목, 큰 제목, 설명, 숫자 카드 3장.
 * 숫자 카드는 인사이트 `StatTile`(이름표 + 값 + 한 줄)과 모양이 달라(큰 값 + 설명 두 줄, 세 칸이 한 판) 따로 그린다.
 * 판은 다른 화면과 같은 유리 재료(`plans/cosmic-redesign.md` 8절).
 * 글자 크기·자간·폭의 임의 값(`text-[0.8125rem]` 등)은 시안 `method_page.html` CSS의 px 값을 rem으로 옮긴 것이다(토큰에 같은 크기가 없음).
 */
export type HeroStat = { id: string; value: { before: string; accent: string; after: string }; sub: string };

type MethodHeroProps = {
  backHref: string;
  back: string;
  /** 돌아가기 링크가 화면 위로 나갔는지 지켜보는 콜백(나가면 목차 위에 같은 링크가 내려온다, `MethodToc`) */
  watchBack?: (node: HTMLElement | null) => (() => void) | undefined;
  eyebrow: string;
  title: string;
  lead: string;
  stats: readonly HeroStat[];
  statsLabel: string;
};

export function MethodHero({ backHref, back, watchBack, eyebrow, title, lead, stats, statsLabel }: MethodHeroProps) {
  return (
    <header className="flex flex-col pt-24 pb-14 break-keep">
      <div data-reveal className="flex flex-col items-start">
        {/* 관찰자는 `Link`가 아니라 감싼 칸에 단다(`hooks/useScrolledPast` 주석) */}
        <span ref={watchBack} className="mb-9 inline-block text-[0.9375rem]">
          <Link
            to={backHref}
            className="text-[0.9375rem] text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-selection"
          >
            {back}
          </Link>
        </span>
        <p className="flex items-center gap-2.5 font-mono text-[0.8125rem] text-muted uppercase [&:lang(en)]:tracking-[0.14em]">
          <span aria-hidden="true" className="size-1.75 rounded-full bg-fire" />
          {eyebrow}
        </p>
        <h1 className="mt-5.5 mb-6.5 max-w-[12ch] text-[5.25rem] leading-[1.02] font-medium tracking-[-0.035em] text-ink [&:lang(ko)]:max-w-[11em]">
          {title}
        </h1>
        <p className="max-w-[40em] text-xl leading-relaxed text-subtle">{lead}</p>
      </div>
      <ul
        data-reveal
        data-reveal-delay="1"
        aria-label={statsLabel}
        className="glass mt-14 grid grid-cols-3 divide-x divide-line overflow-hidden rounded-card border border-line"
      >
        {stats.map((stat) => (
          <li key={stat.id} className="px-7 py-6.5">
            <p className="text-[2.125rem] leading-[1.1] font-medium tracking-tight text-ink">
              {stat.value.before}
              <em className="text-fire not-italic">
                <CountUp text={stat.value.accent} />
              </em>
              {stat.value.after}
            </p>
            <p className="mt-2 text-[0.90625rem] leading-normal text-muted">{stat.sub}</p>
          </li>
        ))}
      </ul>
    </header>
  );
}
