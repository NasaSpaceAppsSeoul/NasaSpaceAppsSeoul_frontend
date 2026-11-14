import { useMessages } from "../../i18n";
import type { ErrorKind } from "../../lib/errorKind";
import { Button } from "../Button";
import { Dialog } from "../Dialog";

/*
 * 내려받기 확인 대화상자(overlays/kr/export-csv·export-png, 9장). 제목, 설명, 내용 상자(파일 종류와 담긴 것), 큰 "내려받기".
 * 디자인의 "프로토타입 미리보기 · 실제 파일은 내려받지 않습니다" 줄은 실제 동작이라 뺐다(`decisions.md` 4-8).
 * 받는 중에는 버튼을 `aria-disabled`로 막고(포커스는 버튼에 남는다) 문구를 바꾼다. 받는 중에는 부르는 쪽이 닫기를 막는다.
 * 실패는 대화상자 안에 보이고, 다시 해서 나아질 수 있는 에러만 같은 버튼으로 다시 시도한다.
 */
type ExportDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  detail: string;
  busy: boolean;
  /** 실패했으면 그 종류. 서버 에러는 `errorKind`, PNG처럼 서버가 없는 실패는 `message`로 */
  error: { kind: ErrorKind } | { message: string } | null;
  onDownload: () => void;
};

const RETRYABLE: ReadonlySet<ErrorKind> = new Set(["offline", "other"]);

export function ExportDialog({ open, onClose, title, detail, busy, error, onDownload }: ExportDialogProps) {
  const t = useMessages();
  const e = t.heatmap.exports;
  const errorText = error === null ? null : "kind" in error ? t.errors[error.kind] : error.message;
  // 다시 해도 소용없는 에러(없는 지역 등)는 버튼을 막는다
  const blocked = error !== null && "kind" in error && !RETRYABLE.has(error.kind);
  return (
    <Dialog open={open} onClose={onClose} title={title} description={e.description}>
      <div className="flex flex-col gap-6">
        {/* 디자인의 옅은 파란 상자 → 어두운 유리 테마의 옅은 막 */}
        <div className="flex flex-col gap-1 rounded-card border border-line bg-wash px-6 py-5">
          <p className="text-base font-medium text-ink">{title}</p>
          <p className="text-sm text-muted">{detail}</p>
        </div>
        {errorText !== null && (
          <p role="alert" className="text-sm text-tone-red-ink">
            {errorText}
          </p>
        )}
        <Button
          variant="dark"
          size="lg"
          data-autofocus
          aria-disabled={busy || blocked}
          aria-busy={busy}
          onClick={() => {
            if (!busy && !blocked) onDownload();
          }}
          className={busy || blocked ? "cursor-not-allowed opacity-60" : ""}
        >
          {busy ? e.downloading : e.download}
        </Button>
        {/* 버튼 글자 바뀜을 화면 읽기 프로그램에도 알린다 */}
        <p role="status" className="sr-only">
          {busy ? e.downloading : ""}
        </p>
      </div>
    </Dialog>
  );
}
