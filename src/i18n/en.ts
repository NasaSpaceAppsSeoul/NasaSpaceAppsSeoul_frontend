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
};
