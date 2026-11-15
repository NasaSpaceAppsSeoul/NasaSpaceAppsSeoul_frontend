/** 한글 문구. 이 객체의 모양이 모든 언어의 기준이다. 문구는 디자인 한글판에서 그대로 옮긴다. */

/** 받침에 맞는 목적격 조사(서버 단계 이름 "광역"·"주"·"시·도" 뒤). 한글로 끝나지 않으면 "를" */
function objectParticle(word: string): "을" | "를" {
  const code = word.trim().codePointAt(word.trim().length - 1);
  if (code === undefined || code < 0xac00 || code > 0xd7a3) return "를";
  return (code - 0xac00) % 28 === 0 ? "를" : "을";
}

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
  // 소개 화면 (screens/kr/about.png). 데모·합성 문구는 뺐고(1-10), 사실관계는 백엔드 기준으로 고쳐 썼다(4-3a, 4-9)
  about: {
    hero: {
      eyebrow: "MODIS + VIIRS 화재 기록",
      // 줄바꿈은 문구 안의 "\n"
      title: "더 길게 보는\n화재 기록.",
      lead: "대한민국의 화재 기록을 나라 전체부터 시·군·구까지 살펴보고, 매달을 지난 기록과 비교해 보세요.",
      howItWorks: "작동 방식 보기",
      scrollCue: "스크롤해서 읽기",
      // 검색 줄 오른쪽 밝은 칸(장식, 줄 전체가 검색 버튼). 예전 "지역 둘러보기"는 검색에 합쳤다(about-revise 11절)
      find: "지역 찾기",
      // 예시 줄: 앞말 + 지역 링크(받기 전에는 `examples` 글 그대로)
      examplesLead: "예:",
      examples: "예: 경북 의성 · 강원 고성 · 대구 중구",
      examplesLabel: "예시 지역",
      countriesLabel: "나라별 대시보드",
      countryLink: (country: string) => `${country} →`,
      countryNotReady: (country: string) => `${country} · 준비 중`,
      countryRowSub: "나라 대시보드",
      dataEnd: (date: string) => `${date}까지 자료`,
    },
    // 01 이어진 기록 (Make "01 / CONNECTED RECORDS" 번역, about-revise 8절 3). 값은 2011년 연간(10절 ①)
    connected: {
      index: "01 / 이어진 기록",
      title: "센서는 달라도\n기록은 하나로.",
      lead: "새 센서는 더 작은 불까지 잡아냅니다. 기록을 같은 기준에 맞춰야 센서가 바뀐 효과와 기록된 화재 활동의 변화를 나눠 볼 수 있습니다.",
      diagramLabel: "MODIS와 VIIRS 관측 기록을 공통 비교 기준에 맞춰 하나의 화재 달력으로 잇는 그림",
      modis: "MODIS",
      modisSub: "이전 관측",
      viirs: "VIIRS",
      viirsSub: "새 관측",
      alignKey: "기록 맞추기",
      alignTitle: "공통 기준",
      calendarKey: "이어진 기록",
      calendarTitle: "화재 달력",
      readoutTitle: (country: string, year: number) => `${country} · ${year}년`,
      // 새 시안 "Same month · different observation bases". 우리 값은 같은 해(연간)라 "같은 해"
      readoutSub: "같은 해 · 서로 다른 관측 기준",
      raw: "원시값",
      rawDescription: "위성이 남긴 원래 기록",
      harmonized: "보정값",
      harmonizedDescription: "공통 비교 기준",
      // 두 값은 기준이 다르다(H-landing H-3): 칸(0.01°)·하루는 같고, 보정 전은 MODIS 감지 그대로, 보정 후는 NOAA-20 기준 환산
      rawUnit: "화재 감지일(MODIS 감지 그대로, 연간)",
      harmonizedUnit: "화재 감지일(연간)",
      noValue: "값 없음",
      note: (year: number) => `${year}년은 MODIS로만 관측한 마지막 해입니다. 보정값은 NOAA-20 VIIRS 기준으로 환산한 값입니다.`,
    },
    // 02 지역 맥락 (새 시안 v9 "02 / LOCAL CONTEXT" 번역). 값은 `/series/KOR` 그 해 1월~마지막 달(about-revise 9-5)
    context: {
      index: "02 / 지역 맥락",
      title: "한 달만 보지 말고\n흐름을 보세요.",
      lead: "달마다의 흐름을 살펴보고, 대시보드에서 같은 달을 해마다 비교해 보세요.",
      chartKey: "보정 화재 감지일",
      chartTitle: (country: string, range: string) => `${country} · ${range}`,
      /** "2026년 1–10월", 한 달이면 "2026년 1월". `lastName`은 `formatMonthName`("10월"/"October") */
      range: (year: number, lastName: string, single: boolean) => (single ? `${year}년 ${lastName}` : `${year}년 1–${lastName}`),
      axisUnit: "화재 감지일",
      chartLabel: (title: string) => `${title} 월별 막대 그래프`,
      bar: (month: string, value: string) => `${month}, ${value} 화재 감지일, 보정값 기준`,
      barNoValue: (month: string) => `${month}, 값 없음`,
      inProgress: "집계 중",
      nrt: "준실시간",
      noValue: "값 없음",
      basis: "보정값 기준",
      unit: "화재 감지일",
      selected: "선택한 달",
      total: (range: string) => `${range} 합계`,
      empty: "그 해의 월별 값이 없습니다.",
      // 범례: 점선 달이 있을 때만(C-judgement: partial = 집계 중인 달, nrt = 확정 자료가 끝난 뒤의 준실시간 달)
      legendFinal: "확정",
      legendInProgress: "집계 중·준실시간(바뀔 수 있음)",
      legendHelpLabel: "점선과 실선의 뜻",
      legendHelp:
        "점선 막대는 값이 아직 확정되지 않은 달입니다. 그 달이 아직 끝나지 않았거나(집계 중), 확정 자료가 나오기 전의 빠른 처리 자료(준실시간)라서 나중에 값이 달라질 수 있습니다. 실선 막대는 확정된 값입니다.",
      // 나라 칩과 칩 아래 자료 범위(참고 소스 `burnline-landing 4` `.study-area-tabs`·`coverageText`, UI 다듬기 2026-11-15).
      // 구역 수는 서버 `/regions`(2026-11-15). 그리스·칠레 문구는 참고 소스에 없어 새로 씀(사용자 승인)
      chipsLabel: "지역 고르기",
      coverage: {
        KOR: "대한민국 전체(시·도 17, 시·군·구 229)입니다.",
        CAL: "미국 가운데 캘리포니아만 제공합니다. 다른 주의 자료는 없습니다.",
        BC: "캐나다 가운데 브리티시컬럼비아만 제공합니다. 다른 주의 자료는 없습니다.",
        GRC: "그리스 전체(주 14, 시군 325)입니다.",
        CHL: "칠레 전체(주 16, 시군 345)입니다.",
        NSW: "호주 가운데 뉴사우스웨일스만 제공합니다. 다른 주의 자료는 없습니다.",
      },
    },
    // 03 신뢰와 한계 (새 시안 v9 "03 / TRUST & LIMITS" 번역). 단위 설명은 공용 푸터 문구(`footer.unit`)와 같은 사실
    limits: {
      index: "03 / 신뢰와 한계",
      title: "기록을 읽고\n한계를 알기.",
      body: "위성 기록은 불을 놓칠 수 있습니다. 화재 감지일 하나는 약 1 km 칸에서 하루 동안 불이 감지된 것을 셉니다. 화재 건수나 피해 면적이 아닙니다.",
      guidance: "변화를 해석하기 전에 관측 기준(센서)과 자료 범위를 확인하세요.",
      dashboard: "대시보드 보기",
    },
    // 히어로 3D 지구 (Make 원문 번역). 위성은 개념도라 출처 줄에 "개념도"를 남긴다(about-revise 10절 ③)
    earth: {
      label: "서로 다른 궤도로 3차원 지구를 천천히 도는 개념상의 관측 위성 두 대",
      loading: "지구 표면 불러오는 중",
      unavailable: "지구 표면을 불러오지 못했습니다",
      caption: "지표: NASA Earth Observatory · Blue Marble Next Generation · 개념도",
    },
    correction: {
      eyebrow: "하나로 이어진 기록",
      title: "위성의 변화가 화재 증가로 보이지 않도록.",
      lead: "VIIRS는 2012년부터 더 작은 불을 보기 시작했습니다. 원시 기록과 보정 기록을 같은 눈금으로 비교하세요.",
      rawTitle: "원시값",
      rawSub: (first: number, last: number, max: string) => `${first}–${last} · 위성별 원래 화재 감지일 · 공통 세로축 0–${max}`,
      rawLegend: "회색: MODIS(–2011) · 파랑: S-NPP(2012–)",
      rawNote: "원시 감지값은 2012년 이후 급증해 보입니다.",
      harmonizedTitle: "보정값",
      harmonizedSub: (first: number, last: number, max: string) =>
        `${first}–${last} · NOAA-20 기준 화재 감지일 · 공통 세로축 0–${max}`,
      harmonizedLegend: "회색: 2011년까지 · 주황: 2012년부터 · 모두 NOAA-20 기준으로 맞춘 값(2018년 4월부터는 환산 없음)",
      harmonizedNote: "보정을 통해 센서 변화의 영향을 줄입니다.",
      bar: (year: number, value: string) => `${year}년 · ${value}`,
      chartLabel: (title: string, first: number, last: number) => `${title} 막대 그래프, ${first}–${last}년`,
      sameScale: "두 차트는 동일한 세로축입니다. 회색은 2012년 이전, 색 막대는 2012년 이후입니다.",
      footnote: "보정은 센서 차이의 영향을 줄이는 과정입니다. 실제 화재 증가·감소 여부는 보정된 장기 기록으로 판단합니다.",
      empty: "연간 자료가 없습니다.",
    },
    how: {
      eyebrow: "기록을 연결하는 방법",
      title: "화재 활동을 세고, 기록을 잇고, 한계를 함께 보여줍니다.",
      steps: [
        { title: "화재 감지일 집계", body: "약 1 km 격자에서 같은 날 여러 번 감지돼도 화재 감지일 1로 셉니다." },
        { title: "위성 기록 연결", body: "MODIS → S-NPP → NOAA-20 계열. 전환 시점과 데이터 출처를 표시합니다." },
        { title: "활동량과 품질을 함께 확인", body: "핵심 수치 옆에 평소 대비·품질·환산 여부·기준 기간을 함께 표시합니다." },
      ],
      chain: "MODIS → S-NPP → NOAA-20",
      sampleBadge: "환산값 · 품질 예시",
    },
    detection: {
      eyebrow: "신뢰도와 한계",
      title: "위성이 보는 것과 놓칠 수 있는 것을 함께.",
      lead: "화재 크기별 감지율과 우연 기준선을 같은 눈금으로 비교합니다.",
      // 백엔드 단계 이름(`LandingService.java:153`) → 화면 이름. 표에 없는 이름은 받은 그대로 쓴다
      bins: {
        "0.1 ha 미만": "0.1 ha 미만",
        "0.1~1": "0.1–1 ha",
        "1~10": "1–10 ha",
        "10~100": "10–100 ha",
        "100 ha 이상": "100 ha 이상",
      },
      row: (bin: string, detected: string, chance: string) => `${bin}: 감지율 ${detected}, 우연 기준 ${chance}`,
      axis: "감지율 · 0–100% / 세로선: 우연히 겹칠 비율",
      basis: (n: string) => `2018년 4월 이후, 발생일부터 2일 안 같은 구역의 위성 감지 기준 · 감지율 계산에 쓴 공식 산불 ${n}건`,
      empty: "감지율 자료가 없습니다.",
      noteTitle: "위성이 모든 불을 볼 수는 없습니다.",
      noteBody: "위성 통과 사이, 구름 아래, 작은 불은 놓칠 수 있습니다. 미감지가 무화재를 보장하지 않습니다. 이 기록은 과거 패턴을 보여 줍니다.",
    },
  },
  notFound: {
    title: "페이지를 찾을 수 없습니다",
    body: "주소가 맞는지 확인해 주세요. 나라는 KOR·CAL·BC·GRC·CHL·NSW 중 하나이고, 달은 2025-03처럼 씁니다.",
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
    GRC: "그리스",
    CHL: "칠레",
    NSW: "뉴사우스웨일스",
  },
  // 영어 화면의 단위 이름. 한글 화면은 서버의 `meta.labels.lv1`·`lv2`를 쓴다
  levelNames: {
    KOR: { lv1: "시·도", lv2: "시·군·구" },
    CAL: { lv1: "주", lv2: "카운티" },
    BC: { lv1: "주", lv2: "지역구" },
    GRC: { lv1: "주", lv2: "시군" },
    CHL: { lv1: "주", lv2: "시군" },
    NSW: { lv1: "주", lv2: "지방정부" },
  },
  dashboard: {
    unit: "화재 감지일",
    // 시·도 목록 3곳(5장, `decisions.md` 6-1·6-3). 디자인 "3월 화재 감지일 순위"는 백엔드 정렬(그 지역 같은 달 순위 → 값)과 뜻이 달라 고쳐 씀
    top: {
      title: "평소보다 두드러진 곳",
      sub: (lv2: string) => `각 ${lv2}의 지난 같은 달 기록과 비교해 두드러진 순서입니다.`,
      empty: "이번 달 감지된 곳이 없습니다.",
      preDistrict: "2012년 2월 이전은 시·군·구 값이 없습니다.",
    },
    // 나라 화면 평소 화재 집중 시기(5장, `/regions/{id}` risk_months). 디자인 "절반 이상이 집중되는 달"은 실제 비중(risk_share)으로 쓴다
    season: {
      title: "평소 화재 집중 시기",
      sub: (share: string | null, period: string | null) =>
        [share === null ? "평소 연간 활동이 집중되는 달" : `평소 연간 활동의 ${share}가 모이는 달`, period].filter((s) => s !== null).join(" · "),
      run: (from: number, to: number) => (from === to ? `${from}월` : `${from}–${to}월`),
      count: (n: number) => (["", "한 달", "두 달", "세 달", "네 달", "다섯 달", "여섯 달"][n] ?? `${n}개월`),
      detail: (count: string, peak: number | null) =>
        peak === null ? `평소 감지가 집중되는 ${count}` : `평소 감지가 집중되는 ${count} · ${peak}월이 정점`,
      note: "과거 기록의 패턴이며 예측이 아닙니다.",
      empty: "집중 시기를 정할 만큼 기록이 없습니다.",
      partial: "정점과 비교 기간을 불러오지 못했습니다.",
    },
    // 나라 화면 월별 선 그래프(5장). 환산 문구는 NOAA-20 기준(4-3a), 띠는 보통 해 범위(가운데 50%가 아니다, 12절 ④)
    monthly: {
      title: (year: number) => `${year}년 월별 활동`,
      sub: (period: string) => `월별 화재 감지일 · NOAA-20 기준(이전 위성 기록은 NOAA-20 기준으로 환산). 띠: ${period} 보통 해 범위.`,
      legendYear: (year: number, converted: boolean) => (converted ? `${year} · 센서 환산값 포함` : `${year}`),
      legendBand: (period: string) => `보통 해 범위 · ${period}`,
      legendMedian: "중앙값(평소)",
      pending: (from: number) => (from === 12 ? "12월: 아직 집계 전" : `${from}–12월: 아직 집계 전`),
      tooltip: {
        median: "평소 중앙값",
        band: "보통 해 범위",
        partial: "집계 중",
        converted: "센서 환산값",
        noValue: "값 없음",
        future: "아직 집계 전",
      },
      empty: "이 해에는 표시할 값이 없습니다.",
      tableCaption: (year: number) => `${year}년 월별 화재 감지일과 평소 값`,
      columns: { month: "달", value: "값", median: "평소 중앙값", band: "보통 해 범위" },
    },
    // 이 화면 공유(overlays/kr/share-link). 디자인의 "프로토타입 미리보기·복사 지원 안 함"은 실제 동작으로 고쳐 씀
    share: {
      title: "이 화면 공유",
      description: "링크에 선택 지역과 기준 월을 유지합니다.",
      urlLabel: "주소",
      copy: "링크 복사",
      copied: "링크를 복사했습니다.",
      failed: "복사하지 못했습니다. 위 주소를 직접 복사하세요.",
      done: "완료",
    },
    // 시·군·구 화면의 인접 지역 목록(5장, 6-2). 값 큰 순, 0도 보인다
    neighbors: {
      title: (monthName: string) => `인접 지역의 ${monthName} 기록`,
      sub: "맞닿은 지역의 같은 달 값입니다. 같은 단위로 비교합니다.",
      empty: "맞닿은 지역이 없습니다.",
      preDistrict: "2012년 2월 이전은 시·군·구 값이 없습니다.",
    },
    natTitle: (month: string) => `${month}은 평소와 비교해 어땠을까요?`,
    natSub: (country: string, lv2: string, dataEnd: string) => `${country} · ${lv2} · ${dataEnd}까지 자료`,
    stage: (level: string) => `${level} / 지역 보기`,
    regionTitle: (name: string, month: string) => `${name} · ${month}`,
    intro: "나라를 고르고, 지역을 좁히고, 그곳의 기록을 지난 기록과 비교해 보세요.",
    // 머리 아래 자료 카드(시안 v11 `.db-data-notice`). 날짜는 `/meta` `data_end`, 그 달이 끝나지 않았으면 수집 중 문장
    dataNotice: {
      label: "FIRMS 기록",
      reference: "NOAA-20 기준",
      text: (date: string | null, collectingMonth: string | null) =>
        (date === null ? "" : `자료 기준일 · ${date}. `) +
        (collectingMonth === null
          ? "최근 준실시간(NRT) 값은 잠정치입니다."
          : `${collectingMonth}은 아직 수집 중이며, 최근 준실시간(NRT) 값은 잠정치입니다.`),
    },
    controls: {
      all: (level: string) => `전체 ${level}`,
      pickProvinceFirst: (lv1: string) => `${lv1}${objectParticle(lv1)} 먼저 선택하세요`,
      // 선택 줄 첫 칸: 지금 위치를 보이고 누르면 검색(2026-11-14 사용자 결정)
      search: "지역",
      searchHint: "지역 검색, 지금:",
      // 경로 줄 오른쪽 공유 버튼(대화상자를 연다). 예전 "자료 가져가기" 카드에서 옮김(2026-11-15)
      share: "이 화면 링크 복사",
      searchPlaceholder: "국가·시·도·시·군·구 검색",
      month: "기준 월",
    },
    stepper: {
      previous: "이전 달",
      next: "다음 달",
    },
    breadcrumb: "현재 위치",
    dialogs: {
      pickTitle: (level: string) => `${level} 선택`,
      pickDescription: (level: string) => `대시보드에서 볼 ${level}${objectParticle(level)} 고르세요.`,
      wholeCountry: (country: string) => `${country} 전체`,
      searchTitle: "지역 검색",
      searchDescription: "나라, 시·도, 시·군·구 이름으로 찾습니다.",
      countriesHeading: "나라",
      noResults: "맞는 지역이 없습니다.",
      truncated: "결과가 많습니다. 검색어를 더 입력하세요.",
      // 입력 전 계층 목록 끝 안내(about-revise 11절)
      searchHint: "시·군·구와 카운티는 이름을 입력해 찾으세요.",
      monthTitle: "기준 월 선택",
      monthDescription: (first: string, last: string) => `${first}부터 ${last}까지 고를 수 있습니다.`,
      previousYear: "이전 해",
      nextYear: "다음 해",
      year: (year: number) => `${year}년`,
    },
    card: {
      heading: (name: string, month: string) => `${name} · ${month}`,
      title: (month: string) => `${month} 한 달의 화재 감지일`,
      // 시·군·구 숫자 카드 안 흰 큰 버튼(screens/kr/dashboard-district, 5장)
      openInsight: "월간 인사이트 열기 →",
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
      // 누적은 시즌 시작 달부터(북반구 1월, 칠레·NSW 7월). 해를 넘기면 앞 해를 함께 쓴다
      title: (from: { year: number; name: string }, to: { year: number; name: string }, single: boolean) =>
        single
          ? `${to.year}년 ${to.name} 누적`
          : from.year === to.year
            ? `${to.year}년 ${from.name}부터 ${to.name}까지 누적`
            : `${from.year}년 ${from.name}부터 ${to.year}년 ${to.name}까지 누적`,
      usual: (months: string, usual: string) => `평소 ${months} 약 ${usual}`,
      convertedRange: "환산 범위",
      unitNote: "약 1 km 칸에서 같은 날 감지된 불은 1로 셉니다. 화재 건수나 피해 면적이 아닙니다.",
    },
    // 해를 넘기는 구간(남반구 7월~2월)은 "7–2월"이 거꾸로 읽혀 "7월–2월"로 쓴다
    monthsSpan: (from: number, to: number) => (from === to ? `${to}월` : from < to ? `${from}–${to}월` : `${from}월–${to}월`),
    regionMissing: {
      title: "지역을 찾을 수 없습니다",
      body: "주소의 지역이 이 나라 목록에 없습니다. 지역을 다시 골라 주세요.",
    },
    latestMonth: "최신 달로 이동",
  },
  // 히트맵(3장). 센서 환산값·품질·범위·집계 중·단위는 `dashboard.card`의 문구를 다시 쓴다
  heatmap: {
    // 시안 v11 달력(`FireCalendar.tsx`) 배치. 한글은 시안에 없어 새로 씀. 머리말 번호(03)는 다른 카드에 번호가 없어 뺐다
    overline: "더 긴 기록",
    title: "연도별·월별 화재 달력",
    sub: (fromYear: number, toYear: number, name: string) => `${fromYear}–${toYear} · ${name} · 한 달에 점 하나. 올리면 값, 누르면 그 달로 이동합니다.`,
    raw: "보정 전",
    harmonized: "보정 후",
    years: { label: "표시 연도", all: "전체 해", viirs: "2012년부터" },
    csv: "월별 CSV",
    png: "달력 PNG",
    csvMock: "목 모드에서는 내려받을 수 없습니다",
    // 서버가 보정 전 값(`raw_before`)을 주지 않는 지역(시·도, 목 모드)
    rawUnavailable: "이 지역은 보정 전 값이 없습니다",
    // 내려받기 확인 대화상자(overlays/kr/export-csv·export-png). "프로토타입 미리보기" 줄은 빼고 버튼은 "내려받기"(4-8)
    exports: {
      description: "내려받을 파일의 내용을 확인하세요.",
      download: "내려받기",
      downloading: "내려받는 중…",
      csv: { title: "월별 화재 활동 CSV", detail: "월별 감지일 · 평년 · 보통 해 범위 · 순위, 값이 있는 달만, 전체 기간" },
      png: { title: "달력 이미지", detail: "PNG · 범례·출처·기준 기간 포함" },
      pngFailed: "이미지를 만들지 못했습니다. 다시 시도해 주세요.",
      // 그림 안 글자
      image: {
        title: (name: string, from: number, to: number) => `${name} · 연도별·월별 화재 달력 ${from}–${to}`,
        sub: "화재 감지일 · NOAA-20 기준 보정값 · 한 달에 점 하나",
        subRaw: "화재 감지일 · 보정 전(위성이 남긴 원래 기록) · 한 달에 점 하나",
        source: (dataEnd: string) => `출처: NASA FIRMS · 자료 기준일 ${dataEnd} · Burnline`,
        period: (from: number, to: number) => `색 구간: 이 지역 0이 아닌 월값의 50·75·90 퍼센타일 · 평소 비교 기간 ${from}–${to}`,
        // 보정 전 그림도 색 구간은 보정 후 값으로 계산한 같은 경계다(`heat_bins`)
        periodRaw: (from: number, to: number) =>
          `색 구간: 이 지역 0이 아닌 보정 후 월값의 50·75·90 퍼센타일(보정 전 그림에도 같은 구간) · 평소 비교 기간 ${from}–${to}`,
      },
    },
    monthCorner: "달",
    monthHead: (m: number) => `${m}월`,
    empty: "이 지역의 월별 자료가 없습니다.",
    gridLabel: "연도별·월별 화재 달력. 방향키로 칸을 옮기고 Enter로 그 달을 엽니다.",
    caption: "해 → · 달 ↓ · 같은 기준으로 비교",
    // 보정 전(시안 v11 "Original sensor records", "sensor sensitivity changes")
    captionRaw: "해 → · 달 ↓ · 위성이 남긴 원래 기록",
    // 격자 아래 오른쪽 센서 전환 요약(세로 점선과 짝). 보이는 전환만 잇는다
    divider: {
      snpp: "2012년 2월 S-NPP",
      noaa20: "2018년 4월 NOAA-20",
    },
    dividerTail: "점무늬는 NOAA-20 기준 환산값",
    dividerTailRaw: "위성이 바뀌면 감지 감도도 달라집니다",
    legend: {
      below: (to: string) => `${to} 미만`,
      between: (from: string, to: string) => `${from}–${to}`,
      above: (from: string) => `${from} 이상`,
      title: (unit: string) => `${unit} · 옅음 → 짙음`,
    },
    // 격자 아래 선택한 달 줄(시안 v11 `.db-calendar-selection`)
    selection: {
      label: "선택한 달",
      detail: (value: string, unit: string, basis: string, collecting: boolean) =>
        `${value} ${unit} · ${basis}${collecting ? " · 집계 중" : ""}`,
    },
    // 카드 맨 아래 각주(시안 v11 `.db-panel-footnote`). 색 경계는 백엔드 `heat_bins`(0이 아닌 월값의 50·75·90 백분위),
    // 집계 중 문장은 `/meta` `data_end`가 달 중간일 때만
    footnote: (collecting: { month: string; day: number; date: string } | null) =>
      "NASA FIRMS · 0, 그리고 0이 아닌 월값의 50·75·90 백분위로 색을 나눕니다. " +
      (collecting === null ? "" : `${collecting.month}은 ${collecting.day}일까지 집계 중입니다. `) +
      "빠진 기록은 0이 아닙니다.",
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
      // 보정 전 칸: 그 달을 관측한 위성(`source`의 "→" 앞, 서버 값 그대로)
      sensor: (name: string) => `${name} 원래 기록`,
      estimated: "추정값",
      noData: "관측 자료가 없어 값이 없습니다.",
      future: "아직 집계 전입니다.",
      blank: "이 단위의 자료가 시작되기 전입니다.",
    },
  },
  // 지도(4장, components/sheet/06-maps-*). 데모 문구는 뺐고, 점 색 기준·범례 구간은 백엔드 뜻으로 고쳐 썼다(5-2, 8절 질문 1)
  map: {
    title: (month: string) => `${month} · 화재 칸과 감지 위치`,
    sub: "지역색은 월간 화재 칸 수, 점은 감지 위치와 첫 감지일을 나타냅니다.",
    modes: { cells: "화재 칸·위치", usual: "평소 대비" },
    // "평소 대비" 보기(9장). 평가는 백엔드 일괄 판정(`/judgement?month=`)의 자기 판정이고, 드문 구역은 빌려 쓴 판정을 올려서만 보인다
    usual: {
      title: (month: string) => `${month} · 평소 대비`,
      sub: "지역색은 같은 달 지난 해들과 비교한 평가입니다. 기록이 적은 구역은 빗금입니다.",
      legendTitle: "색 · 같은 달 평소와 비교",
      none: "평가 없음",
      noneNote: "빗금은 기록이 적어 자체 평가를 하지 않는 구역(빌려 쓴 평가는 올려서 확인)과 값이 없는 구역입니다.",
      basisNote: "평소 범위는 같은 달 지난 해들의 15–85% 구간에 작은 수 보정을 더한 것입니다.",
      partial: "이 달은 아직 집계 중입니다. 평가는 집계가 끝난 뒤 보여 줍니다.",
      pre2012: "2012년 2월 이전은 시·군·구 값이 없어 평가하지 않습니다.",
      failed: "평가를 불러오지 못했습니다.",
      tooltip: {
        ratio: (chip: string, ratio: string) => `${chip} · 평소의 ${ratio}배`,
        borrowed: (name: string, chip: string) => `기록 부족 · ${name} 기준 ${chip}`,
        none: "평가 없음",
      },
      canvasLabel: (title: string, regions: number) => `${title}. 지역 ${regions}곳. 지역 이동은 위의 선택 줄로도 할 수 있습니다.`,
    },
    zoom: { in: "확대", out: "축소", reset: "처음 크기로" },
    hint: "+ / − 확대·축소 · 점에 올려 확인",
    // 지도 왼쪽 아래 출처 줄(시안 v11 `.db-map-attribution`). 경계 출처 이름은 백엔드 `labels.boundary`에서 옮긴 나라별 고정 문구다
    // (그 값은 한글 설명·라이선스가 섞여 영문 화면에 그대로 못 쓴다. 9장에서 실제 값과 대조), 날짜 기준은 `time_basis.code`로 고른다
    attribution: {
      boundary: {
        KOR: "geoBoundaries",
        CAL: "geoBoundaries USA",
        BC: "BC Data Catalogue",
        GRC: "geoBoundaries GRC",
        CHL: "geoBoundaries CHL",
        NSW: "geoBoundaries AUS",
      },
      time: { "UTC+9": "한국 표준시(UTC+9) 날짜 기준", solar: "경도 기준 태양시 날짜" },
      line: (boundary: string, time: string) => `NASA FIRMS · ${boundary} · ${time}`,
    },
    legend: {
      toggle: "범례",
      fillTitle: "색 · 이번 달 화재 칸 수",
      below: (to: string) => `${to} 미만`,
      between: (from: string, to: string) => `${from}–${to}`,
      above: (from: string) => `${from} 이상`,
      noValue: "값 없음",
      rangeNote: "구간은 앞 값 이상, 뒤 값 미만입니다.",
      fillNote: "약 1 km 칸을 한 달에 한 번만 셉니다. 화재 건수·화재 감지일과 다릅니다.",
      dotTitle: "점 · 첫 감지일 이후 경과일",
      ages: ["첫 감지일", "+1일", "+2일", "+3일~"],
      dotNote: "점은 감지된 칸의 대표 위치입니다. 색은 지금 보이는 지역의 첫 감지일 기준입니다.",
      dotZoomNote: "전국 크기에서는 감지 위치가 연기처럼 번져 보이고, 확대하면 점으로 보입니다.",
      selected: "선택 지역 · 파란 테두리",
    },
    notes: {
      sample: (count: string, shown: string) => `감지 ${count}개 중 ${shown}개 표시`,
      pre2012: (sensor: string) => `2012년 2월 이전은 시·군·구 값이 없어 감지 지점(${sensor})만 표시합니다.`,
      outOfRange: "이 달은 감지 지점 자료가 없습니다.",
    },
    tooltip: {
      cells: (value: string) => `화재 칸 ${value}`,
      noValue: "값 없음",
      firstDetected: "이 칸의 첫 감지일",
    },
    gestureHelp: {
      windows: "Ctrl + 스크롤로 지도를 확대·축소합니다",
      mac: "⌘ + 스크롤 또는 트랙패드 핀치로 지도를 확대·축소합니다",
      mobile: "두 손가락으로 지도를 움직입니다",
    },
    canvasLabel: (title: string, regions: number, cells: number) =>
      `${title}. 지역 ${regions}곳, 감지된 칸 ${cells}개. 지역 이동은 위의 선택 줄로도 할 수 있습니다.`,
    // 시·도·시·군·구 지도(5장, screens/kr/dashboard-province·district). 7장 월간 인사이트도 같은 범례를 쓴다
    regional: {
      eyebrow: "지역 지도",
      provinceTitle: (province: string, lv2: string) => `${province}의 ${lv2}`,
      /** 받침에 맞는 조사(`lib/format` `andParticle`). 한글로 끝나지 않는 이름은 조사 없이 */
      districtTitle: (name: string, particle: "와" | "과" | null) =>
        particle === null ? `${name} · 주변 지역` : `${name}${particle} 주변 지역`,
      sub: "지역색: 이번 달 화재 칸 수 · 점: 감지된 칸의 위치와 날짜",
      neighborsFailed: "주변 지역을 불러오지 못해 이 지역만 표시합니다.",
      /** 지역 지도는 나라 전체 `/map`을 거르므로 표본 숫자도 나라 전체 기준이다(5-7) */
      sample: (nation: string, count: string, shown: string) => `${nation} 전체 감지 ${count}개 중 ${shown}개만 받아 일부만 보입니다.`,
    },
  },
  // 월간 인사이트(7장). 디자인의 "데모·합성·예시·가상" 문구는 빼고, 사실관계는 백엔드 기준으로 고쳤다(`plans/insight.md` 4절)
  insight: {
    back: "같은 지역·월로 돌아가기 →",
    toDashboard: "대시보드로",
    eyebrow: "월간 인사이트",
    title: (name: string, month: string) => `${name} · ${month} 화재 인사이트`,
    lead: (monthName: string) => `언제 감지가 집중됐는지, 이전 ${monthName}과 어떻게 다른지 살펴보세요.`,
    unitNote: "화재 감지일은 ‘격자 × 날’의 합계입니다. 예: 3개 격자에서 이틀 감지되면 6입니다.",
    badges: {
      sufficient: "기록이 충분한 지역",
      sparse: "평소 불이 드문 지역",
      none: "감지 기록 없는 지역",
      viirs: "VIIRS · 2012년 이후",
      refChip: (ref: string, chip: string) => `${ref} 기준 ${chip}`,
      judgementFailed: "판정을 불러오지 못했습니다.",
    },
    partialFailure: "일부 정보를 불러오지 못했습니다.",
    refetchFailed: "다시 불러오지 못했습니다. 받아 둔 정보로 보여 줍니다.",
    tiles: {
      total: "이번 달 합계 · 화재 감지일",
      years: (monthName: string) => `${monthName}에 감지가 있던 해`,
      yearsValue: (detected: number, total: number) => `${detected} / ${total}년`,
      days: "감지된 날 / 최대 활동일",
      daysValue: (days: number, date: string | null) => (date === null ? `${days}일` : `${days}일 / ${date}`),
      daysSub: (cells: string) => `최대 하루 ${cells}칸`,
      cluster: "최대 감지 묶음 합계",
      cells: (cells: string) => `${cells}칸`,
      nearby: "인접 지역 포함",
      none: {
        preDistrict: "2012년 2월 전에는 시·군·구 값이 없습니다",
        failed: "불러오지 못했습니다",
        preCluster: "감지 묶음은 2018년 4월부터",
        noCluster: "이 달 감지 묶음 없음",
      },
    },
    calendar: {
      eyebrow: "일별 화재 활동",
      title: (monthName: string) => `${monthName} 중 언제 화재 활동이 집중됐을까요?`,
      lead: "숫자는 그날 감지된 화재 칸 수입니다.",
      leadCluster: (range: string) =>
        `숫자는 그날 감지된 화재 칸 수, 파란 밑줄은 최대 감지 묶음(${range}, 인접 지역 포함) 중 이 지역에서 감지된 날입니다.`,
      modis: "이 시기는 MODIS 감지 점(보정 전)입니다.",
      weekdays: ["일", "월", "화", "수", "목", "금", "토"],
      peak: "최대 활동일",
      future: "집계 전",
      inCluster: "최대 감지 묶음 기간",
      legendNote: "화재 칸 · 파란 밑줄: 최대 감지 묶음 중 이 지역에서 감지된 날",
      legendNoteBasic: "화재 칸",
      summary: {
        fireDays: "불이 감지된 날",
        peak: "활동 격자가 가장 많았던 날",
        clusters: "감지 묶음",
        near50: "주변 50 km 첫 감지",
      },
      days: (n: number) => `${n}일`,
      clusterValue: {
        preCluster: "2018년 4월부터",
        unknown: "정보 없음",
        none: "확인된 묶음 없음",
        events: (n: number, big: number) => `${n}묶음 · 큰 묶음 ${big}`,
      },
    },
    years: {
      eyebrow: "다른 해의 같은 달",
      title: (monthName: string) => `이번 ${monthName}을 다른 해와 비교하면?`,
      lead: (from: number, to: number, monthName: string, max: string) =>
        `${from}–${to} · ${monthName} 합계 · 세로축 0–${max} 화재 감지일`,
      summary: (year: number, monthName: string, value: string, years: number, sum: string) =>
        `${year}년 ${monthName}: ${value}감지일 · 이전 ${years}개년 합계: ${sum}감지일`,
      summaryAll: (from: number, to: number, sum: string) => `${from}–${to} 합계: ${sum}감지일`,
      zeroNote: "0은 관측은 있었지만 감지되지 않았다는 뜻입니다.",
      note: (from: number, to: number, monthName: string) =>
        `이 비교는 ${from}–${to}년의 ${monthName} 기록만 사용합니다. 모든 값은 NOAA-20 기준 화재 감지일입니다.`,
      currentFailed: "올해 값을 불러오지 못했습니다.",
      partialBar: "집계 중",
      chartLabel: (monthName: string) => `해마다 ${monthName}의 화재 감지일 막대 그래프`,
    },
    detected: {
      eyebrow: "불이 감지된 해",
      title: "불이 감지된 해부터 살펴보세요.",
      lead: (total: number, detected: number) => `${total}개년 중 감지가 있었던 ${detected}개년입니다.`,
      year: "연도",
      value: (monthName: string) => `${monthName} 감지일`,
      note: "안내",
      selected: "선택 연도",
      detected: "감지 있음",
      sparseNote: "감지가 드문 지역은 배수나 순위보다 실제 감지된 해와 선택한 달을 먼저 살펴보세요.",
      empty: "감지된 해가 없습니다.",
    },
    official: {
      eyebrow: "공식 기록 대조",
      title: "같은 달의 공식 산불 기록입니다.",
      lead: (source: string) => `${source} 기록 · 면적이 큰 순`,
      date: "날짜",
      place: "위치",
      cause: "원인",
      area: "면적(ha)",
      // 0보다 크고 0.1 ha보다 작은 면적(소수 한 자리로 쓰면 0이 된다)
      areaSmall: "0.1 미만",
      empty: "이 달의 공식 기록이 없습니다. 여러 지역에 걸친 산불은 한 지역에만 기록됩니다.",
      rate: (since: string, n: string, detected: string, days: number, percent: number) =>
        `${since}부터 공식 기록 ${n}건 중 ${detected}건을 위성이 ${days}일 안에 감지했습니다(${percent}%).`,
    },
    season: {
      eyebrow: "계절적 맥락",
      title: "이번 달은 화재 집중 시기의 어디쯤일까요?",
      lead: (name: string, period: string | null) =>
        period === null ? `${name} 월별 합계 · 화재 감지일` : `${name} 월별 합계 · ${period} · 화재 감지일`,
      borrowedBadge: (ref: string) => `${ref}의 계절 패턴 참고`,
      borrowedNote: (self: string, ref: string) => `자료가 적은 ${self} 대신 ${ref}의 계절 패턴을 참고합니다.`,
      risk: (name: string, months: string) => `${name}의 평소 활동은 ${months}에 집중됩니다.`,
      footnote: (name: string) => `막대: ${name}의 월별 합계 · NOAA-20 기준`,
      empty: "월별 합계가 모두 0입니다.",
      current: "이번 달",
      chartLabel: "월별 화재 감지일 합계 막대 그래프",
    },
    map: {
      eyebrow: "화재 칸과 감지 위치",
      title: "이번 달 어디서 불이 감지됐을까요?",
      /** 받침에 맞는 조사(`lib/format` `andParticle`). 한글로 끝나지 않는 이름은 조사 없이 */
      lead: (name: string, particle: "와" | "과" | null, month: string) =>
        particle === null ? `${name} · 주변 지역 · ${month}` : `${name}${particle} 주변 지역 · ${month}`,
      leadAlone: (name: string, month: string) => `${name} · ${month}`,
      /** 제목이 물음표로 끝나 마침표를 붙이지 않는다 */
      canvasLabel: (title: string, regions: number, cells: number) => `${title} 지역 ${regions}곳, 감지된 칸 ${cells}개.`,
      /** `/insight`의 점은 선택 지역 안의 것만 온다(G-insight 카드 7) */
      pointsOnly: (name: string) => `점은 ${name} 안에서 감지된 칸만 표시합니다.`,
      noPoints: (name: string) => `이번 달 ${name} 안에 표시할 감지 지점이 없습니다.`,
      pointsFailed: "감지 지점을 불러오지 못했습니다.",
      valueFailed: "이 지역의 값을 불러오지 못했습니다.",
      partFailed: "일부 지도 정보를 불러오지 못했습니다.",
    },
    neighbors: {
      eyebrow: "주변 지역",
      title: "같은 달의 우리 지역과 이웃을 살펴보세요.",
      lead: "합계는 같은 단위로 비교합니다. 평소 대비 평가는 각 지역의 별도 기준을 사용합니다.",
      region: "지역",
      basis: "기준",
      value: (monthName: string) => `${monthName} 감지일`,
      note: "안내",
      basisValue: { self: "자체 기준", sparse: "평소 불이 드문 지역", none: "감지 기록 없음" },
      selected: "선택 지역",
      empty: "주변 지역 정보가 없습니다.",
      partial: "일부 이웃이 빠졌을 수 있습니다.",
    },
    guide: {
      eyebrow: "해석 안내",
      title: "수치마다 비교 기준을 확인하세요.",
      item: "항목",
      meaning: "의미",
      rows: {
        period: { item: "기간", meaning: "시·군·구는 2012년 이후 VIIRS 기록으로 비교합니다." },
        unit: { item: "단위 · 화재 감지일(격자×날)", meaning: "약 1 km 격자 × 날. 같은 칸에서 같은 날 여러 번 감지돼도 1로 셉니다." },
        baseline: { item: "평소 기준과 비교", meaning: "서로 다른 해의 같은 달을 비교하고 기준 기간을 표시합니다." },
        usualActivity: { item: "평소 화재 활동", meaning: "불이 드문 지역은 상위 지역의 계절 패턴과 해당 지역의 기대치를 함께 봅니다." },
        whySparse: { item: "왜 불이 드문 지역인가요?", meaning: "관측 기록이 적으면 배수·순위보다 이례성과 상위 지역 맥락을 우선합니다." },
        alternative: { item: "대신 참고할 정보", meaning: (name: string) => `${name} 대시보드나 기록이 충분한 주변 지역을 확인하세요.` },
        sources: { item: "출처" },
      },
    },
    buttons: {
      dashboard: (name: string, month: string) => `${name} · ${month} 대시보드 →`,
      context: (name: string) => `${name} 맥락 보기 →`,
    },
  },
};

export type Messages = typeof ko;
