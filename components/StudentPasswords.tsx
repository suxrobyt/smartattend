'use client';

import { useState } from 'react';
import { useMe } from './MeProvider';
import { randomPassword } from '@/lib/utils';
import { useLang } from './LanguageProvider';
import PasswordInput from './PasswordInput';
import Avatar from './Avatar';
import Icon from './Icon';
import { Alert, Spinner } from './ui';


export default function StudentPasswords() {
  const { t } = useLang();
  const { students: list, reloadStudents } = useMe();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ id: string; kind: 'error' | 'success'; text: string; copy?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function save(s: { id: string; username: string }) {
    if (pw.length < 8) return setMsg({ id: s.id, kind: 'error', text: t('pw.tooShort') });
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch('/api/students/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: s.id, new_password: pw }),
      });
      const j = await r.json();
      if (!r.ok) {
        setMsg({ id: s.id, kind: 'error', text: j.error || t('common.error') });
      } else {
        const line = t('pw.result', { login: s.username, pw });
        setMsg({ id: s.id, kind: 'success', text: (j.created ? t('pw.created') + ' ' : t('pw.changed') + '. ') + line, copy: line });
        setPw('');
        reloadStudents();
      }
    } catch {
      setMsg({ id: s.id, kind: 'error', text: t('common.error') });
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  if (!list) return <Spinner label={t('common.loading')} />;
  const f = q.trim().toLowerCase();
  const shown = list.filter((s) => !f || s.full_name.toLowerCase().includes(f) || s.username.toLowerCase().includes(f));

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t('pw.studentHint')}</p>
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
        <input className="field pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('stu.search')} />
      </div>
      <div className="space-y-2">
        {shown.map((s) => {
          const isOpen = open === s.id;
          return (
            <div key={s.id} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setOpen(isOpen ? null : s.id);
                  setPw('');
                  setMsg(null);
                }}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
              >
                <Avatar name={s.full_name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{s.full_name}</span>
                  <span className="block truncate text-xs text-muted">
                    {s.username} · {s.user_id ? t('pw.hasAccount') : t('stu.noAccount')}
                  </span>
                </span>
                <Icon name="key" className="h-[18px] w-[18px] text-muted" />
              </button>
              {isOpen && (
                <div className="space-y-3 border-t border-line bg-surface-2/50 p-3.5">
                  <label className="label">{t('pw.newOfStudent')}</label>
                  <PasswordInput value={pw} onChange={setPw} autoComplete="new-password" />
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="btn-soft" onClick={() => setPw(randomPassword(10))}>
                      {t('pw.generate')}
                    </button>
                    <button type="button" className="btn-primary" disabled={busy || !pw} onClick={() => save(s)}>
                      {busy ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                  {msg && msg.id === s.id && (
                    <>
                      <Alert kind={msg.kind}>{msg.text}</Alert>
                      {msg.copy && (
                        <button type="button" className="btn-soft w-full" onClick={() => copy(msg.copy!)}>
                          <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4" />
                          {copied ? t('common.copied') : t('common.copy')}
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
