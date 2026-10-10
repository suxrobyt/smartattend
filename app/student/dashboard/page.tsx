'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_ORDER, STATUS_SOFT, STATUS_DOT, todayLocal, firstName } from '@/lib/utils';
import { lessonsFor, weekType, subjectLabel, dayName } from '@/lib/schedule';
import { useLang } from '@/components/LanguageProvider';
import Icon from '@/components/Icon';
import { Spinner } from '@/components/ui';

type Rec = { status: Status; attendance_sessions: { subject: string; session_date: string } | null };

export default function StudentDashboard() {
  const { t, lang } = useLang();
  const [now, setNow] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [pct, setPct] = useState(0);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setNow(new Date());
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: me } = await supabase.from('students').select('id, full_name, attendance_percentage').eq('user_id', u.user.id).maybeSingle();
      if (me) {
        setName(me.full_name);
        setPct(Math.round(Number(me.attendance_percentage) || 0));
        const { data } = await supabase
          .from('attendance_records')
          .select('status, attendance_sessions(subject, session_date)')
          .eq('student_id', me.id);
        setRecs((data as any) || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading || !now) return <Spinner label={t('common.loading')} />;

  const c: Record<Status, number> = { present: 0, late: 0, absent: 0, excused: 0 };
  recs.forEach((r) => (c[r.status] += 1));
  const today = todayLocal();
  const todays = recs.filter((r) => r.attendance_sessions?.session_date === today);
  const statusOf = (subject: string) => todays.find((r) => r.attendance_sessions?.subject === subject)?.status;
  const lessons = lessonsFor(now.getDay(), weekType(now));
  const tone = pct >= 85 ? 'text-ok' : pct >= 60 ? 'text-warn' : 'text-bad';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">
          {t('dash.hello')} · {dayName(now.getDay(), lang)}
        </p>
        <h1 className="text-[26px] font-bold leading-tight tracking-tight">{firstName(name) || '…'}</h1>
      </div>

      <section className="card relative overflow-hidden p-5">
        <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-2/15 blur-2xl" />
        <p className="eyebrow">{t('dash.myRate')}</p>
        <p className={'mt-2 text-5xl font-bold tracking-tight ' + tone}>{pct}%</p>
        <p className="mt-1 text-sm text-muted">{t('dash.myRateSub')}</p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {STATUS_ORDER.map((s) => (
            <div key={s} className="rounded-xl border border-line bg-surface-2/60 px-2 py-2.5 text-center">
              <p className="text-xl font-bold">{c[s]}</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted">
                <span className={'h-1.5 w-1.5 rounded-full ' + STATUS_DOT[s]} />
                {t('status.' + s)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">{t('dash.todayLessons')}</h2>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted">{t('dash.noLessons')}</p>
        ) : (
          <div className="card divide-y divide-line overflow-hidden">
            {lessons.map((l) => {
              const st = statusOf(l.subject);
              return (
                <div key={l.pair} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 font-bold text-brand">{l.pair}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{subjectLabel(l.subject, lang)}</span>
                    <span className="block truncate text-xs text-muted">{l.teacher || t('sch.vacant')}</span>
                  </span>
                  {st ? (
                    <span className={'rounded-full border px-2 py-0.5 text-xs font-medium ' + STATUS_SOFT[st]}>{t('status.' + st)}</span>
                  ) : (
                    <span className="text-xs text-muted">{t('dash.notMarked')}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/student/schedule" className="card flex items-center gap-3 p-4 hover:bg-surface-2">
          <Icon name="calendar" className="h-5 w-5 text-brand" />
          <span className="text-[15px] font-semibold">{t('dash.timetable')}</span>
        </Link>
        <Link href="/student/history" className="card flex items-center gap-3 p-4 hover:bg-surface-2">
          <Icon name="history" className="h-5 w-5 text-brand" />
          <span className="text-[15px] font-semibold">{t('dash.myHistory')}</span>
        </Link>
      </div>
    </div>
  );
}
