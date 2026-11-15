/*
 * 우주 배경의 별 자리 (디자인 시안 v9 `CosmicBackdrop.tsx`의 식을 그대로 옮김, `plans/cosmic-redesign.md` 1-2).
 * 고정된 식이라 화면을 옮기거나 다시 그려도 같은 하늘이다. 좌표는 SVG viewBox 1600 × 1000 기준.
 */
export type Star = { x: number; y: number; r: number; opacity: number; warm: boolean };

export const STAR_COUNT = 108;

export function starField(count: number = STAR_COUNT): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const seed = (i * 7919 + 104729) % 13007;
    return {
      x: ((seed * 37) % 16000) / 10,
      y: ((seed * 53) % 10000) / 10,
      // 19번째마다 조금 큰 별, 나머지는 5단계 크기
      r: i % 19 === 0 ? 1.15 : 0.35 + (i % 5) * 0.13,
      opacity: 0.18 + (i % 7) * 0.055,
      // 9번째마다 따뜻한 색(시안 #d5b99b), 나머지는 차가운 색
      warm: i % 9 === 0,
    };
  });
}
