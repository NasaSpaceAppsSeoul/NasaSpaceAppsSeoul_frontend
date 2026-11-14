import { useLocale, useMessages } from "../../../i18n";
import { formatFullDate, formatMonth, formatMonthName } from "../../../lib/format";
import { isLastDayOfMonth } from "../../../lib/month";
import { ownName, regionName } from "../../../lib/region";
import type { DashboardScope } from "../scope";

/*
 * 화면 머리 (screens/kr/dashboard-*.png). 내용은 지금 그대로, 모양은 시안 v9 `.db-intro`.
 * 나라: 머리말(보조 줄) + 큰 제목. 시·도·시·군·구: 머리말(단계) + 제목.
 * 달 이동 버튼은 선택 줄의 "기준 월"과 겹쳐 뺐다(2026-11-15 사용자, `plans/cosmic-redesign.md` 8-2).
 * 머리말은 Mono 대문자 10px와 주황 점(`.db-overline`, `.db-live-dot`), 제목은 가는 큰 글자(`.db-intro h1`).
 * 제목 아래 부제와 그 아래 자료 카드는 세 단계 모두 같다(시안 v11 `Dashboard.tsx` `.db-intro p`·`.db-data-notice`, 2026-11-15 사용자).
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
      <Head
        overline={meta.data_end !== null ? t.dashboard.natSub(subParts[0] ?? "", levelNames.lv2, meta.data_end) : subParts.join(" · ")}
        title={t.dashboard.natTitle(monthLabel)}
        dataEnd={meta.data_end}
      />
    );
  }

  const level = region.level === "prov" ? levelNames.lv1 : levelNames.lv2;
  return (
    <Head
      overline={t.dashboard.stage(level)}
      title={t.dashboard.regionTitle(ownName(region, locale), monthLabel)}
      dataEnd={meta.data_end}
    />
  );
}

/** 머리(머리말·제목·부제)와 자료 카드(세 단계 공통). 시안 간격: 제목 → 부제 12, 머리 → 카드 32, 카드 → 선택 줄 24 */
function Head({ overline, title, dataEnd }: { overline: string; title: string; dataEnd: string | null }) {
  const t = useMessages();
  return (
    // 바깥 `main`의 칸 사이가 32라 카드 아래만 8 줄여 선택 줄과 24를 맞춘다
    <div className="-mb-2 flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <Overline>{overline}</Overline>
        <h1 className={TITLE}>{title}</h1>
        {/* 시안 `.db-intro > div > p`: 15px, 흐린 색. 제목 아래 12px(바깥 칸 사이 16에서 4를 뺀다) */}
        <p className="-mt-1 text-[15px] text-muted">{t.dashboard.intro}</p>
      </header>
      <DataNotice dataEnd={dataEnd} />
    </div>
  );
}

/** 시안 `.db-data-notice` Mono 이름표: 9px, 영문만 자간 .06em(한글은 Mono 글꼴에 없어 벌어진다, `mono-tag`와 같은 이유) */
const NOTICE_TAG = "shrink-0 font-mono text-[9px] uppercase [&:lang(en)]:tracking-[0.06em]";

/**
 * 자료 카드 (시안 v11 `.db-demo-notice.db-data-notice`, 값 그대로). 다른 카드의 `glass`와 달리 푸른 알림 재료라 이 자리만 쓴다.
 * 날짜는 `/meta` `data_end`. 그 날이 달의 마지막 날이 아니면 그 달은 아직 수집 중이라고 붙이고, 날짜가 없으면 잠정치 문장만 둔다.
 */
function DataNotice({ dataEnd }: { dataEnd: string | null }) {
  const t = useMessages();
  const locale = useLocale();
  const date = dataEnd === null ? null : formatFullDate(dataEnd, locale);
  const collecting =
    dataEnd === null || isLastDayOfMonth(dataEnd) ? null : formatMonthName(Number(dataEnd.slice(5, 7)), locale);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-[#263444] bg-[rgba(17,24,32,0.54)] px-4 py-3 text-[11px] leading-[1.5] text-[#abb9c8] backdrop-blur-[14px]">
      <span className={`${NOTICE_TAG} text-[#86b5ee]`}>{t.dashboard.dataNotice.label}</span>
      <p>{t.dashboard.dataNotice.text(date, collecting)}</p>
      <span className={`${NOTICE_TAG} ml-auto whitespace-nowrap text-[#7f929f]`}>{t.dashboard.dataNotice.reference}</span>
    </div>
  );
}
