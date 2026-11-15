import { useRouteError } from "react-router-dom";
import { Button } from "../../components/Button";
import { useMessages } from "../../i18n";

/**
 * 화면을 그리다 예외가 났을 때의 안내. 머리글·푸터 안쪽(경로 없는 자식 라우트)에서 그려져 언어를 잃지 않는다.
 * 에러를 console에만 남기지 않도록 원인 문장도 작게 보여 준다.
 */
export function RouteErrorPage() {
  const t = useMessages();
  const error = useRouteError();
  const detail = error instanceof Error ? error.message : undefined;
  return (
    <main role="alert" className="flex flex-col items-start gap-4 py-12">
      <h1 className="text-title-lg">{t.routeError.title}</h1>
      <p className="text-base text-muted">{t.routeError.body}</p>
      {detail !== undefined && detail !== "" && <p className="text-xs break-words text-muted">{detail}</p>}
      <Button variant="dark" size="lg" onClick={() => window.location.reload()}>
        {t.routeError.reload}
      </Button>
    </main>
  );
}
