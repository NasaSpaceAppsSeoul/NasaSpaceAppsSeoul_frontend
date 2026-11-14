import type { ReactNode } from "react";
import { Card, CardHeader } from "../Card";

/*
 * 평소 화재 집중 시기 카드 (screens/kr/dashboard-national.png 아래 왼쪽): 제목, 기준 한 줄, 큰 주황 글자("3–4월"),
 * 달 수·정점 한 줄, "과거 기록의 패턴" 안내. 값은 구역이 만들어 넘긴다.
 */
type SeasonCardProps = {
  title: string;
  sub: string;
  /** "3–4월". 없으면 큰 글자 대신 `empty` 문구 */
  season: string | null;
  detail: string | null;
  note: string;
  empty: string;
  /** 일부를 못 받았을 때의 안내(다시 시도 포함) */
  notice?: ReactNode;
};

export function SeasonCard({ title, sub, season, detail, note, empty, notice }: SeasonCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader title={title} sub={sub} />
      {season === null ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="flex flex-col">
          <p className="mt-2 text-4xl font-semibold text-heat-6">{season}</p>
          {detail !== null && <p className="mt-6 text-sm text-muted">{detail}</p>}
          <p className="mt-4 text-sm text-muted">{note}</p>
        </div>
      )}
      {notice !== undefined && <div className="mt-4">{notice}</div>}
    </Card>
  );
}
