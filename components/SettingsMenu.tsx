'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from './LanguageProvider';
import { useLogout } from './useLogout';
import Icon, { IconName } from './Icon';
import Avatar from './Avatar';
import { IconTile, PageTitle } from './ui';

export default function SettingsMenu({ role }: { role: 'teacher' | 'student' }) {
  const { t, lang } = useLang();
  const logout = useLogout();
  const [me, setMe] = useState<{ full_name: string; username: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from(role === 'teacher' ? 'teachers' : 'students')
        .select('full_name, username')
        .eq('user_id', u.user.id)
        .maybeSingle();
      if (data) setMe(data as any);
    })();
  }, [role]);

  const base = `/${role}/settings`;
  const rows: { href: string; icon: IconName; title: string; desc: string }[] = [
    role === 'teacher'
      ? { href: base + '/passwords', icon: 'key', title: t('set.passwords'), desc: t('set.passwordsDesc') }
      : { href: base + '/password', icon: 'key', title: t('set.password'), desc: t('set.passwordDesc') },
    { href: base + '/language', icon: 'globe', title: t('set.language'), desc: t('set.languageDesc') },
  ];

  return (
    <div>
      <PageTitle title={t('set.title')} />
      <div className="card mb-5 flex items-center gap-3.5 p-4">
        <Avatar name={me?.full_name || '?'} size={52} tone={role === 'teacher' ? 'teacher' : 'brand'} />
        <div className="min-w-0">
          <p className="truncate text-base font-bold">{me?.full_name || '…'}</p>
          <p className="truncate text-xs text-muted">
            {t('role.' + role)} · {me?.username}
          </p>
        </div>
      </div>
      <div className="card divide-y divide-line overflow-hidden">
        {rows.map((r) => (
          <Link key={r.href} href={r.href} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-surface-2">
            <IconTile name={r.icon} />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{r.title}</span>
              <span className="block truncate text-xs text-muted">{r.desc}</span>
            </span>
            <Icon name="chevron-right" className="h-[18px] w-[18px] text-muted" />
          </Link>
        ))}
        <div className="flex items-center gap-3.5 px-4 py-3.5">
          <IconTile name="globe" tone="info" />
          <span className="flex-1 text-[15px] font-semibold">{t('lang.' + lang)}</span>
        </div>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left hover:bg-bad/5">
          <IconTile name="logout" tone="bad" />
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-bad">{t('set.logout')}</span>
            <span className="block truncate text-xs text-muted">{t('set.logoutDesc')}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
