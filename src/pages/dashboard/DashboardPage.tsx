import { NotFound } from "../../components/NotFound";
import { ServerDownNotice } from "../../components/ServerDownNotice";
import { useDashboardParams } from "../../hooks/useDashboardParams";
import { useMeta } from "../../hooks/useMeta";
import { useLocale } from "../../i18n";
import { errorKind } from "../../lib/errorKind";
import { localizePath } from "../../lib/locale";
import { DashboardBody } from "./DashboardBody";
import { DashboardMessage, DashboardSkeleton } from "./DashboardSkeleton";

/**
 * 대시보드. 주소를 읽고(잘못되면 없는 주소 안내, 1-5), 나라의 `/meta`가 실패하면 구역들 대신 안내 한 장(1-4, 2-6).
 * `/meta`가 성공한 뒤에만 나머지 자료를 요청한다.
 */
export function DashboardPage() {
  const locale = useLocale();
  const params = useDashboardParams();
  const meta = useMeta(params.valid ? params.country : undefined);

  if (!params.valid) return <NotFound homeHref={localizePath("/", locale)} />;
  if (meta.data === undefined) {
    if (!meta.isError) return <DashboardSkeleton />;
    return (
      <DashboardMessage>
        <ServerDownNotice kind={errorKind(meta.error)} onRetry={() => void meta.refetch()} />
      </DashboardMessage>
    );
  }
  return <DashboardBody country={params.country} regionId={params.regionId} monthParam={params.month} meta={meta.data} />;
}
