import { useMessages } from "../i18n";
import type { ErrorKind } from "../lib/errorKind";
import { Button } from "./Button";

/**
 * `/meta`가 실패했을 때 대시보드·월간 인사이트의 구역들 대신 보이는 한 장 (`decisions.md` 1-4).
 * - `offline`: 서버 꺼짐 + 다시 시도
 * - `notReady`: 준비 안 된 나라(2-6). 다시 해도 같으니 다시 시도를 두지 않는다
 * - 그 밖(터널 404 등): 불러오지 못함 + 다시 시도
 * 머리글·푸터는 그대로 남는다.
 */
export function ServerDownNotice({ kind, onRetry }: { kind: ErrorKind; onRetry: () => void }) {
  const t = useMessages();
  const text = kind === "notReady" ? t.countryNotReady : kind === "offline" ? t.serverDown : t.loadFailed;
  return (
    <section role="alert" className="flex flex-col items-start gap-4 rounded-card bg-surface p-12">
      <h2 className="text-title-lg font-semibold text-ink">{text.title}</h2>
      <p className="text-base text-muted">{text.body}</p>
      {kind !== "notReady" && (
        <Button variant="dark" size="lg" onClick={onRetry}>
          {t.common.retry}
        </Button>
      )}
    </section>
  );
}
