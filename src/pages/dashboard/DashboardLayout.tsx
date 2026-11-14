import type { ReactNode } from "react";
import { apiMode } from "../../api/client";
import type { ControlsDialog, DashboardNavigate, DashboardScope } from "./scope";
import { ControlsSection } from "./sections/ControlsSection";
import { ExportSection } from "./sections/ExportSection";
import { HeadSection } from "./sections/HeadSection";
import { HeatmapSection } from "./sections/HeatmapSection";
import { JudgementSection } from "./sections/JudgementSection";
import { MapSection } from "./sections/MapSection";
import { MonthlySection } from "./sections/MonthlySection";
import { RegionListSection } from "./sections/RegionListSection";
import { RegionMapSection } from "./sections/RegionMapSection";
import { RiskSeasonSection } from "./sections/RiskSeasonSection";

/*
 * 대시보드 단계별 배치 (screens/kr/dashboard-national·province·district, `plans/dashboard-sections.md` 0절·4-4).
 * - 나라: 선택 줄 → 머리, 숫자 카드(+누적) | 나라 지도, 집중 시기 | 월별 그래프, 히트맵, 가져가기
 * - 시·도: 머리 → 선택 줄, 숫자 카드 + 두드러진 곳 3곳 | 시·도 지도, 히트맵, 가져가기
 * - 시·군·구: 머리 → 선택 줄, 숫자 카드(+인사이트 버튼) + 인접 지역 | 주변 지역 지도, 히트맵, 가져가기
 * CAL·BC는 시·도 단계가 없어 나라·카운티(지역구) 두 가지만 나온다. 지역별 구역은 `key={region.id}`로 다시 그린다.
 */
type DashboardLayoutProps = {
  scope: DashboardScope;
  navigate: DashboardNavigate;
  openDialog: (dialog: ControlsDialog) => void;
  /** 선택 줄·공유 대화상자(화면이 열림 상태를 들고 있다) */
  dialogs: ReactNode;
};

export function DashboardLayout({ scope, navigate, openDialog, dialogs }: DashboardLayoutProps) {
  const { region } = scope;
  const national = region.level === "nat";
  const district = region.level === "dist";
  const controls = <ControlsSection scope={scope} navigate={navigate} openDialog={openDialog} />;
  const head = <HeadSection scope={scope} navigate={navigate} />;
  return (
    <main className="flex flex-col gap-8 py-12">
      {national ? controls : head}
      {national ? head : controls}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <JudgementSection scope={scope} navigate={navigate} openDialog={openDialog} />
          {/* 시·도: 두드러진 곳 3곳, 시·군·구: 인접 지역. 나라 화면은 디자인대로 목록 없음 */}
          {!national && <RegionListSection key={region.id} scope={scope} navigate={navigate} />}
        </div>
        <div className="lg:col-span-2">
          {national ? (
            <MapSection key={region.id} scope={scope} navigate={navigate} />
          ) : (
            <RegionMapSection key={region.id} scope={scope} navigate={navigate} />
          )}
        </div>
      </div>
      {national && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <RiskSeasonSection scope={scope} />
          </div>
          <div className="lg:col-span-2">
            <MonthlySection scope={scope} />
          </div>
        </div>
      )}
      {/* 지역이 바뀌면 다시 그려 표시 연도를 기본으로 되돌린다 */}
      <HeatmapSection key={region.id} scope={scope} navigate={navigate} openDialog={openDialog} mockMode={apiMode() === "mock"} />
      {/* 모든 단계(디자인은 나라만, 2026-11-14 사용자 결정). 시·군·구는 인사이트 안내 줄 없음(카드에 버튼이 있다) */}
      <ExportSection navigate={navigate} insightLevel={district ? null : scope.levelNames.lv2} />
      {dialogs}
    </main>
  );
}
