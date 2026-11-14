/*
 * 첫 화면 새 구역의 머리 (Figma Make `.section-heading`): 주황 Mono 번호 줄("01 / 이어진 기록"), 큰 제목, 설명.
 * 예전 흰 카드 구역의 `SectionHeading`과 모양이 달라 따로 둔다(옛 구역은 조각 5에서 뺀다).
 * 제목 줄바꿈은 문구 안의 "\n".
 */
type NumberedHeadingProps = { index: string; title: string; lead?: string; id?: string };

export function NumberedHeading({ index, title, lead, id }: NumberedHeadingProps) {
  return (
    // `break-keep`: 한글이 낱말 가운데서 줄바꿈되지 않게("기록된"이 "기록/된"으로 끊기던 것)
    <header className="flex max-w-185 flex-col break-keep">
      <p className="font-mono text-xs font-medium tracking-widest text-fire uppercase">{index}</p>
      <h2 id={id} className="mt-7 text-5xl leading-tight font-normal tracking-tighter whitespace-pre-line xl:text-6xl">
        {title}
      </h2>
      {lead !== undefined && <p className="mt-6 max-w-160 text-lg text-muted">{lead}</p>}
    </header>
  );
}
