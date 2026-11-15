import { beforeDistrictData, isInRange, type MonthRange } from "./month";

/*
 * 지도 "평소 대비"(9장)에서 그 달을 평가하는지. 숫자 카드와 같은 기준: 집계 중인 달(`status: partial`)은 칩을 보이지 않고,
 * 2012-02 전 달은 시·군·구 값이 없다. 백엔드 일괄 판정은 집계 중인 달에도 칩을 주므로 프론트가 거른다.
 * 그 달 상태는 나라 시계열(`/series/{나라}`)의 줄에서 읽는다(모든 지역이 나라 상태를 쓴다, D-1).
 * 주소의 달이 자료 범위 밖이면(5-9) 백엔드가 400을 주므로 요청하지 않고 범위 밖 안내를 쓴다.
 */
export type UsualMonthState = "judged" | "partial" | "pre2012" | "outOfRange";

export function usualMonthState(
  month: string,
  range: MonthRange,
  months: readonly { month: string; status: string }[],
): UsualMonthState {
  if (!isInRange(month, range)) return "outOfRange";
  if (beforeDistrictData(month)) return "pre2012";
  return months.find((m) => m.month === month)?.status === "partial" ? "partial" : "judged";
}

type Chip = "record" | "above" | "normal" | "below";
type BulkRegion = { id: string; chip: Chip | null; ratio_to_median: number | null; ref_id: string | null; ref_chip: Chip | null };

/** 구역에 올렸을 때 보일 평가: 자기 평가(배수가 있으면 함께) / 빌려 쓴 평가(드문 구역) / 평가 없음 */
export type UsualHover =
  | { kind: "own"; chip: Chip; ratio: number | null }
  | { kind: "borrowed"; refId: string; chip: Chip }
  | { kind: "none" };

export function usualHover(region: BulkRegion | undefined): UsualHover {
  if (region === undefined) return { kind: "none" };
  if (region.chip !== null) return { kind: "own", chip: region.chip, ratio: region.ratio_to_median };
  if (region.ref_id !== null && region.ref_chip !== null) return { kind: "borrowed", refId: region.ref_id, chip: region.ref_chip };
  return { kind: "none" };
}
