import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { useMessages } from "../../../i18n";
import type { DashboardNavigate } from "../scope";

/*
 * 자료 가져가기 (screens/kr/dashboard-national.png 맨 아래). 디자인은 나라 단계에만 있지만
 * 시·도·시·군·구 화면에도 둔다(2026-11-14 사용자 결정, 지역·달이 담긴 링크를 그대로 공유하게).
 * "감지 지점 CSV / GeoJSON"은 자리만(`decisions.md` 1-9, CLAUDE.md 구현 범위): 비활성 모양 + "준비 중".
 * "이 화면 링크 복사"는 공유 대화상자를 연다(`navigate.share`, 주소는 화면이 만든다). 복사는 대화상자 안 버튼으로.
 * 아래 안내("시·군·구를 선택하면 … 월간 인사이트")는 시·군·구 화면에서는 뺀다(그 화면은 숫자 카드에 인사이트 버튼이 있다).
 */
type ExportSectionProps = {
  navigate: DashboardNavigate;
  /** 인사이트 안내 줄에 쓸 단계 이름(`scope.levelNames.lv2`). `null`이면 그 줄을 뺀다(시·군·구 화면) */
  insightLevel: string | null;
};

export function ExportSection({ navigate, insightLevel }: ExportSectionProps) {
  const t = useMessages();
  const e = t.dashboard.export;
  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-ink">{e.title}</h2>
      {/* 디자인은 글자보다 넓은 버튼(약 280~300px)에 사이 16px */}
      <div className="flex flex-wrap gap-4">
        <Button size="lg" className="min-w-72" aria-disabled="true" title={t.common.comingSoon}>
          {e.points}
        </Button>
        <Button size="lg" className="min-w-72" onClick={() => navigate.share()}>
          {e.share}
        </Button>
      </div>
      {insightLevel !== null && <p className="text-sm text-muted">{e.footnote(insightLevel)}</p>}
    </Card>
  );
}
