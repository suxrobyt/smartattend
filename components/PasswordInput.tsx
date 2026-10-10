'use client';

import { useState } from 'react';
import Icon from './Icon';
import { useLang } from './LanguageProvider';

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  id?: string;
}) {
  const [show, setShow] = useState(false);
  const { t } = useLang();
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="field pr-12"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? t('pw.hide') : t('pw.show')}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted hover:text-ink"
      >
        <Icon name={show ? 'eye-off' : 'eye'} />
      </button>
    </div>
  );
}
