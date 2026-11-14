import { useLocale, useMessages } from "../../i18n";
import { formatFireDays, formatMonthName, formatRatio } from "../../lib/format";
import { numberSize, type JudgementView, type NumberSize, type RankLine } from "../../lib/judgementView";
import { monthNumber } from "../../lib/month";
import { Badge, Chip, ToneBadge } from "../Chip";

/*
 * 숫자 카드의 조각들. 모두 `lib/judgementView`의 결과만 보고 그린다. 값이 없는 문장은 그리지 않는다.
 */

const NUMBER_CLASS: Record<NumberSize, string> = { lg: "text-number", md: "text-number-md", sm: "text-number-sm" };

function useRankText() {
  const t = useMessages().dashboard.card;
  return (rank: RankLine) =>
    rank.period !== null ? t.rankWithPeriod(rank.period[0], rank.period[1], rank.n, rank.rank) : t.rank(rank.n, rank.rank);
}

/** 큰 숫자와 그 옆의 칩·단위 (유리 카드 위라 글자는 ink·muted) */
export function JudgementHead({ view }: { view: JudgementView }) {
  const t = useMessages().dashboard;
  const locale = useLocale();
  const text = view.value === null ? "—" : formatFireDays(view.value, locale);
  return (
    // 숫자와 칩·단위는 늘 한 줄(줄바꿈 없음). 숫자 크기를 글자 수로 줄여 좁은 칸에 맞춘다
    <div className="flex items-end gap-4">
      <p className={`shrink-0 font-light text-ink ${NUMBER_CLASS[numberSize(text)]}`}>{text}</p>
      <div className="flex min-w-0 flex-col items-start gap-2 pb-1">
        {view.chip !== null && <Chip value={view.chip} />}
        {view.kind === "sparse" && <ToneBadge tone="yellow">{t.card.sparse}</ToneBadge>}
        {view.kind === "noRecord" && <Badge tone="neutral">{t.card.noRecord}</Badge>}
        {view.kind === "partial" && <Badge tone="sand">{t.card.partial}</Badge>}
        {view.value !== null && <span className="text-base text-muted">{t.unit}</span>}
      </div>
    </div>
  );
}

/** 범위 · 품질 · 자료 충분 · 준실시간, 그리고 "센서 환산값" 배지 */
export function JudgementMeta({ view }: { view: JudgementView }) {
  const t = useMessages().dashboard.card;
  const locale = useLocale();
  const parts = [
    view.band !== null ? t.band(formatFireDays(view.band.low, locale), formatFireDays(view.band.high, locale)) : null,
    view.quality !== null ? t.quality[view.quality] : null,
    view.sufficient ? t.sufficient : null,
    view.nrt ? t.nrt : null,
  ].filter((part): part is string => part !== null);
  if (parts.length === 0 && !view.converted) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
      {view.converted && <Badge tone="sand">{t.converted}</Badge>}
      {parts.length > 0 && <span>{parts.join(" · ")}</span>}
    </div>
  );
}

/** 분기별 문장. 빌린 판정 줄의 이름은 화면이 언어에 맞게 찾아 넘긴다. */
export function JudgementSentences({ view, refName }: { view: JudgementView; refName: string | null }) {
  const t = useMessages();
  const card = t.dashboard.card;
  const locale = useLocale();
  const rankText = useRankText();
  const monthName = formatMonthName(monthNumber(view.month), locale);
  // 줄마다 고정 이름을 붙여 `key`로 쓴다
  const lines: { key: string; text: string }[] = [];

  if (view.kind === "noValue") lines.push({ key: "state", text: view.preDistrict ? card.preDistrict : card.noValue });
  if (view.kind === "partial") lines.push({ key: "state", text: card.partialSentence });
  if (view.kind === "zero") lines.push({ key: "state", text: card.zero });
  if (view.kind === "zeroBaseline") lines.push({ key: "state", text: card.zeroBaseline });
  if (view.ratio !== null) {
    const text = card.ratio(monthName, formatFireDays(view.ratio.median, locale), formatRatio(view.ratio.ratio, locale));
    lines.push({ key: "ratio", text });
  }
  if (view.rank !== null) lines.push({ key: "rank", text: card.rankSentence(rankText(view.rank)) });
  if (view.ref !== null) {
    const refParts = [
      card.refLine(refName ?? view.ref.label),
      view.ref.chip !== null ? t.chip[view.ref.chip] : null,
      view.ref.rank !== null ? rankText(view.ref.rank) : null,
    ].filter((part): part is string => part !== null);
    lines.push({ key: "ref", text: refParts.join(" · ") });
  }
  if (lines.length === 0) return null;
  return (
    <div className="flex flex-col gap-1 text-base text-ink">
      {lines.map((line) => (
        <p key={line.key}>{line.text}</p>
      ))}
    </div>
  );
}

/** "1–3월 누적 60 화재 감지일"(남반구는 "7–2월 …") (시·도·시·군·구 카드의 맨 아래) */
export function JudgementYtd({ view }: { view: JudgementView }) {
  const t = useMessages().dashboard;
  const locale = useLocale();
  if (view.ytd === null) return null;
  return (
    <p className="text-sm font-medium text-muted">
      {t.card.ytd(t.monthsSpan(monthNumber(view.ytd.from), monthNumber(view.month)), formatFireDays(view.ytd.sum, locale))}
    </p>
  );
}
