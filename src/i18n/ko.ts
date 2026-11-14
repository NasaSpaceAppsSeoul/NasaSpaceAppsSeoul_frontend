/** 한글 문구. 이 객체의 모양이 모든 언어의 기준이다. 문구는 디자인 한글판에서 그대로 옮긴다. */
export const ko = {
  brand: "Burnline",
  nav: {
    label: "주 메뉴",
    about: "소개",
    dashboard: "대시보드",
  },
  language: {
    label: "언어",
    ko: "KR",
    en: "EN",
    koName: "한국어",
    enName: "English",
  },
  pages: {
    about: "소개",
    dashboard: "대시보드",
    insight: "월간 인사이트",
  },
  notFound: {
    title: "페이지를 찾을 수 없습니다",
    body: "주소가 맞는지 확인해 주세요. 나라는 KOR·CAL·BC 중 하나이고, 달은 2025-03처럼 씁니다.",
    home: "처음으로",
  },
  routeError: {
    title: "화면을 그리는 중에 문제가 생겼습니다",
    body: "페이지를 다시 불러와 주세요. 문제가 계속되면 처음 화면에서 다시 시작해 주세요.",
    reload: "다시 불러오기",
  },
  // 디자인 푸터. 출처와 데이터 처리일은 `/meta` 값으로 채운다
  footer: {
    title: "Burnline · NASA Space Apps Challenge 2026",
    sources: "출처",
    unit: "화재 감지일은 약 1 km 격자에서 하루 동안 불이 한 번 이상 감지되면 1로 셉니다. 화재 건수나 피해 면적이 아닙니다.",
    processed: "데이터 처리일",
  },
  mockBanner: "목 데이터로 표시 중",
  common: {
    retry: "다시 시도",
    close: "닫기",
    loading: "불러오는 중",
    comingSoon: "준비 중",
  },
  // 구역 에러 (`decisions.md` 1-3)
  errors: {
    offline: "서버에 연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.",
    notReady: "이 나라의 자료는 아직 준비 중입니다.",
    region: "지역을 찾을 수 없습니다. 지역을 다시 골라 주세요.",
    range: "이 달은 자료 범위 밖입니다.",
    other: "자료를 불러오지 못했습니다.",
    openRegionPicker: "지역 선택 열기",
  },
  // `/meta`가 실패했을 때 화면 구역 대신 보이는 한 장 (`decisions.md` 1-4, 2-6)
  serverDown: {
    title: "서버에 연결할 수 없습니다",
    body: "화재 기록 서버가 응답하지 않습니다. 잠시 뒤 다시 시도해 주세요.",
  },
  countryNotReady: {
    title: "이 나라는 아직 준비 중입니다",
    body: "자료가 준비되면 이 주소에서 볼 수 있습니다.",
  },
  loadFailed: {
    title: "자료를 불러오지 못했습니다",
    body: "잠시 뒤 다시 시도해 주세요.",
  },
  chip: {
    record: "매우 이례적",
    above: "평소보다 많음",
    normal: "평소 범위",
    below: "평소보다 적음",
  },
};

export type Messages = typeof ko;
