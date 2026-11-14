/*
 * 지도 툴팁 (06-maps-tooltips): 흰 상자에 이름, 작은 설명, 굵은 값. 지도 위 올린 자리 근처에 뜬다.
 * 지도 영역 오른쪽 절반에서는 왼쪽으로, 위쪽 가장자리에서는 아래로 띄워 카드 밖·머리글을 덮지 않게 한다.
 */
type MapTooltipProps = {
  x: number;
  y: number;
  /** 오른쪽 절반: 왼쪽으로 띄운다 */
  flipX: boolean;
  /** 위쪽 가장자리: 아래로 띄운다 */
  below: boolean;
  title: string | null;
  label: string | null;
  value: string;
};

export function MapTooltip({ x, y, flipX, below, title, label, value }: MapTooltipProps) {
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 min-w-36 rounded-control border border-border bg-surface px-3 py-2 text-xs shadow-md"
      style={{
        left: x,
        top: y,
        transform: `translate(${flipX ? "calc(-100% - 12px)" : "12px"}, ${below ? "16px" : "calc(-100% - 8px)"})`,
      }}
    >
      {title !== null && <p className="text-sm font-medium text-ink">{title}</p>}
      {label !== null && <p className="text-muted">{label}</p>}
      <p className="font-semibold text-ink">{value}</p>
    </div>
  );
}
