/**
 * 받은 `Blob`을 파일로 저장한다(9장, 히트맵 CSV·달력 PNG). 임시 주소를 만들어 내려받기 링크를 누르고 곧 지운다.
 * 파일 이름은 부르는 쪽이 정한다(다른 출처 응답의 `Content-Disposition`은 브라우저가 읽지 못한다).
 */
export function saveFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.append(a);
  a.click();
  a.remove();
  // 내려받기가 시작된 뒤 지운다(바로 지우면 일부 Firefox·Safari가 내려받기를 끊는다. FileSaver.js와 같은 40초)
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}

const unsafe = (id: string) => id.replace(/[\\/:*?"<>|\s]+/g, "_");

/** CSV 파일 이름: `burnline_{나라}_{지역 ID}.csv`(서버 `Content-Disposition`과 같은 모양). 파일 이름에 못 쓰는 글자는 `_` */
export function csvFileName(country: string, id: string): string {
  return `burnline_${country}_${unsafe(id)}.csv`;
}

/**
 * 달력 PNG 파일 이름: `burnline_{나라}_{지역 ID}_calendar.png`. 보정 전 그림은 `_calendar_raw.png`로 둘을 구분한다(9장 2차)
 */
export function calendarFileName(country: string, id: string, basis: "harmonized" | "raw" = "harmonized"): string {
  return `burnline_${country}_${unsafe(id)}_calendar${basis === "raw" ? "_raw" : ""}.png`;
}
