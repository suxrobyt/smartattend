'use client';

import { useEffect, useState } from 'react';
import { useLang } from './LanguageProvider';
import { GROUP_LABEL, ROOM, lessonsFor, weekType, mondayOf, addDays, subjectLabel, dayName, dayShort, pairTime, pairState } from '@/lib/schedule';
import { PageTitle, Segmented } from './ui';
import Icon from './Icon';

export default function ScheduleView() {
  const { t, lang } = useLang();
  const [now, setNow] = useState<Date | null>(null);
  const [off, setOff] = useState<'0' | '1'>('0');
  const [day, setDay] = useState(1);

  useEffect(() => {
    const d = new Date();
    setNow(d);
    setDay(d.getDay() === 0 ? 1 : d.getDay());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const base = addDays(mondayOf(now), off === '1' ? 7 : 0);
  const wt = weekType(base);
  const todayDow = now.getDay();
  const isThisWeek = off === '0';
  const dateOf = (d: number) => addDays(base, d - 1);
  const lessons = lessonsFor(day, wt);
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;

  return (
    <div className="space-y-4">
      <PageTitle title={t('sch.title')} subtitle={`${GROUP_LABEL} · ${t('sch.room')}: ${ROOM}`} />
      <Segmented
        value={off}
        onChange={setOff}
        options={[
          { value: '0', label: t('sch.thisWeek') },
          { value: '1', label: t('sch.nextWeek') },
        ]}
      />
      <div className="grid grid-cols-6 gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((d) => {
          const active = d === day;
          const isToday = isThisWeek && d === todayDow;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={
                'flex flex-col items-center rounded-xl border py-2 transition ' +
                (active ? 'border-brand bg-brand text-[#04101f]' : 'border-line bg-surface text-ink hover:bg-surface-2')
              }
            >
              <span className="text-[11px] font-semibold">{dayShort(d, lang)}</span>
              <span className={'text-base font-bold ' + (active ? '' : isToday ? 'text-brand' : '')}>{dateOf(d).getDate()}</span>
              <span className={'mt-0.5 h-1 w-1 rounded-full ' + (isToday ? (active ? 'bg-[#04101f]' : 'bg-brand') : 'bg-transparent')} />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">
          {dayName(day, lang)} <span className="text-sm font-medium text-muted">· {fmt(dateOf(day))}</span>
        </h2>
      </div>

      <div className="space-y-3">
        {lessons.map((l) => (
          <div key={l.pair} className={'card flex gap-3.5 p-4 ' + (isThisWeek && day === todayDow && pairState(l.pair, now) === 'now' ? '!border-brand' : '')}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/15 text-lg font-bold text-brand">{l.pair}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-snug">{subjectLabel(l.subject, lang)}</p>
              <p className="mt-1 text-sm text-muted">{l.teacher || t('sch.vacant')}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="chip !border-brand/30 !bg-brand/10 !text-brand">{pairTime(l.pair)}</span>
                <span className="chip">
                  <Icon name="pin" className="h-3 w-3" />
                  {ROOM}
                </span>
              </div>
            </div>
          </div>
        ))}
        {lessons.length === 0 && <p className="py-8 text-center text-sm text-muted">{t('sch.noLessons')}</p>}
      </div>
    </div>
  );
}
