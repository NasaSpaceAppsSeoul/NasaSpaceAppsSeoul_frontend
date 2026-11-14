/*
 * 07절 판정을 빌리는 순서 (시안 `.flow`): 상자들이 화살표로 이어진다. 상자마다 이름 한 줄 + 설명 한 줄.
 * 화살표는 장식이라 읽지 않고, 목록 순서가 곧 빌리는 순서다.
 * 글자 크기·자간·폭의 임의 값(`text-[0.8125rem]` 등)은 시안 `method_page.html` CSS의 px 값을 rem으로 옮긴 것이다(토큰에 같은 크기가 없음).
 */
export type FlowStep = { id: string; title: string; note: string };

export function BorrowFlow({ steps, label }: { steps: readonly FlowStep[]; label: string }) {
  return (
    <ol data-reveal aria-label={label} className="my-4.5 flex flex-wrap items-stretch gap-3">
      {steps.map((step, i) => (
        <li key={step.id} className="flex flex-1 basis-40 items-center gap-3">
          <div className="h-full flex-1 rounded-xl border border-line bg-wash px-4 py-3.5">
            <p className="font-medium text-ink">{step.title}</p>
            <p className="mt-0.5 text-[0.84375rem] text-muted">{step.note}</p>
          </div>
          {i < steps.length - 1 && (
            <span aria-hidden="true" className="font-mono text-muted">
              →
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
