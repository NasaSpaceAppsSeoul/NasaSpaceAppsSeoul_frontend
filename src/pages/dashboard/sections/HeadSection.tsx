import { useLocale, useMessages } from "../../../i18n";
import { formatMonth } from "../../../lib/format";
import { ownName, regionName } from "../../../lib/region";
import type { DashboardScope } from "../scope";

/*
 * 화면 머리 (screens/kr/dashboard-*.png). 내용은 지금 그대로, 모양은 시안 v9 `.db-intro`.
 * 나라: 머리말(보조 줄) + 큰 제목. 시·도·시·군·구: 머리말(단계) + 제목.
 * 달 이동 버튼은 선택 줄의 "기준 월"과 겹쳐 뺐다(2026-11-15 사용자, `plans/cosmic-redesign.md` 8-2).
 * 머리말은 Mono 대문자 10px와 주황 점(`.db-overline`, `.db-live-dot`), 제목은 가는 큰 글자(`.db-intro h1`).
 */

/** 시안 `.db-intro h1`: clamp(36px, 3.6vw, 48px), 줄 높이 1.18, 자간 -0.035em. 이 화면 한 곳만 쓴다 */
const TITLE = "text-[clamp(2.25rem,3.6vw,3rem)] leading-[1.18] font-normal tracking-[-0.035em] text-ink";

function Overline({ children }: { children: string }) {
  return (
    <p className="mono-overline flex items-center gap-2 text-muted">
      {/* 시안 `.db-live-dot`: 5px 주황 점과 옅은 빛 */}
      <span aria-hidden="true" className="size-1.25 shrink-0 rounded-full bg-fire shadow-[0_0_10px_#f47a3250]" />
      {children}
    </p>
  );
}

export function HeadSection({ scope }: { scope: DashboardScope }) {
  const t = useMessages();
  const locale = useLocale();
  const { region, month, meta, levelNames } = scope;
  const monthLabel = formatMonth(month, locale);

  if (region.level === "nat") {
    const subParts = [regionName(region, scope.index, locale), levelNames.lv2];
    return (
      <header className="flex flex-col gap-4">
        <Overline>
          {meta.data_end !== null ? t.dashboard.natSub(subParts[0] ?? "", levelNames.lv2, meta.data_end) : subParts.join(" · ")}
        </Overline>
        <h1 className={TITLE}>{t.dashboard.natTitle(monthLabel)}</h1>
      </header>
    );
  }

  const level = region.level === "prov" ? levelNames.lv1 : levelNames.lv2;
  return (
    <header className="flex flex-col gap-4">
      <Overline>{t.dashboard.stage(level)}</Overline>
      <h1 className={TITLE}>{t.dashboard.regionTitle(ownName(region, locale), monthLabel)}</h1>
    </header>
  );
}
