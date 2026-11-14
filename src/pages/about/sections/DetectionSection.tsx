import { DetectionBars, type DetectionRow } from "../../../components/about/DetectionBars";
import { Card } from "../../../components/Card";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import type { Landing } from "../../../api/types";
import { useLanding } from "../../../hooks/useLanding";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { formatCount, formatPercent } from "../../../lib/format";
import { detectRows } from "../../../lib/landing";
import { SectionHeading } from "../../../components/about/SectionHeading";

/*
 * 규모별 감지율 (screens/kr/about.png "신뢰도와 한계", `H-landing.md` H-5).
 * 단계는 받은 순서·이름 그대로, 세로선은 단계마다의 `chance`. 기준(2018-04 이후, 2일 안)은 응답에 없어 문구에 적는다.
 * 오른쪽 안내 카드는 고정 문구라 자료가 없어도 보인다.
 */
export function DetectionSection() {
  const d = useMessages().about.detection;
  const landing = useLanding("KOR");

  return (
    <Card className="flex flex-col gap-6">
      <SectionHeading eyebrow={d.eyebrow} title={d.title} lead={d.lead} />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        {landing.isPending ? (
          <Skeleton className="h-72" />
        ) : landing.isError ? (
          <SectionError kind={errorKind(landing.error)} onRetry={() => void landing.refetch()} />
        ) : (
          <DetectionBody landing={landing.data} />
        )}
        <aside className="flex flex-col gap-3 rounded-card bg-page p-6">
          <h3 className="text-center text-xl font-semibold text-ink">{d.noteTitle}</h3>
          <p className="text-base text-muted">{d.noteBody}</p>
        </aside>
      </div>
    </Card>
  );
}

function DetectionBody({ landing }: { landing: Pick<Landing, "detect_by_size" | "detect_n"> }) {
  const d = useMessages().about.detection;
  const locale = useLocale();
  if (landing.detect_by_size.length === 0) return <p className="text-base text-muted">{d.empty}</p>;

  // 백엔드는 단계마다 한 줄을 준다(`bin`이 겹치지 않는다)
  const rows: DetectionRow[] = detectRows(landing.detect_by_size, d.bins).map((row) => {
    const detected = formatPercent(row.detected, locale);
    return {
      key: row.bin,
      label: row.label,
      detected: row.width,
      chance: row.chanceAt,
      percent: detected,
      spoken: d.row(row.label, detected, formatPercent(row.chance, locale)),
    };
  });
  return (
    <div className="flex flex-col gap-4">
      <DetectionBars rows={rows} axis={[0, 0.5, 1].map((v) => formatPercent(v, locale))} />
      <div className="flex flex-col gap-1 text-sm text-ink">
        <p>{d.axis}</p>
        <p className="text-muted">{d.basis(formatCount(landing.detect_n, locale))}</p>
      </div>
    </div>
  );
}
