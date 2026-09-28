import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'sv' | 'en' | 'uk'

const KEY = 'app.language'

export function readLang(): Lang {
  try {
    const value = localStorage.getItem(KEY)
    if (value === 'en' || value === 'uk' || value === 'sv') return value
  } catch {
    /* storage unavailable */
  }
  return 'sv'
}

type LangValue = { lang: Lang; setLang: (lang: Lang) => void }

const Ctx = createContext<LangValue>({ lang: 'sv', setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (typeof window === 'undefined' ? 'sv' : readLang()))
  useEffect(() => {
    document.documentElement.lang = lang === 'uk' ? 'uk' : lang
  }, [lang])
  function setLang(next: Lang) {
    setLangState(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* storage unavailable */
    }
  }
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

export function useLang(): LangValue {
  return useContext(Ctx)
}
