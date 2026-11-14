/** 소개 화면 흰 구역의 머리: 파란 작은 제목, 큰 제목, 설명 한 줄(screens/kr/about.png). */
export function SectionHeading({ eyebrow, title, lead }: { eyebrow: string; title: string; lead?: string }) {
  return (
    <header className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-action">{eyebrow}</p>
      <h2 className="text-title-lg text-ink">{title}</h2>
      {lead !== undefined && <p className="text-base text-muted">{lead}</p>}
    </header>
  );
}
