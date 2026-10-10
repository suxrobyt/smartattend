'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from './LanguageProvider';
import PasswordInput from './PasswordInput';
import { Alert } from './ui';
import { useLogout } from './useLogout';

// Change my own password (teacher or student)
export default function PasswordChangeForm() {
  const { t } = useLang();
  const logout = useLogout();
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next.length < 8) return setMsg({ kind: 'error', text: t('pw.tooShort') });
    if (next !== again) return setMsg({ kind: 'error', text: t('pw.mismatch') });
    setBusy(true);
    try {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email;
      if (!email) throw new Error(t('common.error'));
      const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: cur });
      if (e1) {
        setMsg({ kind: 'error', text: t('pw.wrongCurrent') });
        return;
      }
      const { error: e2 } = await supabase.auth.updateUser({ password: next });
      if (e2) {
        setMsg({ kind: 'error', text: e2.message });
        return;
      }
      setCur('');
      setNext('');
      setAgain('');
      setMsg({ kind: 'success', text: t('pw.changed') });
    } catch (err: any) {
      setMsg({ kind: 'error', text: err?.message || t('common.error') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-4">
      <div>
        <label className="label">{t('pw.current')}</label>
        <PasswordInput value={cur} onChange={setCur} autoComplete="current-password" />
      </div>
      <div>
        <label className="label">{t('pw.new')}</label>
        <PasswordInput value={next} onChange={setNext} autoComplete="new-password" />
        <p className="mt-1 text-xs text-muted">{t('pw.newHint')}</p>
      </div>
      <div>
        <label className="label">{t('pw.repeat')}</label>
        <PasswordInput value={again} onChange={setAgain} autoComplete="new-password" />
      </div>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <button className="btn-primary w-full" disabled={busy || !cur || !next || !again}>
        {busy ? t('common.saving') : t('pw.change')}
      </button>
      {msg?.kind === 'success' && (
        <button type="button" onClick={logout} className="btn-soft w-full">
          {t('pw.signinAgain')}
        </button>
      )}
    </form>
  );
}
