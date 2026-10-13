'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_ORDER, STATUS_SOFT, STATUS_SOLID, todayLocal, nowTime, fmtDate } from '@/lib/utils';
import { ALL_SUBJECTS, lessonsFor, weekType, subjectLabel, pairTime } from '@/lib/schedule';
import { useQuery } from '@/lib/swr';
import { useMe } from '@/components/MeProvider';
import { useLang } from '@/components/LanguageProvider';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { Alert, PageTitle, Spinner } from '@/components/ui';

type Teacher = { id: string; group_id: string };
type Sess = { id: string; subject: string; session_date: string; status: string };

export default function AttendancePage() {
  const { t, lang } = useLang();
  const { me, students: allStudents } = useMe();
  const [lessons, setLessons] = useState<ReturnType<typeof lessonsFor>>([]);
  const [session, setSession] = useState<Sess | null>(null);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [manual, setManual] = useState(ALL_SUBJECTS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [reopened, setReopened] = useState(false);

  const row = me?.row as { id: string; group_id: string } | undefined;
  const teacher: Teacher | null = row ? { id: row.id, group_id: row.group_id } : null;
  const students = (allStudents || []).filter((s) => !teacher || s.group_id === teacher.group_id);

  const q = useQuery<Sess[]>(teacher ? 'att:today:' + teacher.id : null, async () => {
    const { data } = await supabase
      .from('attendance_sessions')
      .select('id, subject, session_date, status')
      .eq('teacher_id', teacher!.id)
      .eq('session_date', todayLocal())
      .order('created_at', { ascending: true });
    return (data as Sess[]) || [];
  });
  const today = q.data || [];
  const reload = q.reload;

  useEffect(() => {
    const d = new Date();
    setLessons(lessonsFor(d.getDay(), weekType(d)));
  }, []);

  // Opened from History with ?open=<session id>
  useEffect(() => {
    if (!teacher) return;
    const id = new URLSearchParams(window.location.search).get('open');
    if (!id) return;
    window.history.replaceState(null, '', window.location.pathname);
    (async () => {
      const { data: s } = await supabase.from('attendance_sessions').select('id, subject, session_date, status').eq('id', id).maybeSingle();
      if (s) await reopen(s as Sess);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacher?.id]);

  function patchToday(next: Sess[]) {
    q.mutate(next);
  }

  async function openSession(s: Sess) {
    setError('');
    setSaved(false);
    const { data: recs } = await supabase.from('attendance_records').select('student_id, status').eq('session_id', s.id);
    const m: Record<string, Status> = {};
    (recs || []).forEach((r: any) => (m[r.student_id] = r.status));
    setMarks(m);
    setSession(s);
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
      patchToday(today.map((x) => (x.id === s.id ? cur : x)));
    }
    await openSession(cur);
    setReopened(s.status !== 'active');
    setBusy(false);
  }

  async function start(subject: string) {
    if (!teacher) return;
    const existing = today.find((x) => x.subject === subject);
    if (existing) {
      setReopened(false);
      return existing.status === 'active' ? openSession(existing) : reopen(existing);
    }
    setBusy(true);
    setError('');
    const { data: created, error: e } = await supabase
      .from('attendance_sessions')
      .insert({
        group_id: teacher.group_id,
        teacher_id: teacher.id,
        subject,
        session_date: todayLocal(),
        start_time: nowTime(),
        end_time: nowTime(60),
        status: 'active',
      })
      .select('id, subject, session_date, status')
      .single();
    setBusy(false);
    if (e || !created) return setError(t('att.saveFailed') + ': ' + (e?.message || ''));
    setMarks({});
    setReopened(false);
    setSession(created as Sess);
    patchToday([...today, created as Sess]);
  }

  // Tap a status to set it; tap the same status again to take it back
  async function mark(id: string, status: Status) {
    if (!session || !teacher) return;
    const prev = marks[id];
    const undo = prev === status;
    setMarks((m) => {
      const c = { ...m };
      if (undo) delete c[id];
      else c[id] = status;
      return c;
    });
    const res = undo
      ? await supabase.from('attendance_records').delete().eq('session_id', session.id).eq('student_id', id)
      : await supabase.from('attendance_records').upsert(
          { session_id: session.id, student_id: id, status, marked_at: new Date().toISOString(), marked_by: teacher.id },
          { onConflict: 'session_id,student_id' }
        );
    if (res.error) {
      setError(t('att.saveFailed') + ': ' + res.error.message);
      setMarks((m) => {
        const c = { ...m };
        if (prev) c[id] = prev;
        else delete c[id];
        return c;
      });
    } else setError('');
  }

  async function markAll(status: Status) {
    if (!session || !teacher) return;
    setBusy(true);
    const rows = students.map((s) => ({ session_id: session.id, student_id: s.id, status, marked_at: new Date().toISOString(), marked_by: teacher.id }));
    const { error: e } = await supabase.from('attendance_records').upsert(rows, { onConflict: 'session_id,student_id' });
    setBusy(false);
    if (e) return setError(t('att.saveFailed') + ': ' + e.message);
    const m: Record<string, Status> = {};
    students.forEach((s) => (m[s.id] = status));
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

  async function finish() {
    if (!session || !teacher) return;
    setBusy(true);
    const missing = students.filter((s) => !marks[s.id]);
    if (missing.length) {
      const rows = missing.map((s) => ({ session_id: session.id, student_id: s.id, status: 'absent', marked_at: new Date().toISOString(), marked_by: teacher.id }));
      const { error: e1 } = await supabase.from('attendance_records').upsert(rows, { onConflict: 'session_id,student_id' });
      if (e1) {
        setBusy(false);
        return setError(t('att.saveFailed') + ': ' + e1.message);
      }
    }
    const { error: e2 } = await supabase.from('attendance_sessions').update({ status: 'closed' }).eq('id', session.id);
    setBusy(false);
    if (e2) return setError(t('att.saveFailed') + ': ' + e2.message);
    patchToday(today.map((x) => (x.id === session.id ? { ...x, status: 'closed' } : x)));
    setSession(null);
    setMarks({});
    setSaved(true);
    reload();
    window.scrollTo({ top: 0 });
  }

  if (me === undefined) return <Spinner label={t('common.loading')} />;
  if (!teacher) return <Alert kind="error">{t('att.noTeacher')}</Alert>;
  if (q.data === undefined || allStudents === undefined) return <Spinner label={t('common.loading')} />;

  // ---------- marking screen ----------
  if (session) {
    const count = (st: Status) => Object.values(marks).filter((v) => v === st).length;
    const marked = Object.keys(marks).length;
    return (
      <div className="pb-28">
        <button
          type="button"
          onClick={() => {
            setSession(null);
            setReopened(false);
            reload();
          }}
          className="-ml-1 mb-3 flex items-center gap-1 text-sm font-semibold text-brand"
        >
          <Icon name="chevron-left" className="h-[18px] w-[18px]" />
          {t('att.back')}
        </button>
        <PageTitle title={subjectLabel(session.subject, lang)} subtitle={`${fmtDate(session.session_date)} · ${t('att.marked', { a: marked, b: students.length })}`} />
        {reopened && <div className="mb-3"><Alert kind="info">{t('att.reopenHint')}</Alert></div>}
        <div className="mb-4 grid grid-cols-4 gap-2">
          {STATUS_ORDER.map((st) => (
            <div key={st} className={'rounded-xl border px-2 py-2 text-center ' + STATUS_SOFT[st]}>
              <p className="text-lg font-bold">{count(st)}</p>
              <p className="text-[11px]">{t('status.' + st)}</p>
            </div>
          ))}
        </div>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <button type="button" className="btn-soft" disabled={busy} onClick={() => markAll('present')}>
            {t('att.allPresent')}
          </button>
          <button type="button" className="btn-danger" disabled={busy || marked === 0} onClick={clearAll}>
            {t('att.clear')}
          </button>
        </div>
        <p className="mb-4 text-center text-xs text-muted">{t('att.tapAgain')}</p>
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
            <button type="button" className="btn-primary w-full" disabled={busy} onClick={finish}>
              {busy ? t('common.saving') : t('att.finish')}
            </button>
            <p className="mt-1.5 text-center text-[11px] text-muted">{t('att.unmarkedNote')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- lesson list ----------
  const stateOf = (subject: string) => today.find((x) => x.subject === subject);
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
              const s = stateOf(l.subject);
              return (
                <div key={l.pair} className="card flex items-center gap-3 p-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/15 font-bold text-brand">{l.pair}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{subjectLabel(l.subject, lang)}</p>
                    <p className="text-xs text-muted">
                      {t('att.pair', { n: l.pair })} · {pairTime(l.pair)}
                      {s && ` · ${s.status === 'active' ? t('att.active') : t('att.finished')}`}
                    </p>
                  </div>
                  <button type="button" disabled={busy} onClick={() => start(l.subject)} className={s ? 'btn-soft !px-3 !py-2 text-sm' : 'btn-primary !px-3.5 !py-2 text-sm'}>
                    {!s ? t('att.start') : s.status === 'active' ? t('att.continue') : t('att.reopen')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="text-[15px] font-bold">{t('att.other')}</h2>
        <select className="field" value={manual} onChange={(e) => setManual(e.target.value)} aria-label={t('att.pickSubject')}>
          {ALL_SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {subjectLabel(s, lang)}
            </option>
          ))}
        </select>
        <button type="button" className="btn-soft w-full" disabled={busy} onClick={() => start(manual)}>
          {today.find((x) => x.subject === manual)?.status === 'closed' ? t('att.reopen') : t('att.start')}
        </button>
      </section>
    </div>
  );
}
