import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDownIcon } from "../icons";

/*
 * 지도 아래 지역 목록 (참고 소스 `burnline-landing 5` `.db-region-list` 모양, 2026-11-15 디자이너·사용자).
 * 참고처럼 두 열(사이 48, 왼쪽 열을 위에서 아래로 먼저 채움. 한 줄에 하나는 가운데가 비어 사용자가 두 열로 정함). 1곳이면 한 열.
 * 열마다 열 이름 줄(단계 이름 | 단위) 아래 줄마다 순번 | 이름(+보조 한 줄) | 값. 긴 이름은 말줄임, 마우스를 올리면 전체 이름.
 * - 순번은 목록 안의 차례일 뿐이다(`/top`의 `rank`가 아니다, `decisions.md` 6-1). 목록(`ol`)이 차례를 알리므로 숫자는 읽지 않는다.
 * - 줄의 이름은 그 지역 대시보드로 가는 링크다. 같은 대시보드 안 이동이라 스크롤을 되돌리지 않는다(`preventScrollReset`).
 * - 6곳부터는 처음 5곳만 보이고 아래 버튼으로 펼치고 접는다(참고 `.db-list-expand`, 사용자). 달·지역이 바뀌면 부르는 쪽이 `key`로 접힌 상태로 되돌린다.
 * 값은 표처럼 모인 숫자라 올라가기를 쓰지 않는다(`CountUp` 주석).
 */
export type RegionListRow = { id: string; name: string; sub: string | null; value: string; href: string };

type RegionListProps = {
  rows: readonly RegionListRow[];
  /** 열 이름 줄 왼쪽(하위 단계 이름, 예: "시·군·구") */
  headLabel: string;
  /** 열 이름 줄 오른쪽(단위) */
  unit: string;
  /** 목록 이름(화면 낭독기) */
  label: string;
  /** 펼치기·접기 버튼 글자 */
  expandLabel: (count: number) => string;
  collapseLabel: string;
};

/** 접힌 상태에서 보이는 줄 수(참고 소스와 같이 5) */
const FOLDED = 5;

export function RegionList({ rows: all, headLabel, unit, label, expandLabel, collapseLabel }: RegionListProps) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const foldable = all.length > FOLDED;
  const rows = foldable && !expanded ? all.slice(0, FOLDED) : all;
  const split = rows.length > 1;
  // 왼쪽 열 줄 수(참고 `gridTemplateRows: repeat(half)`): 줄을 세로로 먼저 채운다
  const half = Math.ceil(rows.length / 2);
  // 참고 `.db-list-head`: 12px 흐린 색, 순번 칸(28)과 사이(12)만큼 들여 쓴다, 아래 흰 14% 선. 표 머리처럼 보이기만 하고 읽지 않는다
  const head = (
    <div className="flex justify-between border-b border-white/14 pb-2 pl-10 text-xs text-[#aeb7c3]">
      <span>{headLabel}</span>
      <span>{unit}</span>
    </div>
  );
  return (
    <div className={split ? "grid grid-cols-2 gap-x-12" : ""}>
      <div aria-hidden="true" className={split ? "contents" : ""}>
        {head}
        {split && head}
      </div>
      {/* `list-style: none`인 목록을 Safari·VoiceOver가 목록으로 알리지 않아 `role="list"`를 붙인다. 목록은 하나라 읽는 순서는 순번대로 */}
      <ol
        id={listId}
        role="list"
        aria-label={label}
        className={split ? "col-span-2 grid grid-flow-col grid-cols-2 gap-x-12" : ""}
        style={split ? { gridTemplateRows: `repeat(${half}, auto)` } : undefined}
      >
        {rows.map((row, i) => (
          // 참고 `.db-map-list-row`: 순번 28 | 이름 | 값, 사이 12, 최소 높이 52, 위아래 10, 아래 흰 7% 선
          <li key={row.id} className="grid min-h-13 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/7 py-2.5">
            <span aria-hidden="true" className="text-right text-xs text-[#8e98a6]">
              {i + 1}
            </span>
            <span className="min-w-0">
              <Link
                to={row.href}
                preventScrollReset
                title={row.name}
                className="block truncate text-[15px] text-[#eef2f6] hover:text-[#83bdff] focus-visible:outline-2 focus-visible:outline-selection"
              >
                {row.name}
              </Link>
              {row.sub !== null && <span className="mt-0.5 block truncate text-[11px] leading-[1.6] text-[#818b99]">{row.sub}</span>}
            </span>
            <span className="text-right text-[17px] text-[#e3bc9a] tabular-nums">
              {row.value}
              <span className="sr-only"> {unit}</span>
            </span>
          </li>
        ))}
      </ol>
      {foldable && (
        // 참고 `.db-list-expand`: 가운데, 위 20, 11px 파란 글자, 아래 화살표(펼치면 위로)
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((v) => !v)}
          className={`${split ? "col-span-2" : ""} flex w-full cursor-pointer items-center justify-center gap-2 pt-5 text-[11px] text-[#9cb7d9] hover:text-[#d1e4ff] focus-visible:outline-2 focus-visible:outline-selection`}
        >
          {expanded ? collapseLabel : expandLabel(all.length)}
          <ChevronDownIcon className={`size-2.75 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
