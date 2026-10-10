'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_ORDER, STATUS_DOT, todayLocal, firstName } from '@/lib/utils';
import { lessonsFor, weekType, subjectLabel, dayName } from '@/lib/schedule';
import { useLang } from '@/components/LanguageProvider';
import Icon, { IconName } from '@/components/Icon';
import { IconTile, Spinner } from '@/components/ui';

type Sess = { id: string; subject: string; status: string; created_at: string };

export default function TeacherDashboard() {
  const { t, lang } = useLang();
  const [now, setNow] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [total, setTotal] = useState(0);
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [counts, setCounts] = useState<Record<Status, number>>({ present: 0, late: 0, absent: 0, excused: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNow(new Date());
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        const { data: me } = await supabase.from('teachers').select('full_name').eq('user_id', u.user.id).maybeSingle();
        if (me) setName(me.full_name);
      }
      const { count } = await supabase.from('students').select('id', { count: 'exact', head: true });
      setTotal(count || 0);
      const { data: s } = await supabase
        .from('attendance_sessions')
        .select('id, subject, status, created_at')
        .eq('session_date', todayLocal())
        .order('created_at', { ascending: false });
      setSessions((s as Sess[]) || []);
      if (s && s[0]) {
        const { data: r } = await supabase.from('attendance_records').select('status').eq('session_id', s[0].id);
        const c: Record<Status, number> = { present: 0, late: 0, absent: 0, excused: 0 };
        (r || []).forEach((x: any) => (c[x.status as Status] += 1));
        setCounts(c);
      }
      setLoading(false);
    })();
  }, []);

  if (loading || !now) return <Spinner label={t('common.loading')} />;

  const last = sessions[0];
  const attended = counts.present + counts.late;
  const rate = total ? Math.round((attended / total) * 100) : 0;
  const lessons = lessonsFor(now.getDay(), weekType(now));
  const stateOf = (subject: string) => {
    const s = sessions.find((x) => x.subject === subject);
    return s ? (s.status === 'active' ? 'active' : 'done') : null;
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
          {t('dash.hello')} · {dayName(now.getDay(), lang)}
        </p>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">{name || '…'}</h1>
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
            <p className="mt-2 text-[15px] font-medium">{t('dash.noneYet')}</p>
            <p className="mt-1 text-sm text-muted">
              {t('dash.total')}: {total}
            </p>
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t('dash.todayLessons')}</h2>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted">{t('dash.noLessons')}</p>
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {lessons.map((l) => {
              const st = stateOf(l.subject);
              return (
                <Link key={l.pair} href="/teacher/attendance" className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 font-bold text-brand">{l.pair}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{subjectLabel(l.subject, lang)}</span>
                    <span className="block truncate text-xs text-muted">{l.teacher || t('sch.vacant')}</span>
                  </span>
                  {st === 'done' && <span className="chip !border-ok/30 !bg-ok/10 !text-ok">{t('dash.done')}</span>}
                  {st === 'active' && <span className="chip !border-warn/30 !bg-warn/10 !text-warn">{t('dash.inProgress')}</span>}
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
