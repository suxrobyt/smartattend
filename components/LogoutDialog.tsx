'use client';

import { useEffect, useState } from 'react';
import { useLang } from './LanguageProvider';
import { LOGOUT_ASK_EVENT, useSignOut } from './useLogout';

export default function LogoutDialog() {
  const { t } = useLang();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const on = () => setOpen(true);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener(LOGOUT_ASK_EVENT, on);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener(LOGOUT_ASK_EVENT, on);
      window.removeEventListener('keydown', key);
    };
  }, []);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-5 backdrop-blur-sm"
      onClick={() => !busy && setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      <div className="card w-full max-w-sm p-5 !bg-surface-2" onClick={(e) => e.stopPropagation()}>
        <h2 id="logout-title" className="text-xl font-bold">{t('logout.title')}</h2>
        <p className="mt-2 text-[15px] text-muted">{t('logout.confirm')}</p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" className="btn-soft" disabled={busy} onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="btn bg-bad text-[#1d0505]"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await signOut();
            }}
          >
            {t('logout.title')}
          </button>
        </div>
      </div>
    </div>
  );
}
