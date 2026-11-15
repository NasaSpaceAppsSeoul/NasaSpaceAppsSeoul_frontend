import { useMessages } from "../../i18n";

/*
 * 01 구역 왼쪽의 고정 그림 (Figma Make `.sensor-diagram`, `design/extra/landing-01.jpg`):
 * MODIS·VIIRS 두 기록 → 공통 기준으로 맞추기 → 하나로 이어진 화재 달력.
 * 그림 하나로 읽히게 `role="img"`와 이름을 두고, 안쪽 글자는 화면에만 보인다.
 * 화살표는 Make의 CSS 회전선 대신 SVG로 그린다(Make CSS는 옮기지 않는다, 9-3).
 */
const NODE = "flex flex-col justify-center gap-1 border border-border bg-surface p-3";
const KEY = "font-mono text-xs text-muted";

/** 위·아래 두 줄이 가운데로 모이는 화살표(sources → basis) */
function MergeArrow() {
  return (
    <svg viewBox="0 0 32 100" preserveAspectRatio="none" aria-hidden="true" className="h-full w-8 text-muted">
      <path d="M0 26 L30 50 M0 74 L30 50" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
      <path d="M25 46 L30 50 L25 54" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" />
    </svg>
  );
}

function ForwardArrow() {
  return (
    <svg viewBox="0 0 32 12" aria-hidden="true" className="w-8 text-muted">
      <path d="M0 6 H30 M25 2 L30 6 L25 10" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function SensorDiagram() {
  const c = useMessages().about.connected;
  return (
    <div
      role="img"
      aria-label={c.diagramLabel}
      // 칸 폭을 다 채운다(참고 `.sensor-diagram`은 칸 자체가 격자). 안 채우면 글자 길이만큼만 넓어져
      // 한글(라벨이 짧음)과 영어의 폭이 달라지고 오른쪽 카드와 틈이 벌어진다(UI 다듬기 2026-11-15 사용자)
      className="grid w-full grid-cols-[minmax(7rem,1fr)_2rem_minmax(7.5rem,1fr)_2rem_minmax(7.5rem,1fr)] items-center"
    >
      <div className="flex flex-col gap-2">
        <div className={`${NODE} min-h-18 border-l-2 border-l-muted`}>
          <strong className="font-medium">{c.modis}</strong>
          <span className={KEY}>{c.modisSub}</span>
        </div>
        <div className={`${NODE} min-h-18 border-l-2 border-l-action`}>
          <strong className="font-medium">{c.viirs}</strong>
          <span className={KEY}>{c.viirsSub}</span>
        </div>
      </div>
      <MergeArrow />
      <div className={`${NODE} min-h-22 gap-2 border-fire/45`}>
        <span className={`${KEY} uppercase`}>{c.alignKey}</span>
        <strong className="font-medium text-fire">{c.alignTitle}</strong>
      </div>
      <ForwardArrow />
      <div className={`${NODE} min-h-22`}>
        <span className={`${KEY} uppercase`}>{c.calendarKey}</span>
        <strong className="text-sm font-medium">{c.calendarTitle}</strong>
      </div>
    </div>
  );
}
