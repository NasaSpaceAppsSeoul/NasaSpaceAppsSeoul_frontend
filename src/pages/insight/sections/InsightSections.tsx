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
    <>
      <HeadSection scope={scope} insight={insight} />
      <CalendarSection scope={scope} insight={insight} />
      <YearsSection scope={scope} insight={insight} />
      <OfficialSection scope={scope} insight={insight} />
      <div className="grid grid-cols-2 items-start gap-x-4 gap-y-8">
        <SeasonSection scope={scope} insight={insight} />
        <InsightMapSection scope={scope} insight={insight} />
      </div>
      <NeighborsSection scope={scope} insight={insight} />
      <GuideSection scope={scope} insight={insight} />
    </>
  );
}
