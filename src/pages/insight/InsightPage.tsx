import { NotFound } from "../../components/NotFound";
import { ServerDownNotice } from "../../components/ServerDownNotice";
import { useDashboardParams } from "../../hooks/useDashboardParams";
import { useMeta } from "../../hooks/useMeta";
import { useLocale } from "../../i18n";
import { errorKind } from "../../lib/errorKind";
import { localizePath } from "../../lib/locale";
import { InsightBody } from "./InsightBody";
import { InsightMessage, InsightSkeleton } from "./InsightSkeleton";

/**
 * 월간 인사이트. 주소를 읽고(잘못되면 없는 주소 안내, 1-5), 나라의 `/meta`가 실패하면 구역들 대신 안내 한 장(1-4).
 * `/meta`가 성공한 뒤에만 나머지 자료를 요청한다.
 */
export function InsightPage() {
  const locale = useLocale();
  const params = useDashboardParams();
  const meta = useMeta(params.valid ? params.country : undefined);

  if (!params.valid || params.regionId === undefined) return <NotFound homeHref={localizePath("/", locale)} />;
  if (meta.data === undefined) {
    if (!meta.isError) return <InsightSkeleton />;
    return (
      <InsightMessage>
        <ServerDownNotice kind={errorKind(meta.error)} onRetry={() => void meta.refetch()} />
      </InsightMessage>
    );
  }
  return <InsightBody country={params.country} regionId={params.regionId} monthParam={params.month} meta={meta.data} />;
}
