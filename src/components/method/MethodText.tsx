import type { ReactNode } from "react";

/*
 * 기법 페이지 본문 조각 (시안 `p`·`.note`·`.formula`·`.chain`). 모두 표시만 한다.
 * - `MethodParagraphs`: 설명 문단들
 * - `ChangeNote`: "바뀐 과정" 묶음. 왼쪽 주황 선 + 이름 + 문단(시안 `.note`). 트러블슈팅 기록을 담는다
 * - `Formula`: Mono 공식 상자와 아래 한 줄
 * - `MethodBullets`: 한계처럼 짧은 항목 목록
 * 글자 크기·자간·폭의 임의 값(`text-[0.8125rem]` 등)은 시안 `method_page.html` CSS의 px 값을 rem으로 옮긴 것이다(토큰에 같은 크기가 없음).
 */
export function MethodParagraphs({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div data-reveal className="flex max-w-[40em] flex-col gap-4 text-base leading-relaxed text-subtle">
      {paragraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

/** `items`가 있으면 문단 아래에 항목 목록을 붙인다(바뀐 정의 목록 등) */
export function ChangeNote({ title, body, items }: { title: string; body: readonly string[]; items?: readonly string[] }) {
  return (
    <aside data-reveal className="my-7 max-w-[42em] border-l-2 border-fire py-1 pl-4.5">
      <p className="mb-2 font-medium text-ink">{title}</p>
      <MethodParagraphs paragraphs={body} />
      {items !== undefined && (
        <div className="mt-3">
          <MethodBullets items={items} />
        </div>
      )}
    </aside>
  );
}

export function Formula({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div data-reveal className="my-4.5">
      {/* 한글이 든 공식은 Mono 글꼴에 한글이 없어 글자 사이가 벌어진다 → 한글 화면은 본문 글꼴 */}
      <p className="overflow-x-auto rounded-xl border border-line bg-wash px-5.5 py-4.5 font-mono text-[0.9375rem] leading-relaxed text-ink [&:lang(ko)]:font-sans">
        {children}
      </p>
      {note !== undefined && <p className="mt-2 font-mono text-xs text-muted">{note}</p>}
    </div>
  );
}

export function MethodBullets({ items }: { items: readonly string[] }) {
  return (
    <ul data-reveal className="flex max-w-[44em] list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-subtle marker:text-fire">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
