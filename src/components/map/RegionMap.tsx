import { useState, type ReactNode } from "react";
import type { GeoFeature } from "../../api/types";
import type { AgedCell, Bounds, FillState } from "../../lib/map";
import { MapCanvas, type MapHover } from "./MapCanvas";
import { MapLegend } from "./MapLegend";
import { MapTooltip } from "./MapTooltip";

/*
 * 지역 지도 (디자인 `06-maps-regional`, `06-maps-legends` 가로형): 시·도 지도, 시·군·구 + 맞닿은 지역 지도,
 * 선택 지역 파란 테두리, 지도 아래 가로형 범례. 대시보드(5장)와 월간 인사이트(7장)가 같이 쓴다.
 * 범위(scope)·훅·주소를 모르고 값과 콜백만 받는다.
 *
 * 확대하지 않는 고정 지도이고 감지 지점은 처음부터 작은 점이다(디자인대로, 2026-11-14 사용자 결정.
 * 번짐 → 확대하면 점 방식을 시험했다가 되돌렸다, `plans/dashboard-sections.md` 12절).
 *
 * 올림: 점 순번은 응답마다 달라지므로, 순번을 그때의 칸으로 풀어 `describe`에 넘기고
 * `cells`나 `featureKey`가 바뀌면(달·지역이 바뀌면) 올림을 버린다(지난 응답의 점을 가리키지 않게).
 */
export type RegionMapHover = { kind: "point"; cell: AgedCell } | { kind: "region"; id: string };
export type RegionMapTooltip = { title: string | null; label: string | null; value: string };

type RegionMapProps = {
  /** 이미 거른 도형(`lib/map` `pickFeatures`) */
  features: readonly GeoFeature[];
  featureKey: string;
  fills: ReadonlyMap<string, FillState>;
  /**
   * `lib/map` `agedCells`. `fills`와 함께 `useMemo`로 메모해서 넘긴다: 같은 배열이면 지도가 점을 다시 넣지 않고,
   * 배열이 바뀌면 올려 둔 툴팁을 버린다(매번 새로 만들면 다시 그릴 때마다 툴팁이 사라진다)
   */
  cells: readonly AgedCell[];
  /** 파란 테두리. 이 도형이 보일 때만 범례에 "선택 지역" 줄이 나온다 */
  selectedId: string | null;
  bins: readonly [number, number, number];
  /** 범례 아래 안내 줄(표본·2012년 전·범위 밖) */
  notes: readonly string[];
  /** 범례 아래 자리(다시 시도가 있는 안내 등) */
  notice?: ReactNode;
  fallbackBounds: Bounds | null;
  /** 지도 칸 `aria-label` */
  label: string;
  /** 새 달을 받는 동안 흐리게 */
  dimmed: boolean;
  describe: (hover: RegionMapHover) => RegionMapTooltip | null;
  /** 없으면 구역을 눌러도 아무 일이 없고 손가락 커서도 없다 */
  onRegionClick?: (id: string) => void;
};

export function RegionMap(props: RegionMapProps) {
  const { features, featureKey, fills, cells, selectedId, bins, notes, notice, fallbackBounds, label, dimmed, describe, onRegionClick } = props;
  const [hover, setHover] = useState<{ at: MapHover; cells: readonly AgedCell[]; featureKey: string } | null>(null);

  const tooltip = (() => {
    if (hover === null || hover.cells !== cells || hover.featureKey !== featureKey) return null;
    const h = hover.at;
    let target: RegionMapHover | null = null;
    if (h.kind === "point") {
      const cell = cells[h.index];
      if (cell !== undefined) target = { kind: "point", cell };
    } else {
      target = { kind: "region", id: h.id };
    }
    const text = target === null ? null : describe(target);
    if (text === null) return null;
    // 오른쪽 절반은 왼쪽으로, 위쪽 1/4은 아래로 띄워 카드 밖을 덮지 않게 한다
    return { ...text, x: h.x, y: h.y, flipX: h.x > h.width / 2, below: h.y < h.height / 4 };
  })();
  const selectedShown = selectedId !== null && features.some((f) => f.properties.id === selectedId);

  return (
    <div className="flex flex-col gap-4">
      <div
        aria-busy={dimmed}
        className={`relative aspect-video w-full overflow-hidden rounded-card bg-page transition-opacity ${dimmed ? "opacity-60" : ""}`}
      >
        <MapCanvas
          variant="regional"
          features={features}
          featureKey={featureKey}
          fills={fills}
          selectedId={selectedId}
          cells={cells}
          fallbackBounds={fallbackBounds}
          label={label}
          onRegionClick={onRegionClick}
          onHover={(at) => setHover(at === null ? null : { at, cells, featureKey })}
        />
        {tooltip !== null && <MapTooltip {...tooltip} />}
      </div>
      <MapLegend bins={bins} showSelected={selectedShown} notes={notes} orientation="horizontal" showZoomNote={false} />
      {notice}
    </div>
  );
}
