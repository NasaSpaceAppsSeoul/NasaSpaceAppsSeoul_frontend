import { useLocale } from "./index";
import { methodEn } from "./method.en";
import { methodKo, type MethodMessages } from "./method.ko";

/*
 * 기법 페이지 문구. 본문이 커서 공용 문구(`ko.ts`·`en.ts`)와 나눴다. 이 파일은 기법 페이지(lazy 라우트)만 불러
 * 다른 화면의 묶음에 들어가지 않는다(`plans/method-page.md` 8-4).
 */
const METHOD_MESSAGES = { ko: methodKo, en: methodEn } as const;

export function useMethodMessages(): MethodMessages {
  return METHOD_MESSAGES[useLocale()];
}

export type { MethodMessages };
