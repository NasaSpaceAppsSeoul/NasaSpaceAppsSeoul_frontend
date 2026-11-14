/** 지도 구역 자리 (4장 지도 컴포넌트가 `dev`에 병합되면 바꾼다). 회색 판과 "준비 중" 한 줄만 */
export function MapPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-card bg-page">
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
