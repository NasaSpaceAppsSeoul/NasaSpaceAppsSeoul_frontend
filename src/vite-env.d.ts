/// <reference types="vite/client" />

/** 이 앱이 읽는 환경 변수. 선언하지 않으면 Vite가 `any`로 준다. */
interface ImportMetaEnv {
  /** `mock`이면 서버 대신 목 묶음에서 답한다. 없으면 개발은 `mock`, 배포는 `live`. */
  readonly VITE_API_MODE?: "mock" | "live";
  /** API 기본 주소(`.../api/v1`). 없으면 개발은 터널 주소, 배포는 같은 출처의 `/api/v1`. */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
