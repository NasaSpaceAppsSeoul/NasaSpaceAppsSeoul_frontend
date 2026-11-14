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
  // 나라 이름(나라 목록은 서버가 주지 않아 백엔드 Country.java의 이름을 그대로 둔다)
  countries: {
    KOR: "대한민국",
    CAL: "캘리포니아",
    BC: "브리티시컬럼비아",
  },
  // 영어 화면의 단위 이름. 한글 화면은 서버의 `meta.labels.lv1`·`lv2`를 쓴다
  levelNames: {
    KOR: { lv1: "시·도", lv2: "시·군·구" },
    CAL: { lv1: "주", lv2: "카운티" },
    BC: { lv1: "주", lv2: "지역구" },
  },
  dashboard: {
    unit: "화재 감지일",
    natTitle: (month: string) => `${month}은 평소와 비교해 어땠을까요?`,
    natSub: (country: string, lv2: string, dataEnd: string) => `${country} · ${lv2} · ${dataEnd}까지 자료`,
    stage: (level: string) => `${level} / 지역 보기`,
    regionTitle: (name: string, month: string) => `${name} · ${month}`,
    controls: {
      all: (level: string) => `전체 ${level}`,
      pickProvinceFirst: (lv1: string) => `${lv1}를 먼저 선택하세요`,
      search: "이름으로 검색",
      searchPlaceholder: "국가·시·도·시·군·구 검색",
      month: "기준 월",
    },
    stepper: {
      label: "기준 월",
      latest: "최신",
      previous: "이전 달",
      next: "다음 달",
    },
    breadcrumb: "현재 위치",
    dialogs: {
      pickTitle: (level: string) => `${level} 선택`,
      pickDescription: (level: string) => `대시보드에서 볼 ${level}를 고르세요.`,
      wholeCountry: (country: string) => `${country} 전체`,
      searchTitle: "지역 검색",
      searchDescription: "나라, 시·도, 시·군·구 이름으로 찾습니다.",
      countriesHeading: "나라",
      noResults: "맞는 지역이 없습니다.",
      truncated: "결과가 많습니다. 검색어를 더 입력하세요.",
      monthTitle: "기준 월 선택",
      monthDescription: (first: string, last: string) => `${first}부터 ${last}까지 고를 수 있습니다.`,
      previousYear: "이전 해",
      nextYear: "다음 해",
      year: (year: number) => `${year}년`,
    },
    card: {
      heading: (name: string, month: string) => `${name} · ${month}`,
      title: (month: string) => `${month} 한 달의 화재 감지일`,
      noValue: "값 없음",
      preDistrict: "2012년 2월 이전은 이 단위의 값이 없습니다.",
      noRecord: "감지 기록이 없는 지역",
      partial: "집계 중",
      partialSentence: "이 달은 아직 집계 중입니다. 평가는 집계가 끝난 뒤에 보여 줍니다.",
      zero: "이번 달 감지 없음",
      sparse: "평소 불이 드문 지역",
      zeroBaseline: "평년에는 거의 없던 달입니다.",
      refLine: (name: string) => `${name} 기준`,
      rank: (n: number, rank: number) => `${n}개 해 중 ${rank}위`,
      rankWithPeriod: (start: number, end: number, n: number, rank: number) => `${start}–${end}년 ${n}개 해 중 ${rank}위`,
      ratio: (monthName: string, median: string, ratio: string) =>
        `평소 ${monthName} 중앙값 ${median}의 ${ratio}배입니다.`,
      rankSentence: (rankText: string) => `같은 달 ${rankText}입니다.`,
      band: (low: string, high: string) => `범위 ${low}–${high}`,
      quality: { high: "품질 높음", medium: "품질 보통", low: "품질 낮음" },
      sufficient: "자료 충분",
      nrt: "준실시간",
      converted: "센서 환산값",
      ytd: (months: string, sum: string) => `${months} 누적 ${sum} 화재 감지일`,
      detectionDays: "불이 감지된 날짜 수",
    },
    cumulative: {
      title: (year: number, monthOfYear: number, monthName: string) =>
        monthOfYear === 1 ? `${year}년 1월 누적` : `${year}년 1월부터 ${monthName}까지 누적`,
      usual: (months: string, usual: string) => `평소 ${months} 약 ${usual}`,
      convertedRange: "환산 범위",
      unitNote: "약 1 km 칸에서 같은 날 감지된 불은 1로 셉니다. 화재 건수나 피해 면적이 아닙니다.",
    },
    monthsSpan: (to: number) => (to === 1 ? "1월" : `1–${to}월`),
    regionMissing: {
      title: "지역을 찾을 수 없습니다",
      body: "주소의 지역이 이 나라 목록에 없습니다. 지역을 다시 골라 주세요.",
    },
    latestMonth: "최신 달로 이동",
  },
  // 히트맵(3장). 센서 환산값·품질·범위·집계 중·단위는 `dashboard.card`의 문구를 다시 쓴다
  heatmap: {
    title: (name: string) => `${name} · 연도별·월별 화재 달력`,
    sub: (unit: string, fromYear: number, toLabel: string) => `월별 ${unit} · ${fromYear}–${toLabel}`,
    raw: "보정 전",
    harmonized: "보정 후",
    yearButton: (from: number, to: number) => `${from}–${to}`,
    csv: "월별 데이터 CSV ↓",
    png: "달력 PNG ↓",
    csvMock: "목 모드에서는 내려받을 수 없습니다",
    monthHead: (m: number) => `${m}월`,
    yearHead: "연도",
    empty: "이 지역의 월별 자료가 없습니다.",
    gridLabel: "연도별·월별 화재 달력. 방향키로 칸을 옮기고 Enter로 그 달을 엽니다.",
    divider: {
      snpp: "2012년 2월 · S-NPP 관측 시작 (이전은 MODIS 기록을 NOAA-20 기준으로 환산)",
      noaa20: "2018년 4월 · NOAA-20 관측 시작 · 이후는 환산 없음",
    },
    legend: {
      below: (to: string) => `${to} 미만`,
      between: (from: string, to: string) => `${from}–${to}`,
      above: (from: string) => `${from} 이상`,
      note: (unit: string) => `${unit} · 칸에 마우스를 올리면 정확한 값을 볼 수 있습니다`,
    },
    // 칸 상태 설명 6칸 (04-calendar-legend). 환산 문구는 NOAA-20 기준(4-3a)
    states: {
      zero: { title: "감지 없음", body: "관측했지만 불이 감지되지 않음" },
      converted: { title: "센서 환산값", body: "이전 위성 기록을 NOAA-20 기준으로 맞춘 값" },
      noData: { title: "관측 자료 없음", body: "자료가 없어 값을 판단할 수 없음" },
      partial: { title: "집계 중", body: "일부 날짜만 반영 · 갈색 점선" },
      selected: { title: "선택한 달", body: "파란 테두리 · 데이터 상태와 별개" },
      future: { title: "아직 집계 전", body: "자료 마지막 달 이후 · 회색 점선" },
    },
    tooltip: {
      estimated: "추정값",
      noData: "관측 자료가 없어 값이 없습니다.",
      future: "아직 집계 전입니다.",
      blank: "이 단위의 자료가 시작되기 전입니다.",
    },
    yearDialog: {
      title: "표시 연도",
      description: "달력에 보여 줄 해를 고르세요.",
      all: (from: number, to: number) => `${from}–${to} 전체`,
      viirs: (to: number) => `2012–${to} VIIRS 시기`,
      viirsSub: "S-NPP 관측이 시작된 2012년부터",
    },
  },
};

export type Messages = typeof ko;
