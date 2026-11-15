import { Link } from "react-router-dom";
import { useMessages } from "../i18n";

/**
 * 없는 주소 안내 (`decisions.md` 1-5). 없는 경로, 잘못된 나라 코드, 잘못된 `?month=`에 같이 쓴다.
 * 처음 화면 주소는 언어에 맞게 만들어 넘겨받는다.
 */
export function NotFound({ homeHref }: { homeHref: string }) {
  const t = useMessages();
  return (
    <main className="flex flex-col items-start gap-4 py-12">
      <h1 className="text-title-lg">{t.notFound.title}</h1>
      <p className="text-base text-muted">{t.notFound.body}</p>
      <Link className="text-action underline" to={homeHref}>
        {t.notFound.home}
      </Link>
    </main>
  );
}
