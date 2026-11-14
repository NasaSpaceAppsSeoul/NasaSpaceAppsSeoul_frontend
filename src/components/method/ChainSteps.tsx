/*
 * 04절 보정 사슬 (시안 `.chain`): 기간 네 칸이 화살표로 이어지고, 마지막 칸(기준 위성 실측)만 주황.
 * 칸 사이 화살표는 장식이라 읽지 않는다. 목록 순서가 곧 시간 순서다.
 * 글자 크기·자간·폭의 임의 값(`text-[0.8125rem]` 등)은 시안 `method_page.html` CSS의 px 값을 rem으로 옮긴 것이다(토큰에 같은 크기가 없음).
 */
export type ChainStep = { id: string; period: string; sensor: string; formula: string; quality: string };

export function ChainSteps({ steps, label }: { steps: readonly ChainStep[]; label: string }) {
  return (
    <ol data-reveal aria-label={label} className="grid grid-cols-4 gap-10">
      {steps.map((step, i) => {
        const live = i === steps.length - 1;
        return (
          <li
            key={step.id}
            className={`relative rounded-xl border p-4 ${live ? "border-fire bg-fire/10" : "border-line bg-wash"}`}
          >
            <p className="font-mono text-[0.78125rem] text-muted">{step.period}</p>
            <p className="mt-1.5 mb-2 font-medium text-ink">{step.sensor}</p>
            <p className="font-mono text-[0.8125rem] leading-normal text-subtle">{step.formula}</p>
            <p className={`mt-2.5 text-[0.78125rem] ${live ? "text-fire" : "text-muted"}`}>{step.quality}</p>
            {!live && (
              <span aria-hidden="true" className="absolute top-1/2 -right-10 w-10 -translate-y-1/2 text-center text-muted">
                →
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
