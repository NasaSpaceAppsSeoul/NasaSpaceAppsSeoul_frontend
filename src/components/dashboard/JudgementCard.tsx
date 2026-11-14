import { useId, type ReactNode } from "react";
import { useLocale, useMessages } from "../../i18n";
import { formatMonth } from "../../lib/format";
import type { JudgementView } from "../../lib/judgementView";
import { JudgementHead, JudgementMeta, JudgementSentences, JudgementYtd } from "./JudgementParts";

/*
 * 숫자 카드 (screens/kr/dashboard-*.png 왼쪽 카드, 모양은 시안 v9 유리 카드). 분기는 `lib/judgementView`가 정하고 여기서는 그리기만 한다.
 */
type JudgementCardProps = {
  view: JudgementView;
  /** 카드 머리의 지역 이름(언어에 맞게 만든 것) */
  regionLabel: string;
  /** 빌린 판정 지역의 이름(언어에 맞게). 모르면 `null` → 응답의 한글 이름 */
  refName: string | null;
  /** 나라는 누적을 따로 카드로 그리므로 카드 안 누적 줄을 뺀다 */
  showYtd: boolean;
  /** 시·군·구 카드의 "불이 감지된 날짜 수" 자리(값은 7장 `/insight`, 지금은 준비 중) */
  showDetectionDays: boolean;
  /** 같은 지역의 이전 달 값을 보여 주는 중이면 흐리게 */
  stale: boolean;
  /** 문장 아래, 누적 줄 위 자리(시·군·구의 "월간 인사이트 열기" 버튼) */
  footer?: ReactNode;
};

export function JudgementCard({ view, regionLabel, refName, showYtd, showDetectionDays, stale, footer }: JudgementCardProps) {
  const t = useMessages();
  const locale = useLocale();
  const month = formatMonth(view.month, locale);
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      aria-busy={stale}
      className={`flex flex-col gap-5 glass rounded-card border border-line p-6 text-ink transition-opacity ${stale ? "opacity-60" : ""}`}
    >
      <header className="flex flex-col gap-3">
        <p className="text-xs text-muted">{t.dashboard.card.heading(regionLabel, month)}</p>
        <h2 id={titleId} className="text-base font-medium">
          {t.dashboard.card.title(month)}
        </h2>
      </header>
      <JudgementHead view={view} />
      <JudgementMeta view={view} />
      <JudgementSentences view={view} refName={refName} />
      {showDetectionDays && (
        // 자리만 잡는 줄 (`CLAUDE.md` 구현 범위, `decisions.md` 1-9)
        <p title={t.common.comingSoon} className="text-sm text-muted">
          {t.dashboard.card.detectionDays} · {t.common.comingSoon}
        </p>
      )}
      {footer}
      {showYtd && <JudgementYtd view={view} />}
    </section>
  );
}
