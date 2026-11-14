import { Link } from "react-router-dom";
import { useMessages } from "../../i18n";

/** 경로 표시 ("대한민국 › 경북 › 의성"). 마지막 단계는 지금 위치라 링크가 아니다. */
export type Crumb = { key: string; label: string; href: string | null };

export function Breadcrumb({ items }: { items: Crumb[] }) {
  const t = useMessages().dashboard;
  return (
    <nav aria-label={t.breadcrumb}>
      <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
        {items.map((item, i) => (
          <li key={item.key} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true">›</span>}
            {item.href !== null ? (
              <Link to={item.href} className="hover:text-ink hover:underline">
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
