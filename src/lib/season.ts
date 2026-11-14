/*
 * 평소 화재 집중 시기 카드 계산 (5장, `reference/api/B-catalog.md` B-3 `risk_months`).
 * `risk_months`는 오름차순으로 온다. 해를 넘기는 시기(12·1·2월)도 `[1, 2, 12]`로 온다.
 */

/** 이어진 달끼리 묶는다. `[3,4]` → `[[3,4]]`, `[1,2,12]` → `[[12,2]]`(해 넘김), `[3,4,11]` → `[[3,4],[11,11]]` */
export function riskMonthRuns(months: readonly number[]): [number, number][] {
  const sorted = [...new Set(months)].filter((m) => m >= 1 && m <= 12).sort((a, b) => a - b);
  const runs: [number, number][] = [];
  for (const m of sorted) {
    const last = runs.at(-1);
    if (last !== undefined && m === last[1] + 1) last[1] = m;
    else runs.push([m, m]);
  }
  // 12월로 끝나는 묶음과 1월로 시작하는 묶음은 해를 넘겨 이어진 것이다(전부 이어진 12달은 그대로)
  const first = runs[0];
  const end = runs.at(-1);
  if (runs.length > 1 && first !== undefined && end !== undefined && first[0] === 1 && end[1] === 12) {
    runs.shift();
    end[1] = first[1];
  }
  return runs;
}

/** 위험 달 중 평년 중앙값이 가장 큰 달. 중앙값이 모두 없으면 `null`(문장에서 정점을 뺀다). */
export function peakMonth(
  months: readonly number[],
  baseline: readonly { month: number; median: number | null }[],
): number | null {
  let best: { month: number; median: number } | null = null;
  for (const m of months) {
    const median = baseline.find((b) => b.month === m)?.median ?? null;
    if (median !== null && (best === null || median > best.median)) best = { month: m, median };
  }
  return best?.month ?? null;
}
