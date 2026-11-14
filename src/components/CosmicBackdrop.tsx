import { memo } from "react";
import { starField } from "../lib/cosmic";

/*
 * 화면 뒤에 고정된 우주 배경 (디자인 시안 v9 `CosmicBackdrop.tsx`, `plans/cosmic-redesign.md` 1-2·7-4).
 * 참조 이미지(흐린 빛) + SVG 성운 띠 + 별 + 가장자리 어둡게 + 미세 입자. 장식이라 읽지 않고 눌리지 않는다.
 * 사용자가 승인한 배경이라 값은 시안 그대로다. 색·흐림 값은 장면 상수 예외(about-revise 10절 ⑦과 같은 이유)로 이 파일과
 * `styles/index.css`의 `.cosmic-*`에만 둔다. 움직임 없음.
 */
const STARS = starField();

export const CosmicBackdrop = memo(function CosmicBackdrop() {
  return (
    <div className="cosmic-backdrop" aria-hidden="true">
      <img className="cosmic-reference" src="/assets/space/reference-light-grain.jpg" alt="" draggable={false} />
      <svg className="cosmic-clouds" viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <linearGradient id="cosmic-dust-color" x1="80" y1="1050" x2="1450" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#bd744c" />
            <stop offset=".36" stopColor="#c5bba5" />
            <stop offset=".68" stopColor="#7097ae" />
            <stop offset="1" stopColor="#c0c1b6" />
          </linearGradient>
          <filter id="cosmic-cloud-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="58" />
          </filter>
          <filter id="cosmic-fine-blur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
        <g fill="none" stroke="url(#cosmic-dust-color)" strokeLinecap="round">
          <path
            d="M-220 1190C95 1025 330 1070 506 777S741 213 1118 253 1458 133 1780-130"
            strokeWidth="230"
            opacity=".17"
            filter="url(#cosmic-cloud-blur)"
          />
          <path
            d="M-140 1112C184 1035 325 925 521 688S798 230 1117 274 1546 78 1730-60"
            strokeWidth="51"
            opacity=".13"
            filter="url(#cosmic-fine-blur)"
          />
          <path
            d="M360 1140C684 925 580 668 847 466S1072 149 1387 57"
            strokeWidth="82"
            opacity=".08"
            filter="url(#cosmic-cloud-blur)"
          />
        </g>
      </svg>
      <svg className="cosmic-stars" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" focusable="false">
        {STARS.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill={star.warm ? "#d5b99b" : "#c9d8e2"}
            opacity={star.opacity}
          />
        ))}
      </svg>
      <div className="cosmic-vignette" />
      <svg className="cosmic-grain" width="100%" height="100%" focusable="false">
        <defs>
          <filter id="cosmic-grain-filter" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" seed="17" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
        <rect width="100%" height="100%" filter="url(#cosmic-grain-filter)" />
      </svg>
    </div>
  );
});
