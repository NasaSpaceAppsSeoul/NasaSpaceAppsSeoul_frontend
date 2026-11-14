import { useMessages } from "../i18n";

/*
 * 푸터 (components/sheet/03-nav-a 위, screens/kr/about.png 맨 아래).
 * 대회 이름과 단위 설명은 고정 문구다. 출처와 데이터 처리일은 백엔드 `/meta`의 값을 받는다(2026-11-14 사용자 결정).
 * 값이 아직 없으면(로딩·실패) 그 줄만 그리지 않는다.
 */
type FooterProps = {
  /** `/meta.sources` */
  sources: string[] | undefined;
  /** `/meta.generated_at`의 날짜 부분(YYYY-MM-DD) */
  processedOn: string | undefined;
};

export function Footer({ sources, processedOn }: FooterProps) {
  const t = useMessages();
  return (
    <footer className="mt-12 flex flex-col gap-2 border-t border-border py-6 text-sm text-muted">
      <p className="font-semibold text-ink">{t.footer.title}</p>
      {sources !== undefined && sources.length > 0 && (
        <p>
          {t.footer.sources}: {sources.join(" · ")}
        </p>
      )}
      <p>{t.footer.unit}</p>
      {processedOn !== undefined && (
        <p className="text-xs">
          {t.footer.processed} {processedOn}
        </p>
      )}
    </footer>
  );
}
