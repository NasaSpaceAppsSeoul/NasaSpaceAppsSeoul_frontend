/*
 * 02절 고정 그림: 위성마다 Hwaruruk이 쓰는 기간 (시안 `drawSats`를 SVG 컴포넌트로, `plans/method-page.md` 0절·12-3).
 * 기간은 최종 노트북의 사슬과 같다: Terra 2000-11부터, Aqua 2002-07부터 Terra와 함께(같은 날 같은 칸은 하나로) 2012-01까지,
 * S-NPP 2012-02 ~ 2018-03, NOAA-20 2018-04부터(기준), NOAA-21은 2023-03부터 예비. 2012-02에 점선(가장 큰 센서 전환).
 * 연도는 소수(월 ÷ 12)로 적는다. 색은 `styles/index.css`의 위성 토큰.
 * "현재" 막대 끝(2026-11)과 x축 끝(2027)은 고정이라 대회 뒤 달이 바뀌면 다시 맞춘다(9장 확인 목록).
 */
type Row = { name: string; sensor: "MODIS" | "VIIRS" | "backup"; from: number; to: number; className: string };

const ROWS: readonly Row[] = [
  { name: "Terra", sensor: "MODIS", from: 2000 + 10 / 12, to: 2012 + 1 / 12, className: "fill-sat-modis" },
  { name: "Aqua", sensor: "MODIS", from: 2002 + 6 / 12, to: 2012 + 1 / 12, className: "fill-sat-modis" },
  { name: "S-NPP", sensor: "VIIRS", from: 2012 + 1 / 12, to: 2018 + 3 / 12, className: "fill-sat-snpp" },
  { name: "NOAA-20", sensor: "VIIRS", from: 2018 + 3 / 12, to: 2026 + 11 / 12, className: "fill-fire" },
  { name: "NOAA-21", sensor: "backup", from: 2023 + 2 / 12, to: 2026 + 11 / 12, className: "fill-sat-backup" },
];

const TICKS = [2000, 2005, 2010, 2015, 2020, 2025];
const SWITCH_2012 = 2012 + 1 / 12;
const X0 = 110;
const X1 = 700;
const x = (year: number) => X0 + ((year - 2000) / 27) * (X1 - X0);

type SatelliteTimelineProps = { label: string; backupLabel: string };

export function SatelliteTimeline({ label, backupLabel }: SatelliteTimelineProps) {
  return (
    <svg viewBox="0 0 720 210" className="block h-auto w-full" role="img" aria-label={label}>
      {TICKS.map((year) => (
        <g key={year}>
          <line x1={x(year)} x2={x(year)} y1={10} y2={180} className="stroke-line" />
          <text x={x(year)} y={200} textAnchor="middle" fontSize={12} className="fill-muted">
            {year}
          </text>
        </g>
      ))}
      {ROWS.map((row, i) => {
        const y = 22 + i * 32;
        return (
          <g key={row.name}>
            <text x={0} y={y + 13} fontSize={13.5} className="fill-ink">
              {row.name}
            </text>
            <text x={62} y={y + 13} fontSize={11.5} className="fill-muted font-mono">
              {row.sensor === "backup" ? backupLabel : row.sensor}
            </text>
            <rect x={x(row.from)} y={y} width={x(row.to) - x(row.from)} height={18} rx={4} className={row.className} />
          </g>
        );
      })}
      <line
        x1={x(SWITCH_2012)}
        x2={x(SWITCH_2012)}
        y1={10}
        y2={180}
        strokeDasharray="3 4"
        className="stroke-ink opacity-50"
      />
    </svg>
  );
}
