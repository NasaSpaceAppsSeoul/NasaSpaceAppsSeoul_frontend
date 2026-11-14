import { useMessages } from "../../i18n";
import { Button } from "../Button";

/*
 * 히트맵 카드 머리와 버튼 줄 (screens/kr/dashboard-*.png 달력 카드).
 * 자리만 잡는 것(1-9): 보정 전/후 전환, 달력 PNG. CSV는 8장에서 동작과 확인 대화상자를 붙인다(4-8).
 * 비활성 버튼은 `aria-disabled`로 두어 키보드로도 포커스와 "준비 중"을 볼 수 있게 한다. 목 모드면 그 이유를 화면 글자로 보인다.
 */
type HeatmapHeaderProps = {
  title: string;
  sub: string;
  /** 표시 연도 버튼 글자. 시·군·구는 버튼이 없다(4-7) → `null` */
  yearLabel: string | null;
  onOpenYears: () => void;
  mockMode: boolean;
};

export function HeatmapHeader({ title, sub, yearLabel, onOpenYears, mockMode }: HeatmapHeaderProps) {
  const t = useMessages();
  const h = t.heatmap;
  const soon = t.common.comingSoon;
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-xl font-semibold text-ink">{title}</h2>
          <p className="text-sm text-muted">{sub}</p>
        </div>
        <div role="group" aria-label={`${h.raw} / ${h.harmonized}`} className="flex gap-1 rounded-control bg-page p-1">
          <button type="button" aria-disabled="true" title={soon} className="cursor-not-allowed rounded-control-sm px-6 py-2 text-sm text-muted">
            {h.raw}
          </button>
          <button type="button" aria-pressed="true" className="rounded-control-sm bg-inverse px-6 py-2 text-sm font-medium text-surface">
            {h.harmonized}
          </button>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        {yearLabel !== null && (
          <Button size="lg" onClick={onOpenYears} aria-haspopup="dialog">
            {yearLabel}
          </Button>
        )}
        <Button size="lg" variant="dark" aria-disabled="true" title={mockMode ? h.csvMock : soon}>
          {h.csv}
        </Button>
        <Button size="lg" aria-disabled="true" title={soon}>
          {h.png}
        </Button>
        {mockMode && <p className="text-xs text-muted">{h.csvMock}</p>}
      </div>
    </div>
  );
}
