import type { Insight } from "../../../api/types";
import { SectionHeading } from "../../../components/about/SectionHeading";
import { Card } from "../../../components/Card";
import { MapPlaceholder } from "../../../components/insight/MapPlaceholder";
import { useMessages } from "../../../i18n";
import type { InsightScope } from "../scope";
import { CalendarSection } from "./CalendarSection";
import { GuideSection } from "./GuideSection";
import { HeadSection } from "./HeadSection";
import { NeighborsSection } from "./NeighborsSection";
import { OfficialSection } from "./OfficialSection";
import { SeasonSection } from "./SeasonSection";
import { YearsSection } from "./YearsSection";

/** 구역 배치 (screens/kr/insight.png): 전체 너비와 반 너비 두 장이 번갈아 온다. 지도는 자리만(4장 병합 뒤 붙인다) */
export function InsightSections({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const t = useMessages().insight;
  return (
    <>
      <HeadSection scope={scope} insight={insight} />
      <CalendarSection scope={scope} insight={insight} />
      <YearsSection scope={scope} insight={insight} />
      <OfficialSection scope={scope} insight={insight} />
      <div className="grid grid-cols-2 items-start gap-x-4 gap-y-8">
        <SeasonSection scope={scope} insight={insight} />
        <Card className="flex flex-col gap-6">
          <SectionHeading eyebrow={t.map.eyebrow} title={t.map.title} />
          <MapPlaceholder text={t.map.pending} />
        </Card>
      </div>
      <NeighborsSection scope={scope} insight={insight} />
      <GuideSection scope={scope} insight={insight} />
    </>
  );
}
