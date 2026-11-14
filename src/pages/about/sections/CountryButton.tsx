import { Button, ButtonLink } from "../../../components/Button";
import { useMeta } from "../../../hooks/useMeta";
import { useLocale, useMessages } from "../../../i18n";
import type { Country } from "../../../lib/country";
import { dashboardPath } from "../../../lib/dashboardPath";
import { errorKind } from "../../../lib/errorKind";

/*
 * 소개 머리의 나라 버튼 하나 (`decisions.md` 2-6, 2-7). 그 나라 대시보드로 가는 링크다.
 * `/meta`가 404 `COUNTRY_NOT_READY`일 때만 "준비 중"으로 막는다. 받는 중이거나 다른 에러면 링크로 두고,
 * 서버가 꺼진 경우는 대시보드가 안내한다(1-4).
 */
const WIDE = "min-w-56";

export function CountryButton({ country }: { country: Country }) {
  const t = useMessages();
  const locale = useLocale();
  const meta = useMeta(country);
  const name = t.countries[country];

  if (meta.isError && errorKind(meta.error) === "notReady") {
    return (
      <Button size="lg" disabled title={t.common.comingSoon} className={WIDE}>
        {t.about.hero.countryNotReady(name)}
      </Button>
    );
  }
  return (
    <ButtonLink size="lg" to={dashboardPath(locale, country)} className={WIDE}>
      {t.about.hero.countryLink(name)}
    </ButtonLink>
  );
}
