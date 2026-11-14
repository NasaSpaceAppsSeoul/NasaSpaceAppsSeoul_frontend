import { CorrectionSection } from "./sections/CorrectionSection";
import { DetectionSection } from "./sections/DetectionSection";
import { HeroSection } from "./sections/HeroSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";

/*
 * 소개 화면 (screens/kr/about.png). 구역 배치만 한다. 데이터는 구역이 각자 부른다.
 * 화면 전체를 막는 상태가 없다: 서버가 꺼져도 문구 구역은 보이고 숫자 구역만 다시 시도를 띄운다(`H-landing.md` H-6).
 */
export function AboutPage() {
  return (
    <main className="flex flex-col gap-8 pt-2 pb-4">
      <HeroSection />
      {/* 히어로 "스크롤해서 읽기"가 가는 곳. 조각 3에서 새 01 구역(Connected records)으로 옮긴다 */}
      <div id="connected">
        <CorrectionSection />
      </div>
      <HowItWorksSection />
      <DetectionSection />
    </main>
  );
}
