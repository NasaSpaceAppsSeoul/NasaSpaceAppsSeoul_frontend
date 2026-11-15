/*
 * 10절 새 지역 추가 단계 (시안 `ol.steps`): 다섯 칸이 한 줄, 칸마다 주황 Mono 번호 + 이름 + 설명.
 * 번호는 목록 순서에서 만든다(01, 02 …).
 * 글자 크기·자간·폭의 임의 값(`text-[0.8125rem]` 등)은 시안 `method_page.html` CSS의 px 값을 rem으로 옮긴 것이다(토큰에 같은 크기가 없음).
 */
export type Step = { id: string; title: string; body: string };

export function StepList({ steps, label }: { steps: readonly Step[]; label: string }) {
  return (
    <ol data-reveal aria-label={label} className="grid grid-cols-5 gap-2.5">
      {steps.map((step, i) => (
        <li key={step.id} className="rounded-xl border border-line bg-wash px-3.5 pt-3.5 pb-4 text-sm text-muted">
          <span aria-hidden="true" className="mb-2 block font-mono text-xs font-medium text-fire">
            {String(i + 1).padStart(2, "0")}
          </span>
          <p className="mb-1 text-[0.9375rem] font-medium text-ink">{step.title}</p>
          <p className="leading-normal">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
