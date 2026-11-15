import { Dialog } from "../Dialog";
import { MenuRow } from "../MenuRow";

/*
 * 시·도 선택·시·군·구 선택 (overlays/kr/province.png, district.png). 맨 위 "전체", 그 아래 목록(정렬은 화면이 한다, 7-4).
 */
export type ListOption = { key: string; title: string; sub?: string; selected: boolean };

type RegionListDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  options: ListOption[];
  onPick: (key: string) => void;
};

export function RegionListDialog({ open, onClose, title, description, options, onPick }: RegionListDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <ul className="flex flex-col gap-1">
        {options.map((option) => (
          <li key={option.key}>
            <MenuRow title={option.title} sub={option.sub} selected={option.selected} onSelect={() => onPick(option.key)} />
          </li>
        ))}
      </ul>
    </Dialog>
  );
}
