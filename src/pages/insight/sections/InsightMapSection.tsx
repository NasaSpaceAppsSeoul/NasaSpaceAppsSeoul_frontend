import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { GeoFeature, Insight } from "../../../api/types";
import { SectionHeading } from "../../../components/about/SectionHeading";
import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { RegionMap, type RegionMapHover } from "../../../components/map/RegionMap";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useGeo } from "../../../hooks/useGeo";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { andParticle, formatFireDays } from "../../../lib/format";
import { insightPath } from "../../../lib/insightPath";
import { agedCells, dayDate, fillsFromValues, pickFeatures, visibleRegionIds } from "../../../lib/map";
import { neighborName } from "../../../lib/region";
import type { InsightScope } from "../scope";

/*
 * 월간 인사이트 지도 (`plans/insight.md` 12절, 디자인 `screens/kr/insight.png` 지도 카드).
 * 5장 `RegionMap`에 값만 넘긴다. 범위는 자기 + `/insight`의 이웃(일부 이웃이 실패하면 그 도형은 빠지고 안내 줄, 12-8 ⓐ).
 * 면 색은 판정 값(`head.value`, `neighbors[].v`), 점은 선택 지역 안의 `map.points`만(G-insight 카드 7).
 */
const EMPTY: readonly GeoFeature[] = [];

export function InsightMapSection({ scope, insight }: { scope: InsightScope; insight: Insight }) {
  const t = useMessages();
  const locale = useLocale();
  const navigate = useNavigate();
  const { country, region, index, month, meta, name, monthLabel } = scope;
  const geo = useGeo(country, { level: "dist" });

  const features = geo.data?.features ?? EMPTY;
  const neighbors = insight.neighbors;
  const visible = useMemo(() => {
    const ids = visibleRegionIds(features, region, neighbors.map((n) => n.id));
    return { list: ids, ...pickFeatures(features, ids) };
  }, [features, region, neighbors]);
  const values = useMemo(() => {
    const byId = new Map<string, number | null>(neighbors.map((n) => [n.id, n.v]));
    byId.set(region.id, insight.head.value);
    return byId;
  }, [neighbors, region.id, insight.head.value]);
  const fills = useMemo(() => fillsFromValues(visible.list, values, meta.labels.bins), [visible.list, values, meta.labels.bins]);
  const points = insight.map?.points;
  const cells = useMemo(() => agedCells(points ?? []), [points]);

  // 도형을 받기 전에는 응답의 이웃으로 판단한다(도형이 온 뒤 설명이 바뀌지 않게)
  const hasNeighbors = geo.data === undefined ? neighbors.length > 0 : visible.list.some((id) => id !== region.id);
  const lead = hasNeighbors ? t.insight.map.lead(name, andParticle(name), monthLabel) : t.insight.map.leadAlone(name, monthLabel);
  const frame = (body: ReactNode) => (
    <Card className="flex flex-col gap-6">
      <SectionHeading eyebrow={t.insight.map.eyebrow} title={t.insight.map.title} lead={lead} />
      {body}
    </Card>
  );

  if (geo.isError && geo.data === undefined) {
    return frame(<SectionError kind={errorKind(geo.error)} onRetry={() => void geo.refetch()} />);
  }
  if (geo.data === undefined) {
    return frame(
      <div className="flex flex-col gap-4">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-24 w-full" />
      </div>,
    );
  }

  const nameOf = (id: string) =>
    id === region.id ? name : neighborName(id, neighbors.find((n) => n.id === id)?.label_ko ?? id, region, index, locale);

  // 점 설명 줄은 점이 있을 때만(점 실패면 아래 안내, 0개면 "표시할 감지 지점이 없습니다")
  const notes: string[] = [];
  const pointCount = insight.map?.points.length ?? 0;
  if (pointCount > 0) notes.push(t.insight.map.pointsOnly(name));
  // 판정이 실패하면 `head.reason`이 `null`이라 달로 판단한다(12-8 #1). 점을 못 받았으면 MODIS 점 안내는 빼고 실패 안내만
  if (month < "2012-02" && insight.map !== null) notes.push(t.map.notes.pre2012("MODIS"));
  if (insight.map !== null && pointCount === 0) notes.push(t.insight.map.noPoints(name));
  if (insight.unavailable.includes("neighbors")) notes.push(t.insight.neighbors.partial);

  const judgeFailed = insight.unavailable.includes("judge");
  const pointsFailed = insight.map === null;
  const failedText = judgeFailed && pointsFailed ? t.insight.map.partFailed : judgeFailed ? t.insight.map.valueFailed : t.insight.map.pointsFailed;
  const notice =
    judgeFailed || pointsFailed ? (
      <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-ink">
        <p>{failedText}</p>
        <Button size="sm" onClick={scope.retry}>
          {t.common.retry}
        </Button>
      </div>
    ) : undefined;

  const describe = (hover: RegionMapHover) => {
    if (hover.kind === "point") {
      return { title: name, label: t.map.tooltip.firstDetected, value: dayDate(month, hover.cell.firstDay) };
    }
    const value = values.get(hover.id) ?? null;
    return {
      title: nameOf(hover.id),
      label: null,
      value: value === null ? t.map.tooltip.noValue : t.map.tooltip.cells(formatFireDays(value, locale)),
    };
  };

  return frame(
    <RegionMap
      features={visible.features}
      featureKey={visible.key}
      fills={fills}
      cells={cells}
      selectedId={region.id}
      bins={meta.labels.bins}
      notes={notes}
      notice={notice}
      fallbackBounds={region.bbox}
      label={t.insight.map.canvasLabel(t.insight.map.title, visible.list.length, cells.length)}
      dimmed={false}
      describe={describe}
      onRegionClick={(id) => {
        if (id !== region.id) navigate(insightPath(locale, country, id, month));
      }}
    />,
  );
}
