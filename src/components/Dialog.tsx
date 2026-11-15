import { useId, useRef, type MouseEvent, type ReactNode } from "react";
import { useMessages } from "../i18n";
import { Button } from "./Button";

/*
 * 대화상자 틀 (components/sheet/02-controls-b "대화상자 머리", overlays/).
 * 브라우저 내장 `<dialog>`를 모달로 연다: Esc로 닫기, 포커스 가두기, 뒤 화면 막기는 브라우저가 한다.
 * `useEffect`를 쓰지 않는다. 열려 있을 때만 그리고, ref 콜백이 붙을 때 `showModal()`, 떨어질 때 `close()`를 부른다.
 */

/**
 * 이 코드가 직접 닫은 대화상자. 그때 생기는 `close` 이벤트는 사용자의 닫기가 아니므로 `onClose`로 넘기지 않는다.
 * (개발 모드의 StrictMode는 ref를 붙였다 떼었다 다시 붙인다. 뗄 때의 `close`를 넘기면 열리자마자 닫힌다.)
 */
const closedByCode = new WeakSet<HTMLDialogElement>();

/** 모듈 수준 함수라 렌더마다 바뀌지 않는다. 그래서 다시 그려도 ref 콜백이 다시 불리지 않는다. */
function openModal(node: HTMLDialogElement) {
  if (!node.open) {
    node.showModal();
    // `showModal()`이 포커스를 첫 버튼(닫기)으로 옮기므로, 먼저 받을 칸이 있으면 그리로 옮긴다(예: 검색 입력)
    node.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }
  return () => {
    if (!node.open) return;
    closedByCode.add(node);
    node.close();
  };
}

type DialogProps = {
  open: boolean;
  /**
   * Esc, 닫기 버튼, 바깥 클릭, 브라우저가 스스로 닫은 경우 모두 이것을 부른다. 부모가 `open`을 `false`로 바꾼다.
   * 닫히는 중에 한 번 더 불릴 수 있으니 여러 번 불려도 같은 결과가 되게 만든다(예: `setOpen(false)`).
   */
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /**
   * 화면 안 위치. 기본은 세로 가운데. 내용 길이가 바뀌는 대화상자(검색 결과)는 `top`으로 위쪽에 붙여
   * 높이가 바뀌어도 위 가장자리가 움직이지 않고 아래로만 늘고 줄게 한다(2026-11-14 사용자 확인).
   */
  placement?: "center" | "top";
  /**
   * 높이를 고정하고 안쪽 전체 대신 자식이 정한 부분만 스크롤한다(검색 대화상자: 목록만, 참고 소스 `.ps-modal`
   * `min(680px, 화면 − 32px)`, UI 다듬기 2026-11-15). 위쪽 붙임의 최대 높이 84vh 안에서. 자식은 `flex-1 min-h-0`으로 남은 높이를 채운다
   */
  fixedHeight?: boolean;
};

/*
 * `top`: 위 여백 8vh에 붙이고, 아래 여백을 같게 남겨 화면을 넘지 않게 한다(84vh = 100 - 8 - 8).
 * 기본(`m-auto`)은 브라우저 기본 최대 높이를 쓴다.
 */
const PLACEMENT = {
  center: "m-auto",
  top: "mx-auto mt-[8vh] mb-auto max-h-[84vh]",
} as const;

export function Dialog({ open, onClose, title, description, children, placement = "center", fixedHeight = false }: DialogProps) {
  const t = useMessages();
  const titleId = useId();
  const descriptionId = useId();
  // 누른 곳과 뗀 곳이 모두 바깥(뒤 막)일 때만 닫는다. 안쪽에서 끌어 선택하다 바깥에서 놓은 경우는 닫지 않는다
  const pressedOnBackdrop = useRef(false);
  const releasedOnBackdrop = useRef(false);
  if (!open) return null;

  const isBackdrop = (event: MouseEvent<HTMLDialogElement>) => event.target === event.currentTarget;

  return (
    <dialog
      ref={openModal}
      aria-labelledby={titleId}
      aria-describedby={description !== undefined ? descriptionId : undefined}
      // Esc를 누르면 브라우저가 `cancel`을 보낸다. 직접 닫지 않고 부모가 상태를 바꾸게 한다
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // 브라우저가 `cancel` 없이 닫은 경우에도 부모 상태를 맞춘다. 이 코드가 직접 닫은 것은 넘기지 않는다
      onClose={(event) => {
        if (closedByCode.delete(event.currentTarget)) return;
        onClose();
      }}
      onMouseDown={(event) => {
        pressedOnBackdrop.current = isBackdrop(event);
      }}
      // 누른 곳과 뗀 곳이 다르면 브라우저는 `click`을 공통 부모(dialog)에 보낸다. 그래서 뗀 곳을 따로 기록한다
      onMouseUp={(event) => {
        releasedOnBackdrop.current = isBackdrop(event);
      }}
      onClick={(event) => {
        if (pressedOnBackdrop.current && releasedOnBackdrop.current && isBackdrop(event)) onClose();
        pressedOnBackdrop.current = false;
        releasedOnBackdrop.current = false;
      }}
      // 스크롤은 안쪽에서만 생기게 해 대화상자 자신(바깥으로 판정됨)의 스크롤바를 누르는 일이 없게 한다.
      // 모양은 카드와 같은 유리 재료(진한 반투명 + 흐림 24px + 흰 선 하나), 뒤 막은 어둡게 흐려 별이 살짝 비친다
      className={
        `${PLACEMENT[placement]} ${fixedHeight ? "h-[min(680px,84vh)]" : ""} flex-col w-full max-w-xl overflow-hidden open:flex rounded-card border border-line ` +
        "bg-dialog p-0 text-ink shadow-[0_24px_80px_#0006] backdrop-blur-[24px] backdrop-saturate-[1.1] " +
        "backdrop:bg-scrim backdrop:backdrop-blur-[8px]"
      }
    >
      <div className={`flex min-h-0 w-full flex-col gap-4 p-6 ${fixedHeight ? "h-full overflow-hidden" : "overflow-y-auto"}`}>
        <header className="flex items-center justify-between gap-4">
          <h2 id={titleId} className="text-xl font-semibold">
            {title}
          </h2>
          <Button size="sm" onClick={onClose}>
            {t.common.close}
          </Button>
        </header>
        {description !== undefined && (
          <p id={descriptionId} className="text-sm text-muted">
            {description}
          </p>
        )}
        {children}
      </div>
    </dialog>
  );
}
