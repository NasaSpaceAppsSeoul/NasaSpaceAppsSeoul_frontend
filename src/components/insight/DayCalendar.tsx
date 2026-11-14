import type { HeatLevel } from "../../lib/heatmap";
import { DAY_LEGEND, type DayCell } from "../../lib/insight";

/*
 * 일별 달력 (screens/kr/insight.png "일별 화재 활동"). 일~토 7열, 칸 색 0 / 1 / 2 / 3 / 4+ (결정 ①),
 * 최대 감지 묶음 기간 중 이 지역에서도 감지된 날은 파란 밑줄, 최대 활동일·공식 기록 장소는 칸 안의 글, 집계 전 날은 회색 점선.
 * 색만으로 뜻을 전하지 않도록 칸마다 읽는 이름(`label`)을 붙인다.
 */

/** 디자인의 달력 색(히트맵과 다르다: 4+가 진한 주황) */
const DAY_CLASS: Record<HeatLevel, string> = {
  0: "bg-heat-0",
  1: "bg-heat-2",
  2: "bg-heat-3",
  3: "bg-heat-4",
  4: "bg-heat-5",
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
    <div className="grid grid-cols-7 gap-2">
      {weekdays.map((day) => (
        <p key={day} aria-hidden="true" className="pb-1 text-center text-xs text-muted">
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
          className={`flex min-h-24 flex-col gap-1 rounded-cell p-2 text-xs text-ink ${
            cell.future ? "border border-dashed border-border bg-surface text-muted" : DAY_CLASS[cell.level]
          } ${cell.inCluster ? "border-b-4 border-b-action" : ""}`.trim()}
        >
          <span className="font-semibold">{cell.day}</span>
          <span>{cell.future ? futureText : valueText(cell)}</span>
          {cell.isPeak && <span className="font-semibold">{peakText}</span>}
          {cell.official !== null && <span className="truncate">{cell.official}</span>}
        </div>
      ))}
    </div>
  );
}

/** 달력 범례: 색 다섯 칸 + 단위·밑줄 설명 */
export function DayLegend({ note }: { note: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
      {DAY_LEGEND.map((item) => (
        <span key={item.level} className="flex items-center gap-1">
          <span aria-hidden="true" className={`size-4 rounded-sm border border-border ${DAY_CLASS[item.level]}`} />
          {item.label}
        </span>
      ))}
      <span>{note}</span>
    </div>
  );
}
