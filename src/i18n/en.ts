import type { Messages } from "./ko";

/** 영어 문구. 디자인 영문판에서 그대로 옮긴다. */
export const en: Messages = {
  brand: "Burnline",
  nav: {
    label: "Main menu",
    about: "About",
    dashboard: "Dashboard",
  },
  language: {
    label: "Language",
    ko: "KR",
    en: "EN",
    koName: "한국어",
    enName: "English",
  },
  pages: {
    about: "About",
    dashboard: "Dashboard",
    insight: "Monthly insight",
  },
  notFound: {
    title: "Page not found",
    body: "Check the address. The country is one of KOR, CAL or BC, and the month is written like 2025-03.",
    home: "Back to start",
  },
  routeError: {
    title: "Something went wrong while drawing this page",
    body: "Reload the page. If it keeps happening, start again from the first page.",
    reload: "Reload",
  },
  footer: {
    title: "Burnline · NASA Space Apps Challenge 2026",
    sources: "Sources",
    unit: "A fire grid-day is one approximately 1 km cell with fire detected on one day. It is not a fire incident count or burned area.",
    processed: "Data processed",
  },
  mockBanner: "Showing mock data",
  common: {
    retry: "Try again",
    close: "Close",
    loading: "Loading",
    comingSoon: "Coming soon",
  },
  errors: {
    offline: "Could not reach the server. Please try again in a moment.",
    notReady: "Data for this country is not ready yet.",
    region: "This region could not be found. Please choose a region again.",
    range: "This month is outside the data range.",
    other: "Could not load the data.",
    openRegionPicker: "Choose a region",
  },
  serverDown: {
    title: "Cannot reach the server",
    body: "The fire record server is not responding. Please try again in a moment.",
  },
  countryNotReady: {
    title: "This country is not ready yet",
    body: "You will be able to see it at this address once the data is ready.",
  },
  loadFailed: {
    title: "Could not load the data",
    body: "Please try again in a moment.",
  },
  chip: {
    record: "Very unusual",
    above: "Above usual",
    normal: "Usual range",
    below: "Below usual",
  },
  countries: {
    KOR: "Republic of Korea",
    CAL: "California",
    BC: "British Columbia",
  },
  levelNames: {
    KOR: { lv1: "Province", lv2: "District" },
    CAL: { lv1: "State", lv2: "County" },
    BC: { lv1: "Province", lv2: "Regional district" },
  },
  dashboard: {
    unit: "fire grid-days",
    natTitle: (month: string) => `How did ${month} compare with usual?`,
    natSub: (country: string, lv2: string, dataEnd: string) => `${country} · ${lv2} · data through ${dataEnd}`,
    stage: (level: string) => `${level} / Region view`,
    regionTitle: (name: string, month: string) => `${name} · ${month}`,
    controls: {
      all: (level: string) => {
        const lower = level.toLowerCase();
        return `All ${lower.endsWith("y") ? `${lower.slice(0, -1)}ies` : `${lower}s`}`;
      },
      pickProvinceFirst: (lv1: string) => `Choose a ${lv1.toLowerCase()} first`,
      search: "Search by name",
      searchPlaceholder: "Search a country, province, city or county",
      month: "Reference month",
    },
    stepper: {
      label: "Month",
      latest: "Latest",
      previous: "Previous month",
      next: "Next month",
    },
    breadcrumb: "Current location",
    dialogs: {
      pickTitle: (level: string) => `Choose ${level.toLowerCase()}`,
      pickDescription: (level: string) => `Choose the ${level.toLowerCase()} to show on the dashboard.`,
      wholeCountry: (country: string) => `All of ${country}`,
      searchTitle: "Search a region",
      searchDescription: "Find a country, province, city or county by name.",
      countriesHeading: "Countries",
      noResults: "No matching regions.",
      truncated: "Many results. Type more to narrow them down.",
      monthTitle: "Choose reference month",
      monthDescription: (first: string, last: string) => `You can choose from ${first} to ${last}.`,
      previousYear: "Previous year",
      nextYear: "Next year",
      year: (year: number) => String(year),
    },
    card: {
      heading: (name: string, month: string) => `${name} · ${month}`,
      title: (month: string) => `Fire grid-days in ${month}`,
      noValue: "No value",
      preDistrict: "This unit has no values before February 2012.",
      noRecord: "No detection record",
      partial: "Still counting",
      partialSentence: "This month is still being counted. The comparison appears once counting is done.",
      zero: "No detections this month",
      sparse: "Fire is usually rare here",
      zeroBaseline: "A month that usually has almost none.",
      refLine: (name: string) => `Based on ${name}`,
      rank: (n: number, rank: number) => `rank ${rank} of ${n} years`,
      rankWithPeriod: (start: number, end: number, n: number, rank: number) => `rank ${rank} of ${n} years (${start}–${end})`,
      ratio: (monthName: string, median: string, ratio: string) =>
        `${ratio} times the usual ${monthName} median of ${median}.`,
      rankSentence: (rankText: string) => `Among the same month, ${rankText}.`,
      band: (low: string, high: string) => `Range ${low}–${high}`,
      quality: { high: "High quality", medium: "Medium quality", low: "Low quality" },
      sufficient: "Enough data",
      nrt: "Near real time",
      converted: "Sensor-adjusted",
      ytd: (months: string, sum: string) => `${months} total ${sum} fire grid-days`,
      detectionDays: "Days with detections",
    },
    cumulative: {
      title: (year: number, monthOfYear: number, monthName: string) =>
        monthOfYear === 1 ? `Total for January ${year}` : `Total from January to ${monthName} ${year}`,
      usual: (months: string, usual: string) => `Usual ${months} about ${usual}`,
      convertedRange: "Adjusted range",
      unitNote: "A fire detected in one approximately 1 km cell on one day counts as 1. It is not a fire incident count or burned area.",
    },
    monthsSpan: (to: number) => {
      const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return to === 1 ? "Jan" : `Jan–${names[to - 1] ?? to}`;
    },
    regionMissing: {
      title: "Region not found",
      body: "The region in this address is not in this country's list. Please choose a region again.",
    },
    latestMonth: "Go to the latest month",
  },
};
