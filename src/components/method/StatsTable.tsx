import { errorKind } from "../../lib/errorKind";
import { InsightTable, type TableRow } from "../insight/InsightTable";
import { SectionError } from "../SectionError";

type StatsTableProps = {
  caption: string;
  head: string[];
  rows: readonly TableRow[];
  /** 받지 못한 나라가 있으면 표 아래에 에러와 "다시 시도"(실패한 칸은 "—") */
  failed: { error: unknown; retry: () => void } | null;
};

/** 기법 페이지 03·04·05의 서버 값 표 (9장 3차). 테두리 상자는 다른 기법 표와 같다 */
export function StatsTable({ caption, head, rows, failed }: StatsTableProps) {
  return (
    <>
      <div data-reveal className="overflow-hidden rounded-xl border border-line">
        <InsightTable caption={caption} head={head} rows={rows} variant="plain" />
      </div>
      {failed !== null && <SectionError className="mt-3" kind={errorKind(failed.error)} onRetry={failed.retry} />}
    </>
  );
}
