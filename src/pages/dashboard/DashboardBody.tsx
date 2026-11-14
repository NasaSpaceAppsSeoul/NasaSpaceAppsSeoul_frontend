import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { Meta, RegionSummary } from "../../api/types";
import { Button } from "../../components/Button";
import { SectionError } from "../../components/SectionError";
import { useCopyText } from "../../hooks/useCopyText";
import { useRegions } from "../../hooks/useRegions";
import { useSeries } from "../../hooks/useSeries";
import { useLocale, useMessages } from "../../i18n";
import type { Country } from "../../lib/country";
import { dashboardPath } from "../../lib/dashboardPath";
import { insightPath } from "../../lib/insightPath";
import { errorKind } from "../../lib/errorKind";
import { monthRange } from "../../lib/month";
import { indexRegions } from "../../lib/region";
import { DashboardLayout } from "./DashboardLayout";
import { DashboardMessage, DashboardSkeleton } from "./DashboardSkeleton";
import type { ControlsDialog, DashboardNavigate, DashboardScope } from "./scope";
import { ControlsDialogs } from "./sections/ControlsDialogs";

type DashboardBodyProps = { country: Country; regionId: string | undefined; monthParam: string | undefined; meta: Meta };

/**
 * `/regions`와 나라 시계열(달 범위)을 확인해 "지금 보는 범위"와 이동·공유를 만들고, 배치는 `DashboardLayout`에 맡긴다.
 * 받아 둔 자료가 있으면 다시 받다 실패해도 그 자료로 계속 그린다(에러 한 장은 처음부터 받지 못했을 때만).
 */
export function DashboardBody({ country, regionId, monthParam, meta }: DashboardBodyProps) {
  const t = useMessages();
  const locale = useLocale();
  const routerNavigate = useNavigate();
  const [dialog, setDialog] = useState<ControlsDialog>(null);
  const copier = useCopyText();
  const regions = useRegions(country);
  const series = useSeries(country, country);

  const current = regionId ?? null;
  const shareUrl = window.location.origin + dashboardPath(locale, country, current, monthParam ?? null);
  const go = (region: string | null, month: string | null, c: Country = country) =>
    void routerNavigate(dashboardPath(locale, c, region, month));
  const navigate: DashboardNavigate = {
    toRegion: (id) => go(id, monthParam ?? null),
    toMonth: (month) => go(current, month),
    toCountry: (c) => go(null, null, c),
    regionHref: (id) => dashboardPath(locale, country, id, monthParam),
    insightHref: (id) => insightPath(locale, country, id, monthParam),
    // 공유 대화상자를 연다. 복사는 대화상자 안 "링크 복사"를 눌렀을 때(2026-11-14 사용자 결정)
    share: () => {
      copier.reset();
      setDialog("share");
    },
  };

  // 지역 자리에 나라 ID가 오면 나라 주소로
  if (regionId === country) return <Navigate to={dashboardPath(locale, country, null, monthParam)} replace />;
  // 처음부터 받지 못한 기준 자료가 있으면 에러 한 장. "다시 시도"는 실패한 것을 모두 다시 받는다
  const failed = [regions, series].filter((query) => query.data === undefined && query.isError);
  const firstFailed = failed[0];
  if (firstFailed !== undefined) {
    return (
      <DashboardMessage>
        <SectionError
          kind={errorKind(firstFailed.error)}
          onRetry={() => failed.forEach((query) => void query.refetch())}
          className="w-full"
        />
      </DashboardMessage>
    );
  }
  if (regions.data === undefined || series.data === undefined) return <DashboardSkeleton />;

  const range = monthRange(series.data.months);
  if (range === null) {
    return (
      <DashboardMessage>
        <SectionError kind="other" onRetry={() => void series.refetch()} className="w-full" />
      </DashboardMessage>
    );
  }
  // 주소에 달이 없으면 자료의 마지막 달(7-2)을 주소에 써 넣는다(나중에 다시 받아도 달이 바뀌지 않게)
  if (monthParam === undefined) return <Navigate to={dashboardPath(locale, country, current, range.last)} replace />;

  const items = regions.data.items;
  const index = indexRegions(items);
  const nation = items.find((r) => r.level === "nat");
  const found = current !== null ? index.get(current) : nation;
  const region: RegionSummary | undefined = found ?? nation;
  if (region === undefined) {
    return (
      <DashboardMessage>
        <SectionError kind="other" onRetry={() => void regions.refetch()} className="w-full" />
      </DashboardMessage>
    );
  }

  const province = region.level === "prov" ? region : region.province !== null ? (index.get(region.province) ?? null) : null;
  const scope: DashboardScope = {
    country,
    meta,
    regions: items,
    index,
    region,
    province: meta.labels.single ? null : province,
    month: monthParam,
    range,
    countrySeries: series.data,
    levelNames: locale === "ko" ? { lv1: meta.labels.lv1, lv2: meta.labels.lv2 } : t.levelNames[country],
  };
  const dialogs = (
    <ControlsDialogs scope={scope} dialog={dialog} close={() => setDialog(null)} navigate={navigate} share={{ url: shareUrl, state: copier.state, copy: () => copier.copy(shareUrl) }} />
  );

  // 주소의 지역이 목록에 없다: 구역들 대신 안내 한 장과 지역 검색(나라 기준으로 연다)
  if (found === undefined) {
    return (
      <DashboardMessage>
        <div role="alert" className="flex flex-col gap-4">
          <h1 className="text-title-lg text-ink">{t.dashboard.regionMissing.title}</h1>
          <p className="text-base text-muted">{t.dashboard.regionMissing.body}</p>
        </div>
        <Button variant="dark" size="lg" onClick={() => setDialog("search")}>
          {t.errors.openRegionPicker}
        </Button>
        {dialogs}
      </DashboardMessage>
    );
  }

  return <DashboardLayout scope={scope} navigate={navigate} openDialog={setDialog} dialogs={dialogs} />;
}
