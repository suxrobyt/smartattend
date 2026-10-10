'use client';

import { LANGS, LANG_NATIVE } from '@/lib/i18n';
import { useLang } from './LanguageProvider';
import Icon from './Icon';

export default function LanguagePicker() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="space-y-2.5">
      {LANGS.map((l) => {
        const active = l === lang;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={
              'card flex w-full items-center justify-between px-4 py-4 text-left transition ' +
              (active ? 'border-brand bg-brand/10' : 'hover:bg-surface-2')
            }
          >
            <span>
              <span className="block text-[15px] font-semibold">{t('lang.' + l)}</span>
              <span className="block text-xs text-muted">{LANG_NATIVE[l]}</span>
            </span>
            {active && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[#04101f]">
                <Icon name="check" className="h-4 w-4" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
