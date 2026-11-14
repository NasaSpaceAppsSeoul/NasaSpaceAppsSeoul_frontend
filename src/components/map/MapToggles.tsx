import { useMessages } from "../../i18n";
import { Button } from "../Button";

/*
 * 지도 카드 머리의 모드(화재 칸·위치 / 평소 대비)와 보기(지도 / 목록) 전환 (06-maps-panel-kr-l).
 * "평소 대비"와 "목록"은 자리만 잡는다(구현 범위: 백엔드 값 추가를 기다림). 눌리지 않고 "준비 중"을 읽어 준다.
 */
export function MapToggles() {
  const t = useMessages().map;
  const soon = (label: string) => (
    <Button variant="light" disabled aria-label={`${label} · ${t.soon}`} title={t.soon}>
      {label}
    </Button>
  );
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-2">
        <Button variant="dark" aria-pressed="true">
          {t.modes.cells}
        </Button>
        {soon(t.modes.usual)}
      </div>
      <div className="flex gap-2">
        <Button variant="dark" aria-pressed="true">
          {t.views.map}
        </Button>
        {soon(t.views.list)}
      </div>
    </div>
  );
}
