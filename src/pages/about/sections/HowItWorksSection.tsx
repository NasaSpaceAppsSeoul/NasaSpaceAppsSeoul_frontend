import { FireGridIllustration } from "../../../components/about/FireGridIllustration";
import { Card } from "../../../components/Card";
import { Badge, ToneBadge } from "../../../components/Chip";
import { useMessages } from "../../../i18n";
import { SectionHeading } from "../../../components/about/SectionHeading";

/*
 * 작동 방식 카드 3장 (screens/kr/about.png "기록을 연결하는 방법"). 모두 고정 문구와 장식이다.
 * 03의 배지는 2장 배지 모양의 예시라 값과 잇지 않는다.
 */
export function HowItWorksSection() {
  const t = useMessages();
  const h = t.about.how;
  const extras = [
    <FireGridIllustration key="grid" />,
    <p key="chain" className="text-center text-sm font-medium text-action">
      {h.chain}
    </p>,
    <div key="badges" className="flex flex-wrap justify-center gap-2">
      <Badge tone="sand">{h.sampleBadge}</Badge>
      <ToneBadge tone="red">{t.chip.record}</ToneBadge>
    </div>,
  ];

  return (
    <Card className="flex flex-col gap-6">
      <SectionHeading eyebrow={h.eyebrow} title={h.title} />
      <ol className="grid gap-6 lg:grid-cols-3">
        {h.steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-4 rounded-card bg-page p-6">
            <span className="text-title-lg text-action">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="text-xl font-semibold text-ink">{step.title}</h3>
            <p className="text-base text-muted">{step.body}</p>
            <div className="mt-auto pt-2">{extras[i]}</div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
