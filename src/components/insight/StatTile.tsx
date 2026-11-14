/** 머리 카드의 회색 숫자 칸 (screens/kr/insight.png): 작은 제목 + 큰 값 + 보조 한 줄. 값이 없으면 "—"와 이유 */
export function StatTile({ label, value, sub }: { label: string; value: string; sub: string | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-card bg-wash px-4 py-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-xl font-semibold text-ink">{value}</p>
      {sub !== null && <p className="text-sm text-muted">{sub}</p>}
    </div>
  );
}
