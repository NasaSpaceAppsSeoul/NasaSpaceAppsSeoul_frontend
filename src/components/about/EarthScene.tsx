import { useCallback, useState } from "react";
import { useMessages } from "../../i18n";
import { createEarthScene, type EarthStatus } from "./createEarthScene";

/*
 * 3D 지구 칸의 React 껍데기 (`plans/about-revise.md` 9-4). `EarthPanel`이 lazy로 불러 three를 따로 묶는다.
 * `useEffect` 대신 ref 콜백이 장면을 붙이고, 돌려준 정리 함수로 뗀다(React 19).
 * 상태 문구는 사진을 받기 전·실패했을 때만 가운데에 보인다. 실패해도 첫 화면은 막지 않는다.
 */
export function EarthScene() {
  const t = useMessages().about.earth;
  const [status, setStatus] = useState<EarthStatus>("loading");
  // 렌더마다 새 함수가 되면 장면을 다시 만든다. 의존이 없어 한 번만 만든다
  const mount = useCallback((node: HTMLDivElement) => createEarthScene(node, setStatus), []);

  return (
    // 그림 이름(`role="img"`)은 캔버스 칸에만 둔다. 상태 문구와 출처 줄은 그 밖에 있어야 스크린리더가 읽는다
    <figure className="relative m-0 flex size-full flex-col">
      <div role="img" aria-label={t.label} className="relative min-h-0 flex-1">
        {/*
         * 지구 뒤 푸른 빛. 장면 색 예외(10절 ⑦)라 토큰이 아니다. Make `.earth-canvas::before` 값 그대로
         */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 aspect-square w-[min(69vh,560px)] -translate-1/2 bg-[radial-gradient(circle,rgba(43,111,157,0.12),rgba(13,40,59,0.04)_56%,transparent_72%)] blur-lg"
        />
        <div ref={mount} className="absolute inset-0" />
      </div>
      {status !== "ready" && (
        <span
          role="status"
          className="absolute top-1/2 left-1/2 -translate-1/2 font-mono text-xs tracking-widest text-muted uppercase"
        >
          {status === "loading" ? t.loading : t.unavailable}
        </span>
      )}
      <figcaption className="mt-2 self-end text-right font-mono text-xs text-muted uppercase">{t.caption}</figcaption>
    </figure>
  );
}
