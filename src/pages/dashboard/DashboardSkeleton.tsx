import type { ReactNode } from "react";
import { Skeleton } from "../../components/Skeleton";

/** 기준 자료(`/meta`, `/regions`, 나라 시계열)를 기다리는 동안의 자리 표시. 화면 전체 로딩 대신 구역 크기의 판 두 장(1-1). */
export function DashboardSkeleton() {
  return (
    <main className="flex flex-col gap-8 py-12">
      <Skeleton className="h-40" />
      <Skeleton className="h-80" />
    </main>
  );
}

/** 기준 자료를 받지 못했을 때 구역들 대신 보이는 한 장을 감싼다. */
export function DashboardMessage({ children }: { children: ReactNode }) {
  return <main className="flex flex-col items-start gap-4 py-12">{children}</main>;
}
