import type { ReactNode } from "react";
import { useMessages } from "../i18n";
import type { ErrorKind } from "../lib/errorKind";
import { Button } from "./Button";

/** 다시 해서 나아질 수 있는 종류만 "다시 시도"를 보여 준다. 지역·범위·준비 안 됨은 같은 요청을 다시 해도 같다. */
const RETRYABLE: ReadonlySet<ErrorKind> = new Set(["offline", "other"]);

type SectionErrorProps = {
  /** 구역이 `lib/errorKind`로 나눠 넘긴다. 컴포넌트는 에러 객체를 보지 않는다 */
  kind: ErrorKind;
  onRetry: () => void;
  /** 종류에 맞는 다른 행동(예: 지역을 못 찾으면 "지역 선택 열기") */
  action?: ReactNode;
  className?: string;
};

/** 구역 에러 (`decisions.md` 1-2, 1-3): 실패한 요청을 쓰는 구역 안에 문구와 "다시 시도". */
export function SectionError({ kind, onRetry, action, className = "" }: SectionErrorProps) {
  const t = useMessages();
  return (
    <div
      role="alert"
      className={`flex flex-col items-start gap-3 rounded-card border border-border bg-surface p-6 ${className}`.trim()}
    >
      <p className="text-sm text-ink">{t.errors[kind]}</p>
      <div className="flex flex-wrap gap-2">
        {RETRYABLE.has(kind) && (
          <Button size="sm" onClick={onRetry}>
            {t.common.retry}
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
