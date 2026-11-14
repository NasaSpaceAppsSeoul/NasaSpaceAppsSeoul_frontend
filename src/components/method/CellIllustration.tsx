/*
 * 03절 설명용 그림 (시안 `drawCell`): 6 × 6 칸 위에 같은 불을 MODIS는 큰 점 4개, VIIRS는 작은 점 19개로 찍고,
 * 둘 다 같은 칸 3개에 떨어진다. 점 좌표는 시안 값 그대로(실제 탐지가 아님, `plans/method-page.md` 9절 ③).
 */
type Point = readonly [x: number, y: number, r: number];

const LIT: readonly (readonly [number, number])[] = [
  [2, 2],
  [2, 3],
  [3, 3],
];
const MODIS: readonly Point[] = [
  [96, 98, 9],
  [132, 92, 8],
  [150, 130, 9],
  [112, 104, 7],
];
const VIIRS: readonly Point[] = [
  [88, 90, 3], [95, 104, 3], [104, 94, 3], [112, 110, 3], [100, 114, 3], [90, 116, 3], [108, 86, 3],
  [126, 92, 3], [134, 104, 3], [146, 96, 3], [154, 110, 3], [130, 114, 3], [140, 88, 3], [132, 132, 3],
  [146, 140, 3], [156, 128, 3], [138, 150, 3], [150, 154, 3], [126, 144, 3],
];
const N = 6;
const C = 40;
const CELLS = Array.from({ length: N * N }, (_, k) => ({ row: Math.floor(k / N), col: k % N }));

function Grid({ points, label }: { points: readonly Point[]; label: string }) {
  return (
    <svg viewBox="0 0 240 240" className="block h-auto w-full" role="img" aria-label={label}>
      {CELLS.map(({ row, col }) => {
        const on = LIT.some(([r, c]) => r === row && c === col);
        return (
          <rect
            key={`${row}-${col}`}
            x={col * C + 1}
            y={row * C + 1}
            width={C - 2}
            height={C - 2}
            rx={4}
            strokeWidth={on ? 1.5 : 1}
            className={on ? "fill-fire/15 stroke-fire" : "fill-none stroke-line"}
          />
        );
      })}
      {points.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} className="fill-fire opacity-90" />
      ))}
    </svg>
  );
}

type Panel = { name: string; count: string; label: string };

export function CellIllustration({ modis, viirs }: { modis: Panel; viirs: Panel }) {
  return (
    // 판 전체 폭이면 칸이 한 변 70px 넘게 커져 그림만 화면을 채운다. 두 그림을 가운데 640px 안에 둔다
    <div className="mx-auto grid max-w-160 grid-cols-2 gap-8">
      {[
        { panel: modis, points: MODIS },
        { panel: viirs, points: VIIRS },
      ].map(({ panel, points }) => (
        <div key={panel.name}>
          <Grid points={points} label={panel.label} />
          <p className="mt-2.5 text-center text-sm text-muted">
            {panel.name} · <b className="font-medium text-ink">{panel.count}</b>
          </p>
        </div>
      ))}
    </div>
  );
}
