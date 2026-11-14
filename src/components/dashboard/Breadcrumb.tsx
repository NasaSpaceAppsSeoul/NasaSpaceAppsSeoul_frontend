import { Link } from "react-router-dom";
import { useMessages } from "../../i18n";

/**
 * 경로 표시 ("대한민국 › 경북 › 의성"). 마지막 단계는 지금 위치라 링크가 아니다.
 * 모양은 시안 v9 `.db-breadcrumb`(11px, 밝은 회색 링크, 호버 파랑).
 */
export type Crumb = { key: string; label: string; href: string | null };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  const t = useMessages().dashboard;
  return (
    <nav aria-label={t.breadcrumb}>
      <ol className="flex flex-wrap items-center gap-2 text-xs text-muted">
        {items.map((item, i) => (
          <li key={item.key} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">›</span>}
            {item.href !== null ? (
              <Link
                to={item.href}
                className="text-subtle transition-colors hover:text-selection focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-selection"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
