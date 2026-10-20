'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, todayLocal, nowTime, fmtDate, shortName } from '@/lib/utils';
import { subjectsOf, lessonsFor, weekType, subjectLabel, pairTime, dayName } from '@/lib/schedule';
import { useQuery } from '@/lib/swr';
import { mySubjects, isCurator } from '@/lib/teacher';
import { dropEmpty, fetchRecords, SessRow } from '@/lib/sessions';
import { useMe } from '@/components/MeProvider';
import { useLang } from '@/components/LanguageProvider';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { Alert, PageTitle, Spinner } from '@/components/ui';

type Teacher = { id: string; group_id: string };
type Sess = SessRow;
type Lesson = ReturnType<typeof lessonsFor>[number];
type Summary = { subject: string; date: string; yes: number; no: number; absent: string[] };

// Teachers mark only "Bor" (present) / "Yo'q" (absent). Older records may still be "late" / "excused":
// they are shown as Bor / Yo'q (with a small note) and left untouched until the teacher taps a button.
const view = (st?: Status): 'yes' | 'no' | null => (st === 'present' || st === 'late' ? 'yes' : st === 'absent' || st === 'excused' ? 'no' : null);

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
  const [summary, setSummary] = useState<Summary | null>(null);
  const [copied, setCopied] = useState(false);
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
    setSummary(null);
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
    setSummary(null);
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

  // Marks everybody who is still unmarked as present (already marked students are never changed)
  async function markRest() {
    if (!teacher) return;
    const todo = students.filter((x) => !marks[x.id]);
    if (todo.length === 0) return;
    setBusy(true);
    const s = await ensureSession();
    if (!s) return setBusy(false);
    const at = new Date().toISOString();
    const rows = todo.map((x) => ({ session_id: s.id, student_id: x.id, status: 'present', marked_at: at, marked_by: teacher.id }));
    const { error: e } = await supabase.from('attendance_records').upsert(rows, { onConflict: 'session_id,student_id' });
    setBusy(false);
    if (e) return setError(t('att.saveFailed') + ': ' + e.message);
    setMarks((m) => {
      const c = { ...m };
      todo.forEach((x) => (c[x.id] = 'present'));
      return c;
    });
    setError('');
  }

  async function copySummary() {
    if (!summary) return;
    const text = `${subjectLabel(summary.subject, lang)} · ${fmtDate(summary.date)}\n${t('att.absent')} (${summary.absent.length}): ${summary.absent.join(', ')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
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
    const yes = students.filter((x) => view(marks[x.id]) === 'yes').length;
    const no = students.filter((x) => view(marks[x.id]) === 'no').length;
    setSummary(
      close && yes + no > 0
        ? {
            subject: session?.subject ?? draft ?? '',
            date: session?.session_date || todayLocal(),
            yes,
            no,
            absent: students.filter((x) => view(marks[x.id]) === 'no').map((x) => shortName(x.full_name)),
          }
        : null
    );
    setCopied(false);
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
    const nYes = students.filter((x) => view(marks[x.id]) === 'yes').length;
    const nNo = students.filter((x) => view(marks[x.id]) === 'no').length;
    const total = students.length;
    const marked = nYes + nNo;
    const rest = total - marked;
    const pct = total > 0 ? Math.round((marked / total) * 100) : 0;
    const seg = 'flex flex-1 items-center justify-center rounded-[9px] text-[13px] font-bold transition active:scale-95';
    return (
      <div>
        <button type="button" onClick={() => leave(false)} disabled={busy} className="-ml-1 mb-2 flex items-center gap-1 text-sm font-semibold text-brand">
          <Icon name="chevron-left" className="h-[18px] w-[18px]" />
          {t('att.back')}
        </button>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">{subjectLabel(draft, lang)}</h1>
        <p className="mt-1 text-sm text-muted">
          {fmtDate(session?.session_date || todayLocal())} · {t('att.marked', { a: marked, b: total })}
        </p>
        {reopened && <div className="mt-3"><Alert kind="info">{t('att.reopenHint')}</Alert></div>}

        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2 transition-all" style={{ width: pct + '%' }} />
          </div>
          <span className="w-10 text-right text-xs font-bold text-brand-2">{pct}%</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-ok/30 bg-ok/10 p-2.5">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#16a34a] text-white"><Icon name="check" className="h-4 w-4" strokeWidth={3} /></span>
              <span className="text-2xl font-bold leading-none text-ok">{nYes}</span>
            </div>
            <p className="mt-1.5 text-[11px] font-bold">{t('att.present')}</p>
          </div>
          <div className="rounded-xl border border-bad/30 bg-bad/10 p-2.5">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e11d48] text-white"><Icon name="x" className="h-4 w-4" strokeWidth={3} /></span>
              <span className="text-2xl font-bold leading-none text-bad">{nNo}</span>
            </div>
            <p className="mt-1.5 text-[11px] font-bold">{t('att.absent')}</p>
          </div>
          <div className="rounded-xl border border-line bg-surface p-2.5">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-muted/60 text-muted"><Icon name="minus" className="h-4 w-4" strokeWidth={2.6} /></span>
              <span className="text-2xl font-bold leading-none">{rest}</span>
            </div>
            <p className="mt-1.5 truncate text-[11px] font-bold">{t('att.unmarked')}</p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy || rest === 0}
            onClick={markRest}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-brand/30 bg-brand/10 px-2 text-[12.5px] font-semibold text-brand transition active:scale-[.98] disabled:opacity-40"
          >
            <Icon name="user-check" className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('att.allPresentBtn')}</span>
          </button>
          <button
            type="button"
            disabled={busy || marked === 0}
            onClick={clearAll}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-brand/30 bg-brand/10 px-2 text-[12.5px] font-semibold text-brand transition active:scale-[.98] disabled:opacity-40"
          >
            <Icon name="trash" className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('att.clear')}</span>
          </button>
        </div>

        {error && <div className="mt-3"><Alert kind="error">{error}</Alert></div>}

        <div className="card mt-3 overflow-hidden">
          {students.map((s, idx) => {
            const raw = marks[s.id];
            const v = view(raw);
            const parts = s.full_name.trim().split(/\s+/);
            const head = parts.slice(0, 2).join(' ');
            const tail = parts.slice(2).join(' ');
            return (
              <div key={s.id} className="flex min-h-[58px] items-center gap-2 border-t border-line px-3 py-2 first:border-t-0">
                <span className="w-4 shrink-0 text-center text-[11px] font-semibold text-muted">{idx + 1}</span>
                <Avatar name={s.full_name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold leading-tight tracking-tight">{head}</p>
                  {(tail || raw === 'late' || raw === 'excused') && (
                    <p className="mt-0.5 text-xs leading-tight text-muted">
                      {tail}
                      {raw === 'late' && <span className="font-semibold text-warn">{tail ? ' · ' : ''}{t('status.late')}</span>}
                      {raw === 'excused' && <span className="font-semibold text-info">{tail ? ' · ' : ''}{t('status.excused')}</span>}
                    </p>
                  )}
                </div>
                <div className="flex h-[36px] w-[112px] shrink-0 gap-0.5 rounded-xl border border-line bg-[#0d1426] p-[3px]">
                  <button
                    type="button"
                    aria-pressed={v === 'yes'}
                    onClick={() => mark(s.id, 'present')}
                    className={seg + (v === 'yes' ? ' bg-[#16a34a] text-white' : ' text-muted')}
                  >
                    {t('att.present')}
                  </button>
                  <button
                    type="button"
                    aria-pressed={v === 'no'}
                    onClick={() => mark(s.id, 'absent')}
                    className={seg + (v === 'no' ? ' bg-[#e11d48] text-white' : ' text-muted')}
                  >
                    {t('att.absent')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {rest > 0 && <p className="mt-3 text-center text-xs font-semibold text-warn">{t('att.restWarn', { n: rest })}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={() => leave(true)}
          className="btn mt-3 w-full bg-gradient-to-r from-[#2b59e8] to-[#14c8f0] text-white"
          style={{ boxShadow: '0 10px 24px -10px rgba(34,211,238,.55)' }}
        >
          <Icon name="flag" className="h-[18px] w-[18px]" />
          {busy ? t('common.saving') : t('att.finish')}
        </button>
      </div>
    );
  }

  // ---------- lesson list ----------
  const stateOf = (subject: string) => today.find((x) => x.subject === subject);
  // "My lessons this week": a subject teacher's own subjects; a curator's own lessons (matched by name)
  const myName = ((me?.row as any)?.full_name as string | undefined) || '';
  const isMine = (l: Lesson) => (mine ? mine.includes(l.subject) : isCurator(me?.row) && !!myName && (l.teacher || '').trim().toLowerCase() === myName.trim().toLowerCase());
  const weekRows = week.map((d) => ({ ...d, list: d.list.filter(isMine) })).filter((d) => d.list.length > 0);
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
      {summary && (
        <section className="card p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ok text-[#05261a]">
              <Icon name="check" className="h-6 w-6" strokeWidth={3} />
            </span>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight">{t('att.saved')}</p>
              <p className="truncate text-xs text-muted">
                {subjectLabel(summary.subject, lang)} · {fmtDate(summary.date)}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-ok/30 bg-ok/10 px-3 py-2.5 text-center">
              <p className="text-2xl font-bold text-ok">{summary.yes}</p>
              <p className="text-[11px] text-muted">{t('att.present')}</p>
            </div>
            <div className="rounded-xl border border-bad/30 bg-bad/10 px-3 py-2.5 text-center">
              <p className="text-2xl font-bold text-bad">{summary.no}</p>
              <p className="text-[11px] text-muted">{t('att.absent')}</p>
            </div>
          </div>
          {summary.absent.length > 0 ? (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="eyebrow">
                  {t('att.absentList')} · {summary.absent.length}
                </p>
                <button
                  type="button"
                  onClick={copySummary}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/10 px-2.5 py-1.5 text-xs font-bold text-brand"
                >
                  <Icon name="copy" className="h-3.5 w-3.5" />
                  {copied ? t('att.copied') : t('att.copy')}
                </button>
              </div>
              <ul className="mt-2 divide-y divide-line rounded-xl border border-line bg-surface-2/40">
                {summary.absent.map((n) => (
                  <li key={n} className="px-3 py-2 text-sm">
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-ok">{t('att.allHere')}</p>
          )}
        </section>
      )}
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
                    <p className="text-[15px] font-semibold leading-snug">{subjectLabel(l.subject, lang)}</p>
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

      {weekRows.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">{t('att.myWeek')}</h2>
          <div className="card divide-y divide-line overflow-hidden">
            {weekRows.map((d) => (
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
