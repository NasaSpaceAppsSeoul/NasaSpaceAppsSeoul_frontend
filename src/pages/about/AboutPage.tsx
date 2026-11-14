import { useScrollReveal } from "../../hooks/useScrollReveal";
import { ConnectedSection } from "./sections/ConnectedSection";
import { ContextSection } from "./sections/ContextSection";
import { HeroSection } from "./sections/HeroSection";
import { LimitsSection } from "./sections/LimitsSection";

/*
 * 첫 화면 (새 시안 v9, `plans/about-revise.md`·`plans/cosmic-redesign.md`). 구역 배치만 한다. 데이터는 구역이 각자 부른다.
 * 히어로 → 01 이어진 기록 → 02 지역 맥락 → 03 신뢰와 한계. 예전 구역(보정 막대·방법 카드·감지율)은 화면에서 뺐다
 * (파일 정리는 8-2 끝, about-revise 9-6).
 * 히어로 아래 구역의 `[data-reveal]` 묶음은 화면에 들어올 때 떠오른다(`useScrollReveal`).
 * 화면 전체를 막는 상태가 없다: 서버가 꺼져도 문구 구역은 보이고 숫자 구역만 다시 시도를 띄운다(`H-landing.md` H-6).
 */
export function AboutPage() {
  const reveal = useScrollReveal();
  return (
    <main ref={reveal} className="flex flex-col pt-2 pb-4">
      <HeroSection />
      <ConnectedSection />
      <ContextSection />
      <LimitsSection />
    </main>
  );
}
