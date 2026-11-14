import { useState } from "react";
import { HeroSearchBar } from "../../../components/about/HeroSearchBar";
import { SectionError } from "../../../components/SectionError";
import { useMeta } from "../../../hooks/useMeta";
import { useRegions } from "../../../hooks/useRegions";
import { useMessages } from "../../../i18n";
import { COUNTRIES } from "../../../lib/country";
import { errorKind } from "../../../lib/errorKind";
import { CountryButton } from "./CountryButton";
import { HeroDialogs, type HeroDialog } from "./HeroDialogs";

/*
 * 소개 머리 (screens/kr/about.png 맨 위 어두운 카드).
 * 검색과 둘러보기는 한국 `/regions`·`/meta`를 쓴다(소개 화면은 한국 고정, `decisions.md` 2-7).
 * 받는 동안은 두 버튼을 막고, 실패하면 예시 줄 자리에 구역 에러를 보인다.
 */
export function HeroSection() {
  const t = useMessages();
  const h = t.about.hero;
  const regions = useRegions("KOR");
  const meta = useMeta("KOR");
  const [dialog, setDialog] = useState<HeroDialog>(null);

  const failed = regions.isError ? regions : meta.isError ? meta : null;
  const ready = regions.isSuccess && meta.isSuccess;

  return (
    <section className="flex flex-col gap-6 rounded-card bg-inverse px-6 py-10 text-surface lg:px-10">
      <p className="text-xs text-surface/70">{h.eyebrow}</p>
      <h1 className="text-display font-medium whitespace-pre-line">
        {h.titleLead}
        <span className="text-fire">{h.titleAccent}</span>
        {h.titleTail}
      </h1>
      <p className="text-base text-surface/70">{h.lead}</p>
      <HeroSearchBar
        placeholder={t.dashboard.controls.searchPlaceholder}
        browseLabel={h.browse}
        disabled={!ready}
        onSearch={() => setDialog("search")}
        onBrowse={() => setDialog("browse")}
      />
      {failed !== null ? (
        <SectionError
          kind={errorKind(failed.error)}
          onRetry={() => {
            if (regions.isError) void regions.refetch();
            if (meta.isError) void meta.refetch();
          }}
          className="text-ink"
        />
      ) : (
        <p className="text-base text-surface/70">{h.examples}</p>
      )}
      <nav aria-label={h.countriesLabel}>
        <ul className="flex flex-wrap gap-4">
          {COUNTRIES.map((country) => (
            <li key={country}>
              <CountryButton country={country} />
            </li>
          ))}
        </ul>
      </nav>
      {ready && <HeroDialogs dialog={dialog} close={() => setDialog(null)} regions={regions.data.items} meta={meta.data} />}
    </section>
  );
}
