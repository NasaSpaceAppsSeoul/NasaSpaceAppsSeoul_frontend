import { NumberedHeading } from "../../../components/about/NumberedHeading";
import { ReadoutValues, RecordReadout } from "../../../components/about/RecordReadout";
import { SensorDiagram } from "../../../components/about/SensorDiagram";
import { SectionError } from "../../../components/SectionError";
import { Skeleton } from "../../../components/Skeleton";
import { useLanding } from "../../../hooks/useLanding";
import { useLocale, useMessages } from "../../../i18n";
import { errorKind } from "../../../lib/errorKind";
import { formatFireDays } from "../../../lib/format";
import { READOUT_YEAR, readoutYear } from "../../../lib/landing";

/*
 * 01 이어진 기록 (Figma Make `design/extra/landing-01.jpg`, `plans/about-revise.md` 1·9-5·10절 ①).
 * 왼쪽 고정 그림, 오른쪽 한국 `/landing` 연간 값 중 2011년(MODIS 마지막 해)의 보정 전 → 후.
 * 로딩은 숫자 자리만 회색, 실패는 카드 안 구역 에러 + 다시 시도, 그 해 값이 없으면 "값 없음".
 * 히어로 "스크롤해서 읽기"가 이 구역(`#connected`)으로 온다.
 */
export function ConnectedSection() {
  const t = useMessages();
  const c = t.about.connected;
  const locale = useLocale();
  const landing = useLanding("KOR");
  const readout = landing.data !== undefined ? readoutYear(landing.data.annual) : null;

  const body = landing.isPending ? (
    <Skeleton className="h-40" />
  ) : landing.isError ? (
    <SectionError kind={errorKind(landing.error)} onRetry={() => void landing.refetch()} />
  ) : readout === null ? (
    <p className="text-base text-muted">{c.noValue}</p>
  ) : (
    <ReadoutValues raw={formatFireDays(readout.before, locale)} harmonized={formatFireDays(readout.after, locale)} />
  );

  return (
    // `tabIndex={-1}`: 히어로 "스크롤해서 읽기"가 초점을 옮겨 올 수 있게(탭 순서에는 들지 않는다)
    <section id="connected" tabIndex={-1} aria-labelledby="connected-title" className="flex flex-col gap-12 py-24 outline-none">
      <NumberedHeading id="connected-title" index={c.index} title={c.title} lead={c.lead} />
      <div className="grid border-y border-border xl:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]">
        {/* 그림은 오른쪽 카드 높이의 세로 가운데(Make `.record-stage` align-items) */}
        <div className="flex items-center py-10 xl:pr-8">
          <SensorDiagram />
        </div>
        <div className="border-t border-border xl:border-t-0 xl:border-l">
          <RecordReadout
            title={c.readoutTitle(t.countries.KOR, READOUT_YEAR)}
            body={body}
            // 설명 줄은 값이 보일 때만(로딩·실패·값 없음에서는 설명할 숫자가 없다)
            note={readout !== null ? c.note(READOUT_YEAR) : undefined}
          />
        </div>
      </div>
    </section>
  );
}
