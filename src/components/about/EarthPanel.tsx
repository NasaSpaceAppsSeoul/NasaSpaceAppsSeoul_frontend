import { Component, lazy, Suspense, type ReactNode } from "react";
import { useMessages } from "../../i18n";

/*
 * 첫 화면 히어로의 지구 자리 (`plans/about-revise.md` 9-4). 표시 전용 래퍼다.
 * three가 크므로 지구 칸만 lazy로 따로 받는다. 받는 동안은 지구 크기의 빈 원,
 * 묶음을 받지 못하면(배포 교체·네트워크) 지구 자리에만 안내를 두고 첫 화면 글은 그대로다.
 */
const LazyEarthScene = lazy(() => import("./EarthScene").then((module) => ({ default: module.EarthScene })));

type BoundaryProps = { fallback: ReactNode; children: ReactNode };

/** 지구 칸 안의 예외만 받는다. 다시 시도는 두지 않는다(장식 그림이라 새로 고침으로 충분하다). */
export class EarthErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function EarthPlaceholder({ note }: { note?: string }) {
  return (
    <div className="flex size-full items-center justify-center">
      <div className="flex aspect-square w-[min(60%,420px)] items-center justify-center rounded-full border border-border">
        {note !== undefined && <span className="font-mono text-xs tracking-widest text-muted uppercase">{note}</span>}
      </div>
    </div>
  );
}

export function EarthPanel() {
  const t = useMessages().about.earth;
  return (
    <EarthErrorBoundary fallback={<EarthPlaceholder note={t.unavailable} />}>
      <Suspense fallback={<EarthPlaceholder />}>
        <LazyEarthScene />
      </Suspense>
    </EarthErrorBoundary>
  );
}
