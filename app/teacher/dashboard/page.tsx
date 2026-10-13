'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_ORDER, STATUS_DOT, todayLocal } from '@/lib/utils';
import { lessonsFor, weekType, subjectLabel, dayName, pairState, pairTime } from '@/lib/schedule';
import { useQuery } from '@/lib/swr';
import { useMe } from '@/components/MeProvider';
import { useLang } from '@/components/LanguageProvider';
import { IconTile } from '@/components/ui';
import { IconName } from '@/components/Icon';

type Sess = { id: string; subject: string; status: string; created_at: string };
type Today = { sessions: Sess[]; counts: Record<Status, number> };

export default function TeacherDashboard() {
  const { t, lang } = useLang();
  const { me, students } = useMe();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const q = useQuery<Today>('t:today', async () => {
    const { data: s } = await supabase
      .from('attendance_sessions')
      .select('id, subject, status, created_at')
      .eq('session_date', todayLocal())
      .order('created_at', { ascending: false });
    const sessions = (s as Sess[]) || [];
    const counts: Record<Status, number> = { present: 0, late: 0, absent: 0, excused: 0 };
    if (sessions[0]) {
      const { data: r } = await supabase.from('attendance_records').select('status').eq('session_id', sessions[0].id);
      (r || []).forEach((x: any) => (counts[x.status as Status] += 1));
    }
    return { sessions, counts };
  });

  const name = (me?.row as any)?.full_name || '';
  const total = students?.length ?? 0;
  const sessions = q.data?.sessions || [];
  const counts = q.data?.counts || { present: 0, late: 0, absent: 0, excused: 0 };
  const last = sessions[0];
  const attended = counts.present + counts.late;
  const rate = total ? Math.round((attended / total) * 100) : 0;
  const lessons = now ? lessonsFor(now.getDay(), weekType(now)) : [];
  // Chip is decided by the clock first, then by what was saved
  const chipFor = (pair: number, subject: string) => {
    const sess = sessions.find((x) => x.subject === subject);
    if (sess?.status === 'closed') return { cls: '!border-ok/30 !bg-ok/10 !text-ok', text: t('dash.done') };
    const ps = now ? pairState(pair, now) : 'upcoming';
    if (ps === 'now') return { cls: '!border-info/30 !bg-info/10 !text-info', text: t('dash.inProgress') };
    if (ps === 'over') return sess ? { cls: '!border-warn/30 !bg-warn/10 !text-warn', text: t('dash.unfinished') } : { cls: '!border-bad/30 !bg-bad/10 !text-bad', text: t('dash.notTaken') };
    return { cls: '', text: t('dash.upcoming') };
  };

  const actions: { href: string; icon: IconName; label: string }[] = [
    { href: '/teacher/attendance', icon: 'check-circle', label: t('dash.start') },
    { href: '/teacher/history', icon: 'history', label: t('dash.history') },
    { href: '/teacher/students', icon: 'users', label: t('dash.students') },
    { href: '/teacher/reports', icon: 'chart', label: t('dash.reports') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">
          {t('dash.hello')}
          {now ? ' · ' + dayName(now.getDay(), lang) : ''}
        </p>
        <h1 className="min-h-[2rem] text-[26px] font-bold leading-tight tracking-tight">{name}</h1>
      </div>

      <section className="card relative overflow-hidden p-5">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand/15 blur-2xl" />
        <p className="eyebrow">{t('dash.attendanceToday')}</p>
        {last ? (
          <>
            <p className="mt-1 text-sm text-muted">{t('dash.lastLesson', { s: subjectLabel(last.subject, lang) })}</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">{rate}%</span>
              <span className="pb-1.5 text-sm text-muted">
                {attended}/{total}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {STATUS_ORDER.map((s) => (
                <div key={s} className="rounded-xl border border-line bg-surface-2/60 px-2 py-2.5 text-center">
                  <p className="text-xl font-bold">{counts[s]}</p>
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted">
                    <span className={'h-1.5 w-1.5 rounded-full ' + STATUS_DOT[s]} />
                    {t('status.' + s)}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-[15px] font-medium">{q.loading ? t('common.loading') : t('dash.noneYet')}</p>
            <p className="mt-1 text-sm text-muted">
              {t('dash.total')}: {total}
            </p>
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t('dash.todayLessons')}</h2>
        {now && lessons.length === 0 ? (
          <p className="text-sm text-muted">{t('dash.noLessons')}</p>
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {lessons.map((l) => {
              const chip = chipFor(l.pair, l.subject);
              return (
                <Link key={l.pair} href="/teacher/attendance" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 font-bold text-brand">{l.pair}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{subjectLabel(l.subject, lang)}</span>
                    <span className="block truncate text-xs text-muted">{pairTime(l.pair)} · {l.teacher || t('sch.vacant')}</span>
                  </span>
                  <span className={'chip shrink-0 ' + chip.cls}>{chip.text}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t('dash.quick')}</h2>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className="card flex flex-col gap-3 p-4 transition hover:bg-surface-2 active:scale-[.98]">
              <IconTile name={a.icon} />
              <span className="text-[15px] font-semibold">{a.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
