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
  /**
   * 인사이트 표 모양(참고안 테마, 2026-11-15 디자이너): 틀·회색 머리 바탕 없이 머리 줄 13px 흐림 + 아래 흰 14% 선,
   * 줄 사이 흰 8% 선, 본문 보통 굵기 #ecece8, 강조 줄은 옅은 주황 바탕. 첫 열은 절 글과 같은 선에서 시작한다.
   * 기법 페이지는 이 표시 없이 쓴다(그쪽 모양은 그대로).
   */
  framed?: boolean;
};

export function InsightTable({ caption, head, rows, variant = "data", fixed = false, alignRight = [], framed = false }: InsightTableProps) {
  const align = (i: number) => (alignRight.includes(i) ? "text-right" : "text-left");
  // 인사이트 모양은 첫 열 왼쪽·마지막 열 오른쪽 여백을 없애 절 글과 같은 선에 맞춘다
  const pad = (i: number) => (framed ? `px-4 ${i === 0 ? "pl-0" : ""} ${i === head.length - 1 ? "pr-0" : ""}` : "px-4");
  return (
    <div data-reveal={framed ? "" : undefined} className="overflow-x-auto">
      <table className={`w-full border-collapse text-sm ${fixed ? "table-fixed" : ""}`.trim()}>
        <caption className="sr-only">{caption}</caption>
        <thead className={framed ? "border-b border-white/14 text-[13px] text-[#a9b2bf]" : "bg-wash text-muted"}>
          <tr>
            {head.map((title, i) => (
              <th key={title} scope="col" className={`${pad(i)} ${framed ? "pt-0 pb-2.5" : "py-3"} font-normal ${align(i)}`}>
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={
                framed
                  ? `border-b border-white/8 text-[#ecece8] ${row.highlight === true ? "bg-[rgba(233,163,107,0.1)]" : ""}`.trim()
                  : `border-b border-border text-ink ${row.highlight === true ? "bg-tone-orange" : variant === "plain" ? "" : "font-semibold"}`.trim()
              }
            >
              {row.cells.map((cell, i) =>
                i === 0 ? (
                  <th key={head[i] ?? "col-0"} scope="row" className={`${pad(i)} py-3 [font-weight:inherit] ${align(i)}`}>
                    {cell}
                  </th>
                ) : (
                  <td key={head[i] ?? `col-${i}`} className={`${pad(i)} py-3 ${align(i)}`}>
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
