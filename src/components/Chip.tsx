import type { ReactNode } from "react";
import type { Chip as ChipValue } from "../api/types";
import { useMessages } from "../i18n";

/*
 * 평가 칩과 배지 (components/sheet/05-charts-badges).
 * 색만으로 뜻을 전하지 않도록 칩은 항상 글자를 함께 쓴다.
 */

const CHIP_CLASS: Record<ChipValue, string> = {
  record: "bg-chip-record text-chip-record-ink",
  above: "bg-chip-above text-chip-above-ink",
  normal: "bg-chip-normal text-chip-normal-ink",
  below: "bg-chip-below text-chip-below-ink",
};

/** 평가 칩 4가지. 문구는 언어별 고정 문구다. */
export function Chip({ value }: { value: ChipValue }) {
  const t = useMessages();
  return (
    <span className={`inline-flex items-center rounded-control-sm px-4 py-1 text-xs font-medium ${CHIP_CLASS[value]}`}>
      {t.chip[value]}
    </span>
  );
}

/** 사각 배지("Estimated" 줄)의 8가지 색. */
export type BadgeTone = "neutral" | "sand" | "dark" | "yellow" | "red" | "green" | "blue" | "orange";

const BADGE_CLASS: Record<BadgeTone, string> = {
  neutral: "bg-page text-muted",
  sand: "bg-row-hover text-ink",
  dark: "bg-inverse-hover text-surface",
  yellow: "bg-tone-yellow text-tone-yellow-ink",
  red: "bg-chip-record text-chip-record-ink",
  green: "bg-tone-green text-tone-green-ink",
  blue: "bg-row-selected text-action",
  orange: "bg-tone-orange text-tone-orange-ink",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-cell px-2 py-0.5 text-xs font-medium ${BADGE_CLASS[tone]}`}>
      {children}
    </span>
  );
}

/** 둥근 색조 배지 5가지(시트 맨 아래 줄). */
export type ToneBadgeTone = "orange" | "green" | "blue" | "red" | "yellow";

const TONE_CLASS: Record<ToneBadgeTone, string> = {
  orange: "bg-tone-orange text-tone-orange-ink",
  green: "bg-tone-green text-tone-green-ink",
  blue: "bg-tone-blue text-tone-blue-ink",
  red: "bg-tone-red text-tone-red-ink",
  yellow: "bg-tone-yellow text-tone-yellow-ink",
};

export function ToneBadge({ tone, children }: { tone: ToneBadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${TONE_CLASS[tone]}`}>{children}</span>
  );
}
