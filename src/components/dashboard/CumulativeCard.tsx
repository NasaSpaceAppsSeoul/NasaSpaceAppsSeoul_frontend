import { CountUp } from "../CountUp";
import { useLocale, useMessages } from "../../i18n";
import { formatFireDays, formatMonthName } from "../../lib/format";
import { monthNumber, monthYear } from "../../lib/month";
import { Badge } from "../Chip";

/*
 * 누적 카드 (screens/kr/dashboard-national.png, 나라 단계만, `decisions.md` 3-5. 모양은 시안 v9 유리 카드).
 * 기간은 시즌 시작 달(`from`, 남반구 7월)부터 그 달까지. 평소 누적은 백엔드 `ytd_median`(`judgementView`).
 * 평소 값이 없으면 그 줄을 뺀다. 환산 범위 줄은 자리만(1-9).
 * 집계 중인 달은 덜 찬 누적이라 평소와 비교하지 않고 "집계 중"을 붙인다(숫자 카드가 칩을 숨기는 것과 같은 기준).
 */
type CumulativeCardProps = {
  month: string;
  /** 시즌 첫 달 */
  from: string;
  sum: number;
  usual: number | null;
  partial: boolean;
  stale: boolean;
};

export function CumulativeCard({ month, from, sum, usual, partial, stale }: CumulativeCardProps) {
  const t = useMessages();
  const c = t.dashboard.cumulative;
  const locale = useLocale();
  const m = monthNumber(month);
  const start = monthNumber(from);
  const span = t.dashboard.monthsSpan(start, m);
  const title = c.title(
    { year: monthYear(from), name: formatMonthName(start, locale) },
    { year: monthYear(month), name: formatMonthName(m, locale) },
    from === month,
  );
  return (
    <section
      aria-busy={stale}
      className={`flex flex-col gap-4 glass rounded-card border border-line p-6 text-ink transition-opacity ${stale ? "opacity-60" : ""}`}
    >
      <h2 className="text-base font-medium">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-title-lg font-light">
          <CountUp text={formatFireDays(sum, locale)} /> {t.dashboard.unit}
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
