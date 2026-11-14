import { useLocale, useMessages } from "../../i18n";
import { formatFireDays, formatMonthName } from "../../lib/format";
import { monthNumber, monthYear } from "../../lib/month";
import { Badge } from "../Chip";

/*
 * 누적 카드 (screens/kr/dashboard-national.png, 나라 단계만, `decisions.md` 3-5. 모양은 시안 v9 유리 카드).
 * 평소 누적 = `ytd_sum ÷ ytd_ratio`. 비율이 없거나 0이면 그 줄을 뺀다. 환산 범위 줄은 자리만(1-9).
 * 집계 중인 달은 덜 찬 누적이라 평소와 비교하지 않고 "집계 중"을 붙인다(숫자 카드가 칩을 숨기는 것과 같은 기준).
 */
type CumulativeCardProps = {
  month: string;
  sum: number;
  usual: number | null;
  partial: boolean;
  stale: boolean;
};

export function CumulativeCard({ month, sum, usual, partial, stale }: CumulativeCardProps) {
  const t = useMessages();
  const c = t.dashboard.cumulative;
  const locale = useLocale();
  const m = monthNumber(month);
  const span = t.dashboard.monthsSpan(m);
  return (
    <section
      aria-busy={stale}
      className={`flex flex-col gap-4 rounded-card border border-border glass p-6 text-ink transition-opacity ${stale ? "opacity-60" : ""}`}
    >
      <h2 className="text-base font-medium">{c.title(monthYear(month), m, formatMonthName(m, locale))}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-title-lg font-light">
          {formatFireDays(sum, locale)} {t.dashboard.unit}
        </p>
        {partial && <Badge tone="sand">{t.dashboard.card.partial}</Badge>}
      </div>
      <div className="flex flex-col gap-1 text-sm text-muted">
        {usual !== null && !partial && <p>{c.usual(span, formatFireDays(usual, locale))}</p>}
        <p title={t.common.comingSoon} className="text-muted">
          {c.convertedRange} · {t.common.comingSoon}
        </p>
      </div>
      <p className="text-xs text-muted">{c.unitNote}</p>
    </section>
  );
}
