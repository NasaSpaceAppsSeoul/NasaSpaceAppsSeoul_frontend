/*
 * 기법 페이지의 설명 카드 목록 (시안 `ul.why`): 굵은 이름 한 줄 + 설명 문단. 문단이 둘 이상이면 사이를 띄운다.
 * 카드는 판 안 칸 재료(`bg-wash`). key는 이름(목록 안에서 겹치지 않는다).
 * 공용 `Card`(유리 판 + 안쪽 24, `<section>`)는 독립 구역용이라, 목록 항목으로 쌓이는 이 작은 칸에는 쓰지 않는다.
 */
export type WhyItem = { title: string; body: readonly string[] };

/** `columns={2}`: 한계처럼 짧은 칸이 많을 때 두 줄로(시안 `.limits`) */
export function WhyList({ items, columns = 1 }: { items: readonly WhyItem[]; columns?: 1 | 2 }) {
  return (
    <ul data-reveal className={`grid gap-3 ${columns === 2 ? "grid-cols-2" : "max-w-[44em]"}`}>
      {items.map((item) => (
        <li key={item.title} className="rounded-xl border border-line bg-wash px-5 py-4 text-base leading-relaxed text-subtle">
          <p className="mb-0.5 font-medium text-ink">{item.title}</p>
          <div className="flex flex-col gap-2">
            {item.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
