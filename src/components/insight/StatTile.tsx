import { CountUp } from "../CountUp";

/** 머리 카드의 회색 숫자 칸 (screens/kr/insight.png): 작은 제목 + 큰 값 + 보조 한 줄. 값이 없으면 "—"와 이유 */
export function StatTile({ label, value, extra, sub }: { label: string; value: string; extra?: string; sub: string | null }) {
  // 칸 하나. 바탕 상자 없이 부모 판(`HeadSection`의 유리 판 하나를 세로선으로 나눔, 기법 페이지 머리 숫자와 같은 방식)이 경계를 그린다
  return (
    <li className="flex min-w-0 flex-col gap-2 px-6 py-5.5">
      <p className="text-xs text-muted">{label}</p>
      {/* 값 숫자는 올라가기(모든 화면 공통), 날짜 같은 덧붙임(`extra`)은 그대로 */}
      <p className="text-2xl font-medium tracking-tight text-ink">
        <CountUp text={value} />
        {extra}
      </p>
      {sub !== null && <p className="text-sm text-muted">{sub}</p>}
    </li>
  );
}
