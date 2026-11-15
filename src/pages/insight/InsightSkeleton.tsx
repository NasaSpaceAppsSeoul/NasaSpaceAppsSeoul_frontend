import type { ReactNode } from "react";
import { Skeleton } from "../../components/Skeleton";

/** 기준 자료를 기다리는 동안의 자리 표시. 화면 전체 로딩 대신 구역 크기의 판(1-1). */
export function InsightSkeleton() {
  return (
    <main className="flex flex-col gap-8 py-12">
      <Skeleton className="h-10" />
      <InsightSectionsSkeleton />
    </main>
  );
}

/** `/insight`를 기다리는 동안 구역 자리(머리 카드, 달력, 반 너비 두 장) */
export function InsightSectionsSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-72" />
      <Skeleton className="h-160" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-8">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

/** 기준 자료를 받지 못했을 때 구역들 대신 보이는 한 장을 감싼다. */
export function InsightMessage({ children }: { children: ReactNode }) {
  return <main className="flex flex-col items-start gap-4 py-12">{children}</main>;
}
