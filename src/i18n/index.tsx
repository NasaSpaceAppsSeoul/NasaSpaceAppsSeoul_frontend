import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "../lib/locale";
import { en } from "./en";
import { ko, type Messages } from "./ko";

const MESSAGES: Record<Locale, Messages> = { ko, en };

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** 언어는 주소가 원본이다. 주소에서 읽은 값을 `app`이 여기에 넣어 준다. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** 지금 언어의 문구 묶음. */
export function useMessages(): Messages {
  return MESSAGES[useLocale()];
}

export type { Messages };
