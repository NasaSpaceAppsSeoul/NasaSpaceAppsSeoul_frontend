import { useMessages } from "../../i18n";
import type { CopyState } from "../../hooks/useCopyText";
import { Button } from "../Button";
import { Dialog } from "../Dialog";

/*
 * 이 화면 공유 (overlays/kr/share-link.png). 카드의 "이 화면 링크 복사"는 이 대화상자를 열기만 하고,
 * 복사는 안의 "링크 복사"를 눌렀을 때 한다(2026-11-14 사용자 결정). 열 때 포커스는 그 버튼.
 * 지역 경로·달 한 줄, 실제 주소(선택해서 직접 복사할 수도 있게) + 복사 버튼, 복사 결과, "완료".
 * 디자인의 "프로토타입 미리보기 · 클립보드 복사는 지원하지 않습니다"는 실제 동작으로 바꿨다.
 */
type ShareDialogProps = {
  open: boolean;
  onClose: () => void;
  /** "대한민국 / 2026년 7월" */
  label: string;
  url: string;
  state: CopyState;
  onCopy: () => void;
};

export function ShareDialog({ open, onClose, label, url, state, onCopy }: ShareDialogProps) {
  const t = useMessages().dashboard.share;
  return (
    <Dialog open={open} onClose={onClose} title={t.title} description={t.description}>
      <div className="flex flex-col gap-6">
        <p className="text-base text-ink">{label}</p>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1 text-sm text-muted">
            {t.urlLabel}
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="h-10 w-full rounded-control-sm border border-border bg-page px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-selection"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button data-autofocus onClick={onCopy}>
              {t.copy}
            </Button>
            <p role="status" className={`text-sm ${state === "failed" ? "text-heat-6" : "text-muted"}`}>
              {state === "copied" ? t.copied : state === "failed" ? t.failed : ""}
            </p>
          </div>
        </div>
        <Button variant="dark" size="lg" onClick={onClose}>
          {t.done}
        </Button>
      </div>
    </Dialog>
  );
}
