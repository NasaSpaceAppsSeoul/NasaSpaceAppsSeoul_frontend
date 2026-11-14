import type { ReactNode } from "react";
import { apiMode } from "../../api/client";
import type { ControlsDialog, DashboardNavigate, DashboardScope } from "./scope";
import { ControlsSection } from "./sections/ControlsSection";
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
 * 모든 단계 머리 → 선택 줄·경로 줄, 그 아래 배치 B(넓은 칸 | 오른쪽 칸):
 * - 나라: 나라 지도 | 숫자 카드 + 누적, 월별 그래프 | 집중 시기, 히트맵(두 칸)
 * - 시·도: 시·도 지도 | 숫자 카드, 두드러진 곳 3곳(두 칸), 히트맵(두 칸)
 * - 시·군·구: 주변 지역 지도 | 숫자 카드(+인사이트 버튼), 인접 지역(두 칸), 히트맵(두 칸)
 * CAL·BC는 시·도 단계가 없어 나라·카운티(지역구) 두 가지만 나온다. 지역별 구역은 `key={region.id}`로 다시 그린다.
 */
/** 두 칸 격자. 오른쪽 칸 너비는 시안 값(데스크톱만 하는 범위라 한 칸으로 접지 않는다) */
const GRID =
  "grid grid-cols-[minmax(0,1fr)_280px] items-start gap-4 min-[1121px]:grid-cols-[minmax(0,1fr)_304px] min-[1121px]:gap-6 " +
  "min-[1440px]:grid-cols-[minmax(0,1fr)_336px]";

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
  const controls = <ControlsSection scope={scope} navigate={navigate} openDialog={openDialog} />;
  const head = <HeadSection scope={scope} />;
  return (
    <main className="flex flex-col gap-8 py-12">
      {/* 모든 단계에서 머리 → 선택 줄·경로 줄(시안 v9 순서, `plans/cosmic-redesign.md` 8-3) */}
      {head}
      {controls}
      {/*
       * 배치 B (`plans/cosmic-redesign.md` 8-3, 시안 `.db-overview-grid`): 넓은 칸 | 오른쪽 칸(304, 1440+ 336, 1120 이하 280).
       * 단계마다 없는 카드가 있으면 남은 카드가 두 칸을 다 쓴다(나라 단계는 지역 목록 없음)
       */}
      {/* 한 격자 안의 형제라 지역별로 다시 그리는 구역의 key가 겹치지 않게 앞에 이름을 붙인다 */}
      <div className={GRID}>
        {national ? (
          <MapSection key={`map-${region.id}`} scope={scope} navigate={navigate} />
        ) : (
          <RegionMapSection key={`map-${region.id}`} scope={scope} navigate={navigate} />
        )}
        <JudgementSection scope={scope} navigate={navigate} openDialog={openDialog} />
        {/* 시·도: 두드러진 곳 3곳, 시·군·구: 인접 지역. 나라 화면은 디자인대로 목록 없음 */}
        {!national && (
          <div className="col-span-2">
            <RegionListSection key={`list-${region.id}`} scope={scope} navigate={navigate} />
          </div>
        )}
        {/*
         * "자료 가져가기" 카드는 뺐다(2026-11-15 사용자): 감지 지점 내려받기는 백엔드에 없고(`/map` 점은 표본),
         * 달별 CSV는 히트맵에 있다. "이 화면 링크 복사"는 경로 줄 오른쪽으로 옮겼다(`ControlsSection`)
         */}
        {national && <MonthlySection scope={scope} />}
        {national && <RiskSeasonSection scope={scope} />}
        {/* 지역이 바뀌면 다시 그려 표시 연도를 기본으로 되돌린다 */}
        <div className="col-span-2">
          <HeatmapSection key={region.id} scope={scope} navigate={navigate} openDialog={openDialog} mockMode={apiMode() === "mock"} />
        </div>
      </div>
      {dialogs}
    </main>
  );
}
