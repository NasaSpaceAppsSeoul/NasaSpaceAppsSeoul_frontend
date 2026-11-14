/*
 * 작동 방식 카드 01의 격자 그림 (screens/kr/about.png). 장식이라 읽히지 않게 숨긴다.
 * 3줄 × 8칸, 파란 칸은 디자인과 같은 자리.
 */
const ROWS = 3;
const COLS = 8;
const LIT = new Set(["0-0", "0-4", "1-3", "1-7", "2-2", "2-6"]);

export function FireGridIllustration() {
  return (
    <div aria-hidden="true" className="grid grid-cols-8 gap-1">
      {Array.from({ length: ROWS * COLS }, (_, i) => {
        const key = `${Math.floor(i / COLS)}-${i % COLS}`;
        return <span key={key} className={`h-5 rounded-cell ${LIT.has(key) ? "bg-action" : "bg-chip-normal"}`} />;
      })}
    </div>
  );
}
