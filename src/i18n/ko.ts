/** 한글 문구. 이 객체의 모양이 모든 언어의 기준이다. 문구는 디자인 한글판에서 그대로 옮긴다. */
export const ko = {
  brand: "Burnline",
  nav: {
    about: "소개",
    dashboard: "대시보드",
  },
  pages: {
    about: "소개",
    dashboard: "대시보드",
    insight: "월간 인사이트",
  },
  notFound: {
    title: "페이지를 찾을 수 없습니다",
    home: "처음으로",
  },
};

export type Messages = typeof ko;
