import { useCallback, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";

/**
 * 글자를 클립보드에 복사하고 결과를 상태로 돌려준다(공유 대화상자, `plans/dashboard-sections.md` 6절·11-7·13절).
 * 사용자 동작(대화상자 안 "링크 복사" 누름) 안에서 `copy`를 불러야 브라우저가 허락한다. `clipboard`가 없으면(보안 문맥 아님 등) 실패로 본다.
 * 부를 때마다 번호를 올려, 늦게 끝난 지난 복사의 결과가 새 결과를 덮지 않게 한다.
 */
export function useCopyText() {
  const [state, setState] = useState<CopyState>("idle");
  const seq = useRef(0);
  const copy = useCallback((text: string) => {
    seq.current += 1;
    const mine = seq.current;
    setState("idle");
    const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
    if (clipboard === undefined || typeof clipboard.writeText !== "function") {
      setState("failed");
      return;
    }
    const done = (ok: boolean) => {
      if (seq.current === mine) setState(ok ? "copied" : "failed");
    };
    // 거절된 promise 대신 바로 예외를 던지는 구현도 실패로 받는다(누름 처리가 끊기지 않게)
    try {
      clipboard.writeText(text).then(
        () => done(true),
        () => done(false),
      );
    } catch {
      done(false);
    }
  }, []);
  /** 결과를 비운다(대화상자를 다시 열 때). 진행 중인 지난 복사의 결과도 버린다 */
  const reset = useCallback(() => {
    seq.current += 1;
    setState("idle");
  }, []);
  return { state, copy, reset };
}
