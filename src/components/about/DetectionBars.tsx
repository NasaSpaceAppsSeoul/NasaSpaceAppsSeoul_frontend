/*
 * 규모별 감지율 막대 (screens/kr/about.png "신뢰도와 한계").
 * 막대 길이 = 감지율, 줄마다 세로선 = 그 단계의 우연 기준(백엔드는 단계마다 값이 다르다).
 * 막대는 그림이라 숨기고, 줄마다 "단계: 감지율, 우연 기준" 문장을 읽히게 둔다.
 */
export type DetectionRow = {
  key: string;
  label: string;
  /** 0~1, 값이 없으면 0 */
  detected: number;
  /** 0~1, 값이 없으면 `null`(세로선 없음) */
  chance: number | null;
  /** 오른쪽 숫자("91%", "—") */
  percent: string;
  /** 화면 읽기용 한 줄 */
  spoken: string;
};

export function DetectionBars({ rows, axis }: { rows: readonly DetectionRow[]; axis: readonly string[] }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {rows.map((row) => (
          <li key={row.key} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-4">
            <span className="sr-only">{row.spoken}</span>
            <span aria-hidden="true" className="text-sm font-semibold text-ink">
              {row.label}
            </span>
            <span aria-hidden="true" className="relative h-4 rounded-full bg-border">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-bar-harmonized-from to-bar-harmonized-to"
                style={{ width: `${row.detected * 100}%` }}
              />
              {row.chance !== null && (
                <span className="absolute -inset-y-1 w-0.5 bg-ink" style={{ left: `${row.chance * 100}%` }} />
              )}
            </span>
            <span aria-hidden="true" className="text-right text-base text-ink">
              {row.percent}
            </span>
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="grid grid-cols-[8rem_1fr_3rem] gap-4 text-sm text-muted">
        <span />
        <span className="flex justify-between">
          {axis.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </span>
        <span />
      </div>
    </div>
  );
}
