import type { ReactNode } from "react";

/*
 * 인사이트의 표 (감지된 해, 공식 기록, 주변 지역, 읽는 법, 달력 요약). 머리 줄은 회색 바탕, 강조 줄은 연한 주황 바탕,
 * 나머지 줄은 진한 글씨(screens/kr/insight.png). 칸 내용은 부르는 쪽이 만든다.
 * 줄의 첫 칸은 행 머리(`th scope="row"`)다. 칸의 key는 열 제목(표 안에서 겹치지 않는다).
 */
export type TableRow = { key: string; cells: ReactNode[]; highlight?: boolean };

type InsightTableProps = {
  caption: string;
  head: string[];
  rows: readonly TableRow[];
  /** `plain`: 강조 없는 줄도 보통 굵기(읽는 법, 요약 줄) */
  variant?: "data" | "plain";
  /** 열 폭을 똑같이 나눈다(읽는 법 반반, 요약 줄 4칸) */
  fixed?: boolean;
  /** 오른쪽 정렬할 열 번호(요약 줄의 2~4열) */
  alignRight?: readonly number[];
};

export function InsightTable({ caption, head, rows, variant = "data", fixed = false, alignRight = [] }: InsightTableProps) {
  const align = (i: number) => (alignRight.includes(i) ? "text-right" : "text-left");
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse text-sm ${fixed ? "table-fixed" : ""}`.trim()}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-wash text-muted">
          <tr>
            {head.map((title, i) => (
              <th key={title} scope="col" className={`px-4 py-3 font-normal ${align(i)}`}>
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={`border-b border-border text-ink ${
                row.highlight === true ? "bg-tone-orange" : variant === "plain" ? "" : "font-semibold"
              }`.trim()}
            >
              {row.cells.map((cell, i) =>
                i === 0 ? (
                  <th key={head[i] ?? "col-0"} scope="row" className={`px-4 py-3 [font-weight:inherit] ${align(i)}`}>
                    {cell}
                  </th>
                ) : (
                  <td key={head[i] ?? `col-${i}`} className={`px-4 py-3 ${align(i)}`}>
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
