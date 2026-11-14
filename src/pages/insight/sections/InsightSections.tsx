import type { Insight } from "../../../api/types";
import type { InsightScope } from "../scope";
import { CalendarSection } from "./CalendarSection";
import { GuideSection } from "./GuideSection";
import { HeadSection } from "./HeadSection";
import { InsightMapSection } from "./InsightMapSection";
import { NeighborsSection } from "./NeighborsSection";
import { OfficialSection } from "./OfficialSection";
import { SeasonSection } from "./SeasonSection";
import { YearsSection } from "./YearsSection";

/** 구역 배치 (screens/kr/insight.png): 전체 너비와 반 너비 두 장이 번갈아 온다 */
export function InsightSections({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  return (
    // 구역마다 화면에 들어올 때 떠오른다(`[data-reveal]`, 감싸는 `InsightBody`의 `useScrollReveal`)
    <>
      <div data-reveal>
        <HeadSection scope={scope} insight={insight} />
      </div>
      <div data-reveal>
        <CalendarSection scope={scope} insight={insight} />
      </div>
      <div data-reveal>
        <YearsSection scope={scope} insight={insight} />
      </div>
      <div data-reveal>
        <OfficialSection scope={scope} insight={insight} />
      </div>
      <div className="grid grid-cols-2 items-start gap-x-4 gap-y-8">
        <div data-reveal>
          <SeasonSection scope={scope} insight={insight} />
        </div>
        <div data-reveal data-reveal-delay="1">
          <InsightMapSection scope={scope} insight={insight} />
        </div>
      </div>
      <div data-reveal>
        <NeighborsSection scope={scope} insight={insight} />
      </div>
      <div data-reveal>
        <GuideSection scope={scope} insight={insight} />
      </div>
    </>
  );
}
