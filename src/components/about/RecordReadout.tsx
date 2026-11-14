import type { ReactNode } from "react";
import { useMessages } from "../../i18n";

/*
 * 01 구역 오른쪽 비교 카드 (새 시안 v9 `.record-readout`, `design/cosmic/src/App.tsx`):
 * 머리(제목 + 아래 설명 한 줄), 원시값 | 보정값 같은 너비 두 칸(가운데 세로선), 아래 설명 줄.
 * 표시만 한다. 값의 뜻과 로딩·실패는 구역(`ConnectedSection`)이 정해 `body`로 넘긴다.
 */
type RecordReadoutProps = {
  title: string;
  /** 숫자 두 칸, 또는 그 자리의 회색 판·에러·값 없음 */
  body: ReactNode;
  note?: string;
};

export function RecordReadout({ title, body, note }: RecordReadoutProps) {
  const c = useMessages().about.connected;
  return (
    <div className="flex min-w-0 flex-col bg-surface p-8">
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <h3 className="text-xl font-medium">{title}</h3>
        <p className="text-sm text-muted">{c.readoutSub}</p>
      </div>
      <div className="py-8">{body}</div>
      {note !== undefined && <p className="border-t border-border pt-6 text-xs text-muted">{note}</p>}
    </div>
  );
}

type ReadoutValuesProps = { raw: string; harmonized: string };

/** 원시값(파랑) | 보정값(주황). 두 칸 사이 간격 가운데에 세로선(시안 `.readout-values::before`). */
export function ReadoutValues({ raw, harmonized }: ReadoutValuesProps) {
  const c = useMessages().about.connected;
  return (
    <div className="grid grid-cols-2 items-start gap-12">
      <ReadoutValue term={c.raw} tone="text-action" value={raw} unit={c.rawUnit} description={c.rawDescription} />
      <div className="relative before:absolute before:inset-y-0 before:-left-6 before:w-px before:bg-border">
        <ReadoutValue
          term={c.harmonized}
          tone="text-fire"
          value={harmonized}
          unit={c.harmonizedUnit}
          description={c.harmonizedDescription}
        />
      </div>
    </div>
  );
}

type ReadoutValueProps = { term: string; tone: string; value: string; unit: string; description: string };

/** 값마다 `dl` 하나(dt/dd 한 쌍). 두 값은 단위가 달라 칸마다 단위를 받는다(H-landing H-3) */
function ReadoutValue({ term, tone, value, unit, description }: ReadoutValueProps) {
  return (
    <dl className="flex min-w-0 flex-col">
      <dt className={`font-mono text-xs tracking-widest uppercase ${tone}`}>{term}</dt>
      <dd className="mt-3 flex flex-col gap-2">
        <span className="text-6xl leading-none font-normal">{value}</span>
        <span className="text-sm text-muted">{unit}</span>
        <span className="mt-2 text-sm text-muted">{description}</span>
      </dd>
    </dl>
  );
}
