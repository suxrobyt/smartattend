'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_ORDER, STATUS_SOFT, STATUS_SOLID, todayLocal, nowTime, fmtDate } from '@/lib/utils';
import { subjectsOf, lessonsFor, weekType, subjectLabel, pairTime, dayName } from '@/lib/schedule';
import { useQuery } from '@/lib/swr';
import { mySubjects } from '@/lib/teacher';
import { dropEmpty, fetchRecords, SessRow } from '@/lib/sessions';
import { useMe } from '@/components/MeProvider';
import { useLang } from '@/components/LanguageProvider';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { Alert, PageTitle, Spinner } from '@/components/ui';

type Teacher = { id: string; group_id: string };
type Sess = SessRow;

export default function AttendancePage() {
  const { t, lang } = useLang();
  const { me, students: allStudents, groupCode } = useMe();
  const [lessons, setLessons] = useState<ReturnType<typeof lessonsFor>>([]);
  // this week's timetable, Monday..Saturday (for the "my lessons this week" card)
  const [week, setWeek] = useState<{ day: number; list: ReturnType<typeof lessonsFor> }[]>([]);
  const [todayNum, setTodayNum] = useState(0);
  // `draft` = subject on the marking screen. The lesson itself is saved
  // only when the first student is marked, so tapping "Start" leaves no empty lessons behind.
  const [draft, setDraft] = useState<string | null>(null);
  const [session, setSession] = useState<Sess | null>(null);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [reopened, setReopened] = useState(false);
  const creating = useRef<Promise<Sess | null> | null>(null);

  const row = me?.row as { id: string; group_id: string } | undefined;
  const teacher: Teacher | null = row ? { id: row.id, group_id: row.group_id } : null;
  // A subject teacher marks attendance only for his/her own subjects (null = no limit, old setup)
  const mine = mySubjects(row);
  const subjects = mine ?? subjectsOf(groupCode);
  const students = (allStudents || []).filter((s) => !teacher || s.group_id === teacher.group_id);

  const q = useQuery<Sess[]>(teacher ? 'att:today:' + teacher.id : null, async () => {
    const { data } = await supabase
      .from('attendance_sessions')
      .select('id, subject, session_date, status, created_at')
      .eq('teacher_id', teacher!.id)
      .eq('session_date', todayLocal())
      .order('created_at', { ascending: true });
    const all = (data as Sess[]) || [];
    const recs = await fetchRecords<{ session_id: string }>(all.map((x) => x.id), 'session_id');
    return dropEmpty(all, recs);
  });
  const today = q.data || [];
  const reload = q.reload;

  useEffect(() => {
    if (!groupCode) return;
    const d = new Date();
    setLessons(lessonsFor(d.getDay(), weekType(d), groupCode));
    setWeek([1, 2, 3, 4, 5, 6].map((day) => ({ day, list: lessonsFor(day, weekType(d), groupCode) })));
    setTodayNum(d.getDay());
  }, [groupCode]);

  // Opened from History with ?open=<session id>
  useEffect(() => {
    if (!teacher) return;
    const id = new URLSearchParams(window.location.search).get('open');
    if (!id) return;
    window.history.replaceState(null, '', window.location.pathname);
    (async () => {
      const { data: s } = await supabase.from('attendance_sessions').select('id, subject, session_date, status, created_at').eq('id', id).maybeSingle();
      if (s) await reopen(s as Sess);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher?.id]);

  async function loadMarks(sessionId: string) {
    const { data: recs } = await supabase.from('attendance_records').select('student_id, status').eq('session_id', sessionId);
    const m: Record<string, Status> = {};
    (recs || []).forEach((r: any) => (m[r.student_id] = r.status));
    return m;
  }

  async function openSession(s: Sess) {
    setError('');
    setSaved(false);
    creating.current = null;
    setMarks(await loadMarks(s.id));
    setSession(s);
    setDraft(s.subject);
    window.scrollTo({ top: 0 });
  }

  // Finished attendance can be opened again for corrections
  async function reopen(s: Sess) {
    setBusy(true);
    let cur = s;
    if (s.status !== 'active') {
      const { error: e } = await supabase.from('attendance_sessions').update({ status: 'active' }).eq('id', s.id);
      if (e) {
        setBusy(false);
        return setError(t('att.saveFailed') + ': ' + e.message);
      }
      cur = { ...s, status: 'active' };
    }
    await openSession(cur);
    setReopened(s.status !== 'active');
    setBusy(false);
  }

  function start(subject: string) {
    const existing = today.find((x) => x.subject === subject);
    if (existing) return reopen(existing);
    setError('');
    setSaved(false);
    setReopened(false);
    creating.current = null;
    setMarks({});
    setSession(null);
    setDraft(subject);
    window.scrollTo({ top: 0 });
  }

  // Creates the lesson in the database on the first mark (only once, even for quick taps)
  function ensureSession(): Promise<Sess | null> {
    if (session) return Promise.resolve(session);
    if (!teacher || draft === null) return Promise.resolve(null);
    if (!creating.current) {
      creating.current = (async () => {
        const { data: created, error: e } = await supabase
          .from('attendance_sessions')
          .insert({
            group_id: teacher.group_id,
            teacher_id: teacher.id,
            subject: draft,
            session_date: todayLocal(),
            start_time: nowTime(),
            end_time: nowTime(60),
            status: 'active',
          })
          .select('id, subject, session_date, status, created_at')
          .single();
        if (e || !created) {
          setError(t('att.saveFailed') + ': ' + (e?.message || ''));
          creating.current = null;
          return null;
        }
        setSession(created as Sess);
        return created as Sess;
      })();
    }
    return creating.current;
  }

  // Tap a status to set it; tap the same status again to take it back
  async function mark(id: string, status: Status) {
    if (!teacher) return;
    const prev = marks[id];
    const undo = prev === status;
    setMarks((m) => {
      const c = { ...m };
      if (undo) delete c[id];
      else c[id] = status;
      return c;
    });
    const s = await ensureSession();
    let err = !s;
    let msg = '';
    if (s) {
      const res = undo
        ? await supabase.from('attendance_records').delete().eq('session_id', s.id).eq('student_id', id)
        : await supabase.from('attendance_records').upsert(
            { session_id: s.id, student_id: id, status, marked_at: new Date().toISOString(), marked_by: teacher.id },
            { onConflict: 'session_id,student_id' }
          );
      if (res.error) {
        err = true;
        msg = res.error.message;
      }
    }
    if (err) {
      if (msg) setError(t('att.saveFailed') + ': ' + msg);
      setMarks((m) => {
        const c = { ...m };
        if (prev) c[id] = prev;
        else delete c[id];
        return c;
      });
    } else setError('');
  }

  async function markAll(status: Status) {
    if (!teacher) return;
    setBusy(true);
    const s = await ensureSession();
    if (!s) return setBusy(false);
    const rows = students.map((x) => ({ session_id: s.id, student_id: x.id, status, marked_at: new Date().toISOString(), marked_by: teacher.id }));
    const { error: e } = await supabase.from('attendance_records').upsert(rows, { onConflict: 'session_id,student_id' });
    setBusy(false);
    if (e) return setError(t('att.saveFailed') + ': ' + e.message);
    const m: Record<string, Status> = {};
    students.forEach((x) => (m[x.id] = status));
    setMarks(m);
    setError('');
  }

  async function clearAll() {
    if (!session) return;
    if (!window.confirm(t('att.clear') + '?')) return;
    setBusy(true);
    const { error: e } = await supabase.from('attendance_records').delete().eq('session_id', session.id);
    setBusy(false);
    if (e) return setError(t('att.saveFailed') + ': ' + e.message);
    setMarks({});
    setError('');
  }

  // Leave the marking screen. `close` also marks the lesson as finished.
  async function leave(close: boolean) {
    setBusy(true);
    setError('');
    if (session) {
      if (Object.keys(marks).length === 0) {
        // nobody marked: do not keep an empty lesson
        await supabase.from('attendance_sessions').delete().eq('id', session.id);
      } else if (close) {
        const { error: e } = await supabase.from('attendance_sessions').update({ status: 'closed' }).eq('id', session.id);
        if (e) {
          setBusy(false);
          return setError(t('att.saveFailed') + ': ' + e.message);
        }
      }
    }
    await reload();
    setBusy(false);
    setSaved(close && Object.keys(marks).length > 0);
    setDraft(null);
    setSession(null);
    setMarks({});
    setReopened(false);
    creating.current = null;
    window.scrollTo({ top: 0 });
  }

  if (me === undefined || !groupCode) return <Spinner label={t('common.loading')} />;
  if (!teacher) return <Alert kind="error">{t('att.noTeacher')}</Alert>;
  if (q.data === undefined || allStudents === undefined) return <Spinner label={t('common.loading')} />;

  // ---------- marking screen ----------
  if (draft !== null) {
    const count = (st: Status) => Object.values(marks).filter((v) => v === st).length;
    const marked = Object.keys(marks).length;
    return (
      <div className="pb-28">
        <button type="button" onClick={() => leave(false)} disabled={busy} className="-ml-1 mb-3 flex items-center gap-1 text-sm font-semibold text-brand">
          <Icon name="chevron-left" className="h-[18px] w-[18px]" />
          {t('att.back')}
        </button>
        <PageTitle title={subjectLabel(draft, lang)} subtitle={`${fmtDate(session?.session_date || todayLocal())} · ${t('att.marked', { a: marked, b: students.length })}`} />
        {reopened && <div className="mb-3"><Alert kind="info">{t('att.reopenHint')}</Alert></div>}
        <div className="mb-4 grid grid-cols-4 gap-2">
          {STATUS_ORDER.map((st) => (
            <div key={st} className={'rounded-xl border px-2 py-2 text-center ' + STATUS_SOFT[st]}>
              <p className="text-lg font-bold">{count(st)}</p>
              <p className="text-[11px]">{t('status.' + st)}</p>
            </div>
          ))}
        </div>
        <div className="mb-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn-soft" disabled={busy} onClick={() => markAll('present')}>
            {t('att.allPresent')}
          </button>
          <button type="button" className="btn-danger" disabled={busy || marked === 0} onClick={clearAll}>
            {t('att.clear')}
          </button>
        </div>
        {error && <div className="mb-3"><Alert kind="error">{error}</Alert></div>}
        <div className="space-y-2.5">
          {students.map((s, i) => (
            <div key={s.id} className="card p-3">
              <div className="mb-2.5 flex items-center gap-3">
                <Avatar name={s.full_name} size={34} />
                <p className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                  <span className="mr-1.5 text-xs font-normal text-muted">{i + 1}</span>
                  {s.full_name}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {STATUS_ORDER.map((st) => {
                  const on = marks[s.id] === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => mark(s.id, st)}
                      className={'rounded-lg border py-2 text-xs font-semibold transition active:scale-95 ' + (on ? STATUS_SOLID[st] : 'border-line bg-surface-2 text-muted')}
                    >
                      {t('status.' + st)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl">
            <button type="button" className="btn-primary w-full" disabled={busy} onClick={() => leave(true)}>
              {busy ? t('common.saving') : t('att.finish')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- lesson list ----------
  const stateOf = (subject: string) => today.find((x) => x.subject === subject);
  if (subjects.length === 0) {
    return (
      <div className="space-y-5">
        <PageTitle title={t('att.title')} />
        <Alert kind="info">{t('att.noSubjects')}</Alert>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      <PageTitle title={t('att.title')} />
      {saved && <Alert kind="success">{t('att.saved')}</Alert>}
      {error && <Alert kind="error">{error}</Alert>}

      <section>
        <h2 className="mb-3 text-lg font-bold">{t('att.lessonsToday')}</h2>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted">{t('att.noLessons')}</p>
        ) : (
          <div className="space-y-2.5">
            {lessons.map((l) => {
              const own = subjects.includes(l.subject);
              const s = own ? stateOf(l.subject) : undefined;
              return (
                <div key={l.pair} className={'card flex items-center gap-3 p-3.5 ' + (own ? '' : 'opacity-70')}>
                  <span className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold ' + (own ? 'bg-brand/15 text-brand' : 'bg-surface-2 text-muted')}>{l.pair}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{subjectLabel(l.subject, lang)}</p>
                    <p className="text-xs text-muted">
                      {t('att.pair', { n: l.pair })} · {pairTime(l.pair)}
                      {own ? (s ? ` · ${s.status === 'active' ? t('att.active') : t('att.finished')}` : '') : l.teacher ? ` · ${l.teacher}` : ''}
                    </p>
                  </div>
                  {own ? (
                    <button type="button" disabled={busy} onClick={() => start(l.subject)} className={s ? 'btn-soft !px-3 !py-2 text-sm' : 'btn-primary !px-3.5 !py-2 text-sm'}>
                      {!s ? t('att.start') : s.status === 'active' ? t('att.continue') : t('att.reopen')}
                    </button>
                  ) : (
                    <span className="chip shrink-0">{t('att.otherTeacher')}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {mine && (
        <section>
          <h2 className="mb-3 text-lg font-bold">{t('att.myWeek')}</h2>
          <div className="card divide-y divide-line overflow-hidden">
            {week
              .map((d) => ({ ...d, list: d.list.filter((l) => subjects.includes(l.subject)) }))
              .filter((d) => d.list.length > 0)
              .map((d) => (
                <div key={d.day} className="px-4 py-3">
                  <p className={'text-sm font-bold ' + (d.day === todayNum ? 'text-brand' : '')}>{dayName(d.day, lang)}</p>
                  <div className="mt-1.5 space-y-1">
                    {d.list.map((l) => (
                      <p key={l.pair} className="flex items-baseline gap-2 text-[13px] text-muted">
                        <span className="w-14 shrink-0 text-xs">{t('att.pair', { n: l.pair })}</span>
                        <span className="min-w-0 flex-1 text-ink">{subjectLabel(l.subject, lang)}</span>
                        <span className="shrink-0 text-xs">{pairTime(l.pair)}</span>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
