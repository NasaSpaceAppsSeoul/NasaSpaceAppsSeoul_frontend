import { Link } from "react-router-dom";

/*
 * 지역 목록 줄 (components/sheet/05-charts-badges·06-maps-panel-kr-r 아래, screens/kr/dashboard-province·district).
 * 줄은 그 지역 대시보드로 가는 링크다(이동은 `a`, 스킬 responsive-layout).
 * - `ranked`(시·도 목록): 순번 네모 + 이름 + 보조 한 줄 + 오른쪽 큰 값과 단위. 순번은 목록 안의 차례일 뿐이다
 *   (`/top`의 `rank`가 아니다, `decisions.md` 6-1).
 * - `compact`(인접 지역): 디자인처럼 한 줄("안동시 · 9 화재 감지일"). 이웃이 6~8곳이어도 왼쪽 열이 지도 카드보다 길어지지 않게.
 * 줄 사이는 구분선으로 나눈다(두 목록을 같게. 디자인은 시·도 목록에 선이 없다).
 * 같은 대시보드 안에서 지역만 바꾸는 이동이라 스크롤을 맨 위로 되돌리지 않는다(`preventScrollReset`).
 */
export type RegionListRow = { id: string; name: string; sub: string | null; value: string; href: string };

type RegionListProps = {
  rows: readonly RegionListRow[];
  variant: "ranked" | "compact";
  unit: string;
};

const ROW = "flex w-full items-center gap-4 rounded-control px-2 text-left hover:bg-page focus-visible:outline-2 focus-visible:outline-selection";

export function RegionList({ rows, variant, unit }: RegionListProps) {
  const ranked = variant === "ranked";
  const List = ranked ? "ol" : "ul";
  // 마우스를 올렸을 때의 배경 여백(px-2)만큼 밖으로 빼서 이름·값이 카드 제목과 같은 선에서 시작하게 한다
  return (
    // `list-style: none`인 목록을 Safari·VoiceOver가 목록으로 알리지 않아 `role="list"`를 붙인다
    <List role="list" className="-mx-2 flex flex-col divide-y divide-border">
      {rows.map((row, i) => (
        <li key={row.id}>
          {ranked ? (
            <Link to={row.href} preventScrollReset className={`${ROW} py-3`}>
              {/* 목록(`ol`)이 순번을 알리므로 네모 숫자는 읽지 않는다 */}
              <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-control-sm bg-inverse text-sm font-medium text-surface">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-medium text-ink">{row.name}</span>
                {row.sub !== null && <span className="block truncate text-xs text-muted">{row.sub}</span>}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-xl font-semibold text-ink">{row.value}</span>
                <span className="block text-xs text-muted">{unit}</span>
              </span>
            </Link>
          ) : (
            <Link to={row.href} preventScrollReset className={`${ROW} py-3 text-base`}>
              <span className="min-w-0 truncate font-medium text-ink">{row.name}</span>
              <span aria-hidden="true" className="text-muted">
                ·
              </span>
              <span className="shrink-0 text-ink">
                <span className="font-semibold">{row.value}</span> {unit}
              </span>
            </Link>
          )}
        </li>
      ))}
    </List>
  );
}
