import type { Insight } from "../../../api/types";
import { MethodToc } from "../../../components/method/MethodToc";
import { useLocation } from "react-router-dom";
import { useActiveSection } from "../../../hooks/useActiveSection";
import { useMessages } from "../../../i18n";
import type { InsightScope } from "../scope";
import { CalendarSection } from "./CalendarSection";
import { GuideSection } from "./GuideSection";
import { HeadSection } from "./HeadSection";
import { InsightMapSection } from "./InsightMapSection";
import { NeighborsSection } from "./NeighborsSection";
import { OfficialSection } from "./OfficialSection";
import { SeasonSection } from "./SeasonSection";
import { YearsSection } from "./YearsSection";

/** 절 목록(목차 순서 = 화면 순서). 해시 이름은 두 언어 공용 */
const SECTION_IDS = ["calendar", "years", "official", "season", "map", "neighbors", "guide"] as const;

/**
 * 구역 배치: 머리(카드 없음, 전체 폭) 아래에 왼쪽 목차 | 오른쪽 선으로 나눈 번호 절 01~07(2026-11-15 디자이너 요청
 * "카드가 너무 많다"와 사용자 요청 "기법 페이지처럼 목차"). 목차·지금 보는 절 추적은 기법 페이지 부품을 그대로 쓴다.
 * 계절(04)·지도(05)는 각자 줄이되 그림 판은 왼쪽, 설명 글(지도는 범례까지)은 오른쪽에 둔다(`InsightFigureRow`).
 * 전체 폭 그림은 너무 크고 나란히 두면 지도가 범례로 길어져서(2026-11-15 사용자), 그림 크기를 02 절과 비슷하게 맞췄다.
 * 절 머리와 그림 판이 각자 화면에 들어올 때 떠오른다(`data-reveal`, 감싸는 `InsightBody`의 `useScrollReveal`).
 */
export function InsightSections({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const t = useMessages().insight;
  // 문서 전체의 부드러운 스크롤은 끈다: 이웃 지역 링크로 옮길 때 이 화면이 남아 맨 위로 천천히 굴러가므로(`useActiveSection` 주석).
  // 목차를 누를 때만 그 절로 부드럽게 옮긴다(`MethodToc` `smoothClick`, 2026-11-15 사용자)
  const { track, active } = useActiveSection(SECTION_IDS, { smooth: false });
  // 목차를 눌러도 주소의 달(`?month=`)은 그대로
  const { search } = useLocation();
  const labels: Record<(typeof SECTION_IDS)[number], string> = {
    calendar: t.calendar.eyebrow,
    years: t.years.eyebrow,
    official: t.official.eyebrow,
    season: t.season.eyebrow,
    map: t.map.eyebrow,
    neighbors: t.neighbors.eyebrow,
    guide: t.guide.eyebrow,
  };
  const toc = SECTION_IDS.map((id, i) => ({ id, index: String(i + 1).padStart(2, "0"), label: labels[id] }));

  return (
    <>
      <div data-reveal>
        <HeadSection scope={scope} insight={insight} />
      </div>
      <div className="grid grid-cols-[13.75rem_minmax(0,1fr)] gap-18 pt-6">
        <MethodToc label={t.tocLabel} items={toc} active={active} search={search} smoothClick />
        <div ref={track} className="min-w-0">
          <CalendarSection scope={scope} insight={insight} />
          <YearsSection scope={scope} insight={insight} />
          <OfficialSection scope={scope} insight={insight} />
          <SeasonSection scope={scope} insight={insight} />
          <InsightMapSection scope={scope} insight={insight} />
          <NeighborsSection scope={scope} insight={insight} />
          <GuideSection scope={scope} insight={insight} />
        </div>
      </div>
    </>
  );
}
