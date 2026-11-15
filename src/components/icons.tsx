/*
 * 작은 아이콘 (components/sheet/01-brand). 색은 글자색(`currentColor`)을 따른다. 뜻은 옆 글자나 `aria-label`이 전한다.
 */
type IconProps = { className?: string };

export function ChevronDownIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SearchIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" strokeLinecap="round" />
    </svg>
  );
}

/** 사슬 고리 두 개(링크 복사) */
export function LinkIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d="M6.5 9.5l3-3" strokeLinecap="round" />
      <path d="M7 4.5l1.2-1.2a2.8 2.8 0 014 4L11 8.5" strokeLinecap="round" />
      <path d="M9 11.5l-1.2 1.2a2.8 2.8 0 01-4-4L5 7.5" strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d="M8 3v10M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

export function MinusIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d="M3 8h10" strokeLinecap="round" />
    </svg>
  );
}

/** 초기화(되돌리기 화살표, 06-maps-national) */
export function ResetIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d="M3.5 8a4.5 4.5 0 1 0 1.4-3.3" strokeLinecap="round" />
      <path d="M3.5 2.5v2.5H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 내려받기(아래 화살표 + 받침, 시안 v11 달력 `Icon name="download"`) */
export function DownloadIcon({ className = "size-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={className}>
      <path d="M8 2.5v7.5M4.75 7l3.25 3.25L11.25 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.5 11v2.5h11V11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
