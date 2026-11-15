import { CountUp } from "../CountUp";

/**
 * 머리 숫자 칸: 작은 제목 + 큰 값 + 보조 한 줄. 값이 없으면 "—"와 이유.
 * 모양은 참고안 `.in-stats`(2026-11-15 디자이너): 이름 13px 흐림 #a9b2bf, 값 32px/400, 보조 12px, 사이 6, 첫 칸은 왼쪽 여백 없음
 */
export function StatTile({ label, value, extra, sub }: { label: string; value: string; extra?: string; sub: string | null }) {
  // 칸 하나. 바탕 없이 부모(`HeadSection`)의 위아래 선과 칸 사이 세로선이 경계를 그린다
  return (
    <li className="flex min-w-0 flex-col gap-1.5 py-6 pr-6 [&+&]:pl-6">
      <p className="text-[13px] text-[#a9b2bf]">{label}</p>
      {/* 값 숫자는 올라가기(모든 화면 공통), 날짜 같은 덧붙임(`extra`)은 그대로 */}
      <p className="text-[32px] leading-[1.15] font-normal tracking-[-0.02em] text-[#ecece8]">
        <CountUp text={value} />
        {extra}
      </p>
      {sub !== null && <p className="text-xs leading-normal text-[#a9b2bf]">{sub}</p>}
    </li>
  );
}
