import { useMutation } from "@tanstack/react-query";
import { downloadCsv } from "../api/timeseries";
import type { Country } from "../api/types";
import { csvFileName, saveFile } from "../lib/saveFile";

/**
 * 히트맵 "월별 CSV"(9장, `decisions.md` 4-8). 서버 `/export.csv?id=`를 받아 그대로 저장한다.
 * 받는 중(`isPending`)·실패(`error`)는 대화상자가 보인다. 캐시하지 않는다(누를 때마다 새로 받음).
 */
export function useCsvDownload(country: Country, id: string) {
  return useMutation({
    mutationFn: async () => saveFile(await downloadCsv(country, id, { timeoutMs: 20_000 }), csvFileName(country, id)),
  });
}
