import { useCallback, useId, useState, type ReactNode } from "react";

/*
 * ⓘ 도움말: 동그라미 안 "i" 버튼. 마우스를 올리거나 키보드로 초점을 주면 밝은 설명 판이 뜬다(2026-11-15 사용자).
 * 설명은 버튼의 `aria-describedby`로 이어져 화면 낭독기도 읽는다. 누르는 동작은 없다(설명만).
 * 접근성(WCAG 1.4.13)
 * - 설명 판 위로 마우스를 옮겨도 닫히지 않게 판과 버튼 사이에 틈을 두지 않는다(투명한 아래 여백).
 * - Esc를 누르면 닫힌다: 마우스만 올려 연 경우도 닫히도록 문서의 키 입력을 듣는다(`useEffect` 대신 ref 콜백).
 *   마우스가 떠나거나 초점이 바뀌면 다시 열 수 있다.
 * 이름 붙은 묶음(`group/info`)이라 다른 `group` 안에 놓여도 바깥 호버로 열리지 않는다.
 * 설명 판 모양은 첫 화면 막대 툴팁과 같은 밝은 판(시안 v9 `.bar-tooltip`: #efefec 바탕·#202022 글자·그림자, 장식 상수).
 * `children`을 주면 "i" 대신 그 내용(보이는 글자)이 버튼이 된다(히트맵 상태 칩, 시안 v11 `.db-calendar-status button`).
 */
type InfoTipProps = {
  /** 읽는 이름(예: "점선과 실선의 뜻") */
  label: string;
  text: string;
  /** 설명 판이 열리는 쪽. 오른쪽 끝에 놓일 때는 `end` */
  align?: "start" | "end";
  /** 버튼 내용. 주면 보이는 글자가 이름이라 `label`은 쓰지 않는다 */
  children?: ReactNode;
  /** `children`을 줄 때 버튼 모양 */
  triggerClassName?: string;
};

export function InfoTip({ label, text, align = "start", children, triggerClassName = "" }: InfoTipProps) {
  const id = useId();
  const [dismissed, setDismissed] = useState(false);
  // 문서 어디서든 Esc → 닫기. 붙어 있는 동안만 듣는다
  const listenEscape = useCallback(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDismissed(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const reopen = () => setDismissed(false);

  return (
    <span ref={listenEscape} className="group/info relative inline-flex" onMouseLeave={reopen}>
      {children !== undefined ? (
        <button
          type="button"
          aria-describedby={id}
          onFocus={reopen}
          onBlur={reopen}
          className={`${triggerClassName} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-selection`}
        >
          {children}
        </button>
      ) : (
        <button
          type="button"
          aria-label={label}
          aria-describedby={id}
          onFocus={reopen}
          onBlur={reopen}
          className="grid size-5 place-items-center rounded-full border border-muted text-muted transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-selection"
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3">
            <circle cx="8" cy="4.5" r="1.1" fill="currentColor" />
            <path d="M8 7v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      )}
      {/* 바깥 칸의 아래 여백(pb-2)이 버튼과 판 사이를 메워, 판으로 마우스를 옮겨도 호버가 끊기지 않는다 */}
      <span
        className={
          `invisible absolute bottom-full z-20 pb-2 opacity-0 transition-opacity duration-160 ${align === "end" ? "right-0" : "left-0"} ` +
          (dismissed
            ? ""
            : "group-hover/info:visible group-hover/info:opacity-100 group-focus-within/info:visible group-focus-within/info:opacity-100")
        }
      >
        <span
          id={id}
          role="tooltip"
          className="block w-72 rounded-md bg-[#efefec] p-3 text-left text-xs/[18px] text-[#202022] shadow-[0_6px_18px_rgba(0,0,0,0.24)]"
        >
          {text}
        </span>
      </span>
    </span>
  );
}
