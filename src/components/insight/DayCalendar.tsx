import type { HeatLevel } from "../../lib/heatmap";
import { DAY_LEGEND, type DayCell } from "../../lib/insight";

/*
 * 일별 달력 (screens/kr/insight.png "일별 화재 활동"). 일~토 7열, 칸 색 0 / 1 / 2 / 3 / 4+ (결정 ①),
 * 최대 감지 묶음 기간 중 이 지역에서도 감지된 날은 파란 밑줄, 최대 활동일·공식 기록 장소는 칸 안의 글, 집계 전 날은 회색 점선.
 * 색만으로 뜻을 전하지 않도록 칸마다 읽는 이름(`label`)을 붙인다.
 * 모양은 참고안 `.in-day`·`.in-legend`(2026-11-15 디자이너): 0인 날은 흰 4% 바탕, 1~4+는 참고 칸 색(`cellColors` 보정값),
 * 짙은 두 단계는 흰 글자·옅은 단계는 어두운 글자, 날짜는 왼쪽 위 12px, 값은 오른쪽 아래 Mono 13px, 둥근 6, 사이 4.
 */

/** 참고안 칸 색(0은 흰 4%, 1~4+는 보정값 팔레트) */
const DAY_CLASS: Record<HeatLevel, string> = {
  0: "bg-white/[0.04]",
  1: "bg-[#e1c09d]",
  2: "bg-[#d8a574]",
  3: "bg-[#ca814d]",
  4: "bg-[#ad552a]",
};
/** 칸 글자색: 0은 밝은 글자(값은 흐림), 옅은 단계는 어두운 글자, 짙은 단계(3·4+)는 흰 글자(참고 `is-deep`) */
const DAY_TEXT: Record<HeatLevel, string> = {
  0: "text-[#f2f4f7]",
  1: "text-[#1b1209]",
  2: "text-[#1b1209]",
  3: "text-white",
  4: "text-white",
};

type DayCalendarProps = {
  leading: number;
  cells: readonly DayCell[];
  weekdays: readonly string[];
  /** 칸 안의 값 글("108칸") */
  valueText: (cell: DayCell) => string;
  /** 칸의 읽는 이름 */
  label: (cell: DayCell) => string;
  peakText: string;
  futureText: string;
};

export function DayCalendar({ leading, cells, weekdays, valueText, label, peakText, futureText }: DayCalendarProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {weekdays.map((day) => (
        <p key={day} aria-hidden="true" className="pb-1.5 pl-2 text-xs text-[#a9b2bf]">
          {day}
        </p>
      ))}
      {/* 1일 앞의 빈칸은 한 칸으로 합쳐 그 요일 수만큼 차지한다 */}
      {leading > 0 && <div aria-hidden="true" style={{ gridColumn: `span ${leading} / span ${leading}` }} />}
      {cells.map((cell) => (
        <div
          key={cell.day}
          role="img"
          aria-label={label(cell)}
          // 높이는 참고 64를 최소로 두고, 최대 활동일·공식 기록 글이 붙는 날만 늘어난다
          className={`flex min-h-16 min-w-0 flex-col justify-between gap-1 rounded-md px-2 py-[7px] text-xs leading-none ${
            cell.future ? "border border-dashed border-white/22 text-[#8d97a5]" : `${DAY_CLASS[cell.level]} ${DAY_TEXT[cell.level]}`
          } ${cell.inCluster ? "border-b-4 border-b-action" : ""}`.trim()}
        >
          <span>{cell.day}</span>
          {cell.isPeak && <span className="font-semibold">{peakText}</span>}
          {cell.official !== null && <span className="truncate">{cell.official}</span>}
          <span className={`self-end font-mono text-[13px] ${!cell.future && cell.level === 0 ? "text-[#8d97a5]" : ""}`.trim()}>
            {cell.future ? futureText : valueText(cell)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * 달력 범례 (참고안 `.in-legend`, 2026-11-15 디자이너): 한 줄에 이름 → 색 다섯 칸(우리 구간 0 / 1 / 2 / 3 / 4+) → 집계 전(점선)
 * → 파란 밑줄(최대 감지 묶음, 있을 때만), 아래 줄에 색 구간 설명. 12px, 견본 14px 둥근 3.
 * 구간 이름은 참고처럼 부등호로 쓴다(값은 우리 구간: 0 / ≤ 1 / ≤ 2 / ≤ 3 / > 3, 사용자).
 */
const LEGEND_LABEL: Record<HeatLevel, string> = { 0: "0", 1: "≤ 1", 2: "≤ 2", 3: "≤ 3", 4: "> 3" };
type DayLegendProps = { title: string; future: string; cluster: string | null; note: string };

export function DayLegend({ title, future, cluster, note }: DayLegendProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#c3cad4]">
      <span className="mr-1 text-[#a9b2bf]">{title}</span>
      {DAY_LEGEND.map((item) => (
        <span key={item.level} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={`size-3.5 rounded-[3px] ${DAY_CLASS[item.level]} ${item.level === 0 ? "border border-white/14" : ""}`.trim()}
          />
          {LEGEND_LABEL[item.level]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-3.5 rounded-[3px] border border-dashed border-white/30" />
        {future}
      </span>
      {cluster !== null && (
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3.5 rounded-[3px] border-b-[3px] border-b-action bg-white/[0.04]" />
          {cluster}
        </span>
      )}
      <span className="basis-full text-[#a9b2bf]">{note}</span>
    </div>
  );
}
