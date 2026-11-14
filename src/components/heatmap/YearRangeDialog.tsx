import { useMessages } from "../../i18n";
import type { YearMode } from "../../lib/heatmap";
import { Dialog } from "../Dialog";
import { MenuRow } from "../MenuRow";

/** 표시 연도 (overlays/kr/year-range, 4-7): 전체 / 2012년부터(VIIRS 시기). 히트맵에서만 쓴다. */
type YearRangeDialogProps = {
  open: boolean;
  onClose: () => void;
  firstYear: number;
  lastYear: number;
  mode: YearMode;
  onPick: (mode: YearMode) => void;
};

export function YearRangeDialog({ open, onClose, firstYear, lastYear, mode, onPick }: YearRangeDialogProps) {
  const t = useMessages().heatmap.yearDialog;
  return (
    <Dialog open={open} onClose={onClose} title={t.title} description={t.description}>
      <div className="flex flex-col gap-1">
        <MenuRow title={t.all(firstYear, lastYear)} selected={mode === "all"} onSelect={() => onPick("all")} />
        <MenuRow title={t.viirs(lastYear)} sub={t.viirsSub} selected={mode === "viirs"} onSelect={() => onPick("viirs")} />
      </div>
    </Dialog>
  );
}
