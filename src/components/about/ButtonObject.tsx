/**
 * 버튼 오른쪽의 마름모 장식 (시안 v9 `.button-object`): 남색→주황 비스듬한 판 위에 기울어진 테두리 사각형.
 * 감싸는 버튼에 `group`이 있으면 호버 때 돈다(움직임 줄이기면 멈춤). 장식이라 읽지 않는다.
 * 색은 장식 그림 값(장면 색 예외, about-revise 10절 ⑦)이라 토큰이 아니다.
 * 히어로 검색 줄과 03 "대시보드 보기" 버튼이 같이 쓴다(공용 `Button`에 변형을 더하지 않는다, about-revise 9-6).
 */
export function ButtonObject() {
  return (
    <span
      aria-hidden="true"
      className={
        "grid size-10 shrink-0 rotate-6 place-items-center rounded-control-sm border border-white/70 " +
        "bg-[linear-gradient(145deg,rgba(255,255,255,0.7),transparent_35%),linear-gradient(145deg,#123756,#f1682d)] " +
        "shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.45),inset_5px_5px_8px_rgba(255,255,255,0.22)] " +
        "transition-transform duration-400 group-hover:rotate-95 group-hover:scale-90 motion-reduce:transition-none"
      }
    >
      <span className="size-4.5 rotate-35 rounded-cell border border-white/70" />
    </span>
  );
}
