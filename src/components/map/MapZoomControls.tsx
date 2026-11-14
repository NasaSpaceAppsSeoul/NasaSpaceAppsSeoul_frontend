import { useMessages } from "../../i18n";
import { MinusIcon, PlusIcon, ResetIcon } from "../icons";
import type { ZoomState } from "./MapCanvas";

/*
 * 확대·축소·초기화 세로 버튼 묶음 (06-maps-national, 모서리가 둥근 직사각형). 처음 크기에서는 축소·초기화, 최대에서는 확대가 비활성이다.
 */
type MapZoomControlsProps = { state: ZoomState; onZoomIn: () => void; onZoomOut: () => void; onReset: () => void };

// 묶음이 둥근 모서리를 자르므로(overflow-hidden) 초점 표시는 버튼 안쪽 링으로 그린다
const BUTTON =
  "flex size-9 items-center justify-center text-ink transition-colors hover:bg-row-hover disabled:cursor-not-allowed " +
  "disabled:text-muted/50 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 " +
  "focus-visible:ring-inset focus-visible:ring-selection";

export function MapZoomControls({ state, onZoomIn, onZoomOut, onReset }: MapZoomControlsProps) {
  const t = useMessages().map.zoom;
  return (
    <div className="flex flex-col overflow-hidden glass rounded-control border border-line">
      <button type="button" className={BUTTON} onClick={onZoomIn} disabled={!state.canZoomIn} aria-label={t.in}>
        <PlusIcon />
      </button>
      <button type="button" className={BUTTON} onClick={onZoomOut} disabled={!state.canZoomOut} aria-label={t.out}>
        <MinusIcon />
      </button>
      <button type="button" className={BUTTON} onClick={onReset} disabled={state.atStart} aria-label={t.reset}>
        <ResetIcon />
      </button>
    </div>
  );
}
