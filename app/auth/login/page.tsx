'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LANGS, LANG_NATIVE } from '@/lib/i18n';
import { useLang } from '@/components/LanguageProvider';
import PasswordInput from '@/components/PasswordInput';
import Icon from '@/components/Icon';
import { Alert } from '@/components/ui';
import { clearCache } from '@/lib/swr';

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: email } = await supabase.rpc('email_for_username', { p_username: username.trim() });
      if (!email) {
        setError(t('login.invalid'));
        return;
      }
      const { data, error: err } = await supabase.auth.signInWithPassword({ email: email as string, password });
      if (err || !data.user) {
        setError(t('login.invalid'));
        return;
      }
      clearCache();
      const role = data.user.user_metadata?.role;
      router.refresh();
      router.push(role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-2 shadow-card">
          <Icon name="check-circle" className="h-9 w-9 text-[#04101f]" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">SmartAttend</h1>
        <p className="mt-1.5 text-sm text-muted">{t('login.subtitle')}</p>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="u">{t('login.username')}</label>
          <input
            id="u"
            className="field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <div>
          <label className="label" htmlFor="p">{t('login.password')}</label>
          <PasswordInput id="p" value={password} onChange={setPassword} placeholder={t('login.passwordPh')} />
        </div>
        {error && <Alert kind="error">{error}</Alert>}
        <button className="btn-primary w-full py-3.5" disabled={loading || !username.trim() || !password}>
          {loading ? t('login.submitting') : t('login.submit')}
        </button>
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-muted">
        {t('login.help')}{' '}
        <a
          href="https://t.me/Isakovshaxzodbek"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand underline-offset-2 hover:underline"
        >
          @Isakovshaxzodbek
        </a>
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {LANGS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={'chip transition ' + (l === lang ? '!border-brand !bg-brand/15 !text-brand' : 'hover:bg-white/10')}
          >
            {LANG_NATIVE[l]}
          </button>
        ))}
      </div>
    </div>
  );
}
