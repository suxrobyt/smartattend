'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Lang, translate } from '@/lib/i18n';

type Vars = Record<string, string | number>;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string, vars?: Vars) => string };

const LanguageContext = createContext<Ctx>({
  lang: 'uz',
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ initialLang, children }: { initialLang: Lang; children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      document.cookie = `sa_lang=${l}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  }, []);

  const t = useCallback((key: string, vars?: Vars) => translate(lang, key, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLang = () => useContext(LanguageContext);
