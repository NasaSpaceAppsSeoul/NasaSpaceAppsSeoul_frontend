import type { ButtonHTMLAttributes } from "react";
import { Link, type LinkProps } from "react-router-dom";

/*
 * 버튼 (components/sheet/02-controls-a·b).
 * 밝은 것·어두운 것·파란 것·유리(어두운 화면 전용) × 큰 것(48)·작은 것(40). 기본·호버·눌림·포커스(파란 테두리)·비활성은 CSS 상태로 그린다.
 */

export type ButtonVariant = "light" | "dark" | "blue" | "glass";
export type ButtonSize = "lg" | "sm";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-control border font-medium whitespace-nowrap " +
  "transition-colors focus-visible:border-selection focus-visible:outline-1 focus-visible:outline-selection " +
  "disabled:cursor-not-allowed aria-disabled:cursor-not-allowed";

const VARIANT: Record<ButtonVariant, string> = {
  // 기본 버튼: 유리 위 옅은 흰 막 + 흰 선(시안 v9 `.db-quiet-button`·머리글 세그먼트와 같은 재료)
  light:
    "border-line bg-wash text-ink hover:bg-row-hover active:bg-nav-hover " +
    "disabled:bg-transparent disabled:text-muted aria-disabled:bg-transparent aria-disabled:text-muted",
  dark:
    "border-inverse bg-inverse text-surface hover:bg-inverse-hover active:bg-inverse-hover " +
    "disabled:border-line disabled:bg-transparent disabled:text-muted aria-disabled:border-line aria-disabled:bg-transparent aria-disabled:text-muted",
  blue:
    "border-action bg-action text-surface hover:bg-selection active:bg-selection " +
    "disabled:border-line disabled:bg-transparent disabled:text-muted aria-disabled:border-line aria-disabled:bg-transparent aria-disabled:text-muted",
  // 우주 배경 위 반투명 유리 버튼(시안 v9 표면 + 머리글 세그먼트 테두리). 어두운 화면에서만 쓴다
  glass:
    "glass border-segment-line text-ink hover:border-muted active:bg-nav-hover " +
    // 막힌 버튼은 마우스를 올려도 반응하지 않는다(누를 수 있어 보이지 않게)
    "disabled:border-segment-line disabled:text-muted aria-disabled:border-segment-line aria-disabled:text-muted",
};

const SIZE: Record<ButtonSize, string> = {
  lg: "h-12 px-6 text-base",
  sm: "h-10 px-4 text-sm",
};

export function buttonClass(variant: ButtonVariant = "light", size: ButtonSize = "sm", extra = ""): string {
  return `${BASE} ${VARIANT[variant]} ${SIZE[size]} ${extra}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant, size, className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

type ButtonLinkProps = LinkProps & { variant?: ButtonVariant; size?: ButtonSize };

/** 이동은 링크로 한다. 모양만 버튼이다. */
export function ButtonLink({ variant, size, className = "", ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
