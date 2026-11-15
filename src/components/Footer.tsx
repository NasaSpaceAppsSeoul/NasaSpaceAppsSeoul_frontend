import { useMessages } from "../i18n";

/*
 * 푸터 (참고 소스 `burnline-landing 6` 첫 화면 `footer`, 2026-11-15 디자이너·사용자: "그대로 적용").
 * 위 선 아래 세 칸(가운데 칸이 정확히 가운데에 오게 세 칸 같은 폭): 왼쪽 "Hwaruruk", 가운데 자료 출처 + SI 한 줄, 오른쪽 서비스 성격.
 * Mono 13/18, #a0a2a8, 영문만 자간 .04em. 모든 화면 공통.
 * 예전의 `/meta` 출처 목록·데이터 처리일·단위 설명 줄은 참고 문구로 바꾸면서 뺐다.
 */
export function Footer() {
  const f = useMessages().footer;
  return (
    <footer className="mt-12 grid grid-cols-3 gap-6 border-t border-white/14 pt-6 pb-12 font-mono text-[13px] leading-[18px] text-[#a0a2a8] [&:lang(en)]:tracking-[0.04em]">
      <p>{f.brand}</p>
      <div className="min-w-0 text-center">
        <p>{f.source}</p>
        <p className="mt-2.5 break-words text-[#85878e]">{f.si}</p>
      </div>
      <p className="text-right">{f.note}</p>
    </footer>
  );
}
