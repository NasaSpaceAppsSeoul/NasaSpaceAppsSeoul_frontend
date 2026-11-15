import { InsightTable } from "../../../components/insight/InsightTable";
import { MethodFigure } from "../../../components/method/MethodFigure";
import { MethodSection, MethodSubheading } from "../../../components/method/MethodSection";
import { SatelliteTimeline } from "../../../components/method/SatelliteTimeline";
import { WhyList } from "../../../components/method/WhyList";
import { useMethodMessages } from "../../../i18n/method";

/*
 * 02 데이터 (`plans/method-page.md` 12-3): 요지, 위성 사용 기간 그림(고정), 왜 이 자료인가 카드, 지역별 구역·공식 기록 표.
 * 표는 인사이트 표를 다시 쓴다(`plans/method-page.md` 8-4). 지역이 늘면 표에 줄이 더해진다(9장).
 * `id`는 `MethodContents`의 절 목록.
 */
export function DataSection({ id }: { id: string }) {
  const d = useMethodMessages().data;
  return (
    <MethodSection id={id} index={d.index} title={d.title} lead={d.lead}>
      <MethodFigure title={d.figure.title} sub={d.figure.sub} caption={d.figure.caption}>
        <SatelliteTimeline label={d.figure.label} backupLabel={d.figure.backup} />
      </MethodFigure>
      <MethodSubheading>{d.whyTitle}</MethodSubheading>
      <WhyList items={d.items} />
      <div data-reveal className="mt-7 overflow-hidden rounded-xl border border-line">
        <InsightTable caption={d.table.caption} head={d.table.head} rows={d.table.rows} variant="plain" />
      </div>
    </MethodSection>
  );
}
