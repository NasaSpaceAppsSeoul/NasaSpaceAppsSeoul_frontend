import { Link } from "react-router-dom";

/*
 * 기법 페이지 끝 줄 (시안 끝 `.cta`): 출처 목록, "대시보드 보기" 밝은 버튼, "맨 위로" 링크.
 * "맨 위로"는 해시 없는 같은 주소로 바꿔(기록을 쌓지 않게 `replace`) 라우터 스크롤 복원이 맨 위로 옮긴다.
 * 글자 크기·자간·폭의 임의 값(`text-[0.8125rem]` 등)은 시안 `method_page.html` CSS의 px 값을 rem으로 옮긴 것이다(토큰에 같은 크기가 없음).
 */
type MethodEndProps = {
  sourcesTitle: string;
  sources: readonly { id: string; label: string; body: string }[];
  dashboardHref: string;
  dashboard: string;
  topHref: string;
  top: string;
};

export function MethodEnd({ sourcesTitle, sources, dashboardHref, dashboard, topHref, top }: MethodEndProps) {
  return (
    <footer data-reveal className="mt-6 border-t border-line pt-10 break-keep">
      <h2 className="mb-4 font-mono text-[0.8125rem] font-medium text-muted uppercase [&:lang(en)]:tracking-[0.12em]">
        {sourcesTitle}
      </h2>
      <dl className="grid max-w-[48em] grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {sources.map((source) => (
          <div key={source.id} className="contents">
            <dt className="text-ink">{source.label}</dt>
            <dd className="text-subtle">{source.body}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-10 flex flex-wrap items-center gap-7">
        <Link
          to={dashboardHref}
          className="rounded-control bg-inverse px-6 py-3 text-base font-semibold text-surface transition-colors hover:bg-inverse-hover focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-selection"
        >
          {dashboard}
        </Link>
        <Link
          to={topHref}
          replace
          className="text-base text-subtle transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-selection"
        >
          {top}
        </Link>
      </div>
    </footer>
  );
}
