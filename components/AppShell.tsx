'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { IconName } from './Icon';
import { useLang } from './LanguageProvider';
import { useLogout } from './useLogout';

type Role = 'teacher' | 'student';
type Item = { href: string; key: string; icon: IconName; also?: string[] };

const NAV: Record<Role, Item[]> = {
  teacher: [
    { href: '/teacher/dashboard', key: 'nav.home', icon: 'home', also: ['/teacher/students', '/teacher/history', '/teacher/reports'] },
    { href: '/teacher/schedule', key: 'nav.schedule', icon: 'calendar' },
    { href: '/teacher/attendance', key: 'nav.attendance', icon: 'check-circle' },
    { href: '/teacher/chat', key: 'nav.chat', icon: 'message' },
    { href: '/teacher/settings', key: 'nav.settings', icon: 'settings' },
  ],
  student: [
    { href: '/student/dashboard', key: 'nav.home', icon: 'home' },
    { href: '/student/schedule', key: 'nav.schedule', icon: 'calendar' },
    { href: '/student/history', key: 'nav.history', icon: 'history' },
    { href: '/student/chat', key: 'nav.chat', icon: 'message' },
    { href: '/student/settings', key: 'nav.settings', icon: 'settings' },
  ],
};

const under = (p: string, base: string) => p === base || p.startsWith(base + '/');

export default function AppShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const { t } = useLang();
  const logout = useLogout();
  const items = NAV[role];
  const home = items[0].href;
  const isRoot = items.some((i) => i.href === pathname);
  const fullBleed = pathname.endsWith('/chat');

  let parent = pathname.split('/').slice(0, -1).join('/');
  if (parent === '/teacher' || parent === '/student' || parent === '') parent = home;

  return (
    <div className="min-h-[100dvh]">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          {isRoot ? (
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2">
                <Icon name="check-circle" className="h-[18px] w-[18px] text-[#04101f]" />
              </span>
              <span className="text-[17px] font-bold tracking-tight">SmartAttend</span>
            </div>
          ) : (
            <Link href={parent} className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-1.5 text-[15px] font-semibold text-brand">
              <Icon name="chevron-left" />
              {t('common.back')}
            </Link>
          )}
          <button
            onClick={logout}
            aria-label={t('common.logout')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-ink"
          >
            <Icon name="logout" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <main className={fullBleed ? 'mx-auto w-full max-w-2xl' : 'mx-auto w-full max-w-2xl px-4 pb-28 pt-5'}>{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        <div className="mx-auto grid h-16 max-w-2xl grid-cols-5">
          {items.map((i) => {
            const active = under(pathname, i.href) || (i.also || []).some((a) => under(pathname, a));
            return (
              <Link
                key={i.href}
                href={i.href}
                className={'relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition ' + (active ? 'text-brand' : 'text-muted hover:text-ink')}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand" />}
                <Icon name={i.icon} className="h-[22px] w-[22px]" />
                <span className="max-w-full truncate px-1">{t(i.key)}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
