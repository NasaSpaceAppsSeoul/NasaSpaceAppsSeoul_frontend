import { monthYear, seasonStartMonth } from "./month";

/*
 * 숫자 카드 분기 (`decisions.md` 3절, `C-judgement.md` C-9).
 * `reason`은 하나만 오므로 그것에 기대지 않고 `value`·`region_type`·`status`·`median`을 직접 본다.
 * `lib`은 `api`를 가져오지 않으므로 `/judgement` 응답 중 쓰는 필드만 구조 타입으로 받는다.
 */

type ChipValue = "record" | "above" | "normal" | "below";
type QualityValue = "high" | "medium" | "low";

export type JudgementLike = {
  month: string;
  value: number | null;
  region_type: "sufficient" | "sparse" | "none";
  chip: ChipValue | null;
  rank: number | null;
  n: number | null;
  rank_period: [number, number] | null;
  median: number | null;
  band_low: number | null;
  band_high: number | null;
  ratio_to_median: number | null;
  ytd_sum: number | null;
  ytd_median: number | null;
  quality: QualityValue | null;
  status: "final" | "partial" | "nrt";
  reason: string | null;
  ref: {
    id: string;
    label_ko: string;
    value: number | null;
    chip: ChipValue | null;
    rank: number | null;
    n: number | null;
  } | null;
};

/** 위에서부터 먼저 맞는 것 하나 (3절 표의 순서). */
export type JudgementKind = "noValue" | "noRecord" | "partial" | "zero" | "sparse" | "zeroBaseline" | "normal";

export type RankLine = { rank: number; n: number; period: [number, number] | null };

export type RefLine = { id: string; label: string; chip: ChipValue | null; rank: RankLine | null };

export type JudgementView = {
  kind: JudgementKind;
  month: string;
  /** 큰 숫자. `noValue`면 `null`("—") */
  value: number | null;
  /** 평가 칩. `normal`일 때만 */
  chip: ChipValue | null;
  /** `noValue`일 때 2012년 2월 전 시·군·구라서인지 */
  preDistrict: boolean;
  /** 빌린 판정 한 줄. `noValue`·`sparse`일 때만(집계 중에는 덜 찬 값이라 숨긴다) */
  ref: RefLine | null;
  /** 배수 문장: 중앙값과 배수가 둘 다 있을 때만. `normal`일 때만 */
  ratio: { median: number; ratio: number } | null;
  /** 순위 문장: `normal`일 때만. 드문 지역의 자기 순위는 쓰지 않는다(3-1) */
  rank: RankLine | null;
  /** 숫자 아래 작은 줄 */
  band: { low: number; high: number } | null;
  quality: QualityValue | null;
  sufficient: boolean;
  nrt: boolean;
  /** "센서 환산값" 배지: 그 달 관측 위성(`source`)에 "→"가 있을 때만(4-3a) */
  converted: boolean;
  /** 시즌 시작 달(`from`, 북반구 1월·남반구 7월)~그달 누적. 값이 없으면 `null` */
  ytd: { sum: number; usual: number | null; from: string } | null;
};

export function judgementKind(j: JudgementLike): JudgementKind {
  if (j.value === null) return "noValue";
  if (j.region_type === "none") return "noRecord";
  if (j.status === "partial") return "partial";
  if (j.value === 0) return "zero";
  if (j.region_type === "sparse") return "sparse";
  if (j.median === 0) return "zeroBaseline";
  return "normal";
}

/**
 * 순위 문장 재료 (3-2). 기간은 `rank_period`가 있고 그 끝 해가 이 달의 해 이상일 때만 붙인다.
 * 2026년 달은 `n`이 26인데 기간은 2025에서 끝나 "2001–2025년 중 26개 해"처럼 어긋날 수 있다.
 */
function rankLine(rank: number | null, n: number | null, period: [number, number] | null, month: string): RankLine | null {
  if (rank === null || n === null) return null;
  const usablePeriod = period !== null && period[1] >= monthYear(month) ? period : null;
  return { rank, n, period: usablePeriod };
}

/**
 * `source`는 나라 시계열의 그 달 값(모든 지역이 나라 값을 쓴다, D-1). 모르면 `null`.
 * `seasonStart`는 `meta.labels.season_start`(누적 시작 달).
 */
export function judgementView(j: JudgementLike, source: string | null, seasonStart: number): JudgementView {
  const kind = judgementKind(j);
  const showRef = kind === "noValue" || kind === "sparse";
  const ref: RefLine | null =
    showRef && j.ref !== null
      ? { id: j.ref.id, label: j.ref.label_ko, chip: j.ref.chip, rank: rankLine(j.ref.rank, j.ref.n, null, j.month) }
      : null;
  const ratio =
    kind === "normal" && j.median !== null && j.ratio_to_median !== null
      ? { median: j.median, ratio: j.ratio_to_median }
      : null;
  const band =
    j.band_low !== null && j.band_high !== null
      ? // 하한은 계산상 음수일 수 있지만 감지일은 0보다 작을 수 없어 화면에는 0으로 쓴다(3-6)
        { low: Math.max(0, j.band_low), high: j.band_high }
      : null;
  // 누적 평년: 백엔드 `ytd_median`(PR #17, 해마다 같은 기간 누적 합의 중앙값). 없거나 0 이하면 "평소" 줄을 뺀다
  const usual = j.ytd_median !== null && j.ytd_median > 0 ? j.ytd_median : null;

  return {
    kind,
    month: j.month,
    value: j.value,
    chip: kind === "normal" ? j.chip : null,
    preDistrict: kind === "noValue" && j.reason === "PRE_2012_DISTRICT",
    ref,
    ratio,
    rank: kind === "normal" ? rankLine(j.rank, j.n, j.rank_period, j.month) : null,
    band,
    quality: j.quality,
    sufficient: j.region_type === "sufficient",
    nrt: j.status === "nrt",
    // 값이 없는 달은 백엔드도 `source`를 `null`로 준다(TimeseriesLoader). 없는 값에 환산 표시를 붙이지 않는다
    converted: j.value !== null && source !== null && source.includes("→"),
    ytd: j.ytd_sum !== null ? { sum: j.ytd_sum, usual, from: seasonStartMonth(j.month, seasonStart) } : null,
  };
}

/**
 * 숫자 카드 큰 숫자의 크기 단계. 오른쪽 좁은 칸(배치 B, 304px)에서 숫자 옆 칩·단위가 아래로 밀리지 않게
 * 표시 글자 수(쉼표 포함)로 줄인다: 3자 이하 큰 것, 4~5자("1,093") 중간, 6자 이상 작은 것(2026-11-15 사용자).
 */
export type NumberSize = "lg" | "md" | "sm";

export function numberSize(text: string): NumberSize {
  if (text.length <= 3) return "lg";
  return text.length <= 5 ? "md" : "sm";
}
