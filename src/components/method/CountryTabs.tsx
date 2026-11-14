import type { Country } from "../../lib/country";

/*
 * 그림 오른쪽 나라 탭 (시안 `.rtabs`). 탭 목록(`tablist`)이 아니라 눌린 상태(`aria-pressed`)를 가진 버튼 묶음이다
 * (`plans/method-page.md` 1절: 원본과 같은 단순 전환). 고른 나라는 그림마다 따로 둔다(8-3).
 */
type CountryTabsProps = {
  label: string;
  countries: readonly Country[];
  names: Readonly<Record<Country, string>>;
  value: Country;
  onChange: (country: Country) => void;
};

export function CountryTabs({ label, countries, names, value, onChange }: CountryTabsProps) {
  return (
    <div role="group" aria-label={label} className="flex gap-0.5 rounded-control border border-segment-line bg-segment p-0.75">
      {countries.map((country) => {
        const on = country === value;
        return (
          <button
            key={country}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(country)}
            className={
              "rounded-control-sm px-3 py-1.5 text-[0.8125rem] font-medium whitespace-nowrap transition-colors " +
              "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-selection " +
              (on ? "bg-segment-active text-segment-active-ink" : "text-segment-ink hover:text-ink")
            }
          >
            {names[country]}
          </button>
        );
      })}
    </div>
  );
}
