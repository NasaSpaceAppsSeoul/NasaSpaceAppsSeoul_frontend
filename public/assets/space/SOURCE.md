# 우주 배경 (Shared cosmic background)

- `reference-light-grain.jpg`: 디자인 시안 v9(2026-11-14)에 함께 온 참조 이미지. 원본을 바꾸지 않고 그대로 두었고, 화면에서는 흐림·채도 낮춤으로 은은한 빛 층으로만 쓴다(`src/styles/index.css` `.cosmic-*`).
- 성운 띠·별·미세 입자는 `src/components/CosmicBackdrop.tsx`가 SVG로 그리는 장식이다. 천체 관측이나 화재 자료가 아니다.
- 실행 중에 내려받는 자원, 캔버스 애니메이션, 새 의존성은 없다. 지구 이미지 출처는 `public/assets/earth/SOURCE.md`.
