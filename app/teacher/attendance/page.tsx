'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_LABEL, STATUS_COLOR, todayLocal, nowTime } from '@/lib/utils';

type StudentRow = { id: string; full_name: string };
const ORDER: Status[] = ['present', 'late', 'absent', 'excused'];

export default function AttendancePage() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [session, setSession] = useState<any>(null);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function init() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
      return;
    }
    const { data: t } = await supabase
      .from('teachers')
      .select('id, group_id')
      .eq('user_id', user.id)
      .single();
    if (!t) {
      setError("O'qituvchi profili topilmadi");
      setLoading(false);
      return;
    }
    setTeacher(t);

    const { data: st } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('group_id', t.group_id)
      .order('full_name');
    setStudents(st || []);

    const { data: sub } = await supabase
      .from('subjects')
      .select('name')
      .eq('group_id', t.group_id)
      .order('name');
    const names = (sub || []).map((x: any) => x.name);
    setSubjects(names);
    setSubject(names[0] || '');

    // Resume today's unfinished lesson, if any
    const { data: active } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('teacher_id', t.id)
      .eq('status', 'active')
      .eq('session_date', todayLocal())
      .order('created_at', { ascending: false })
      .limit(1);
    if (active && active[0]) await openSession(active[0]);
    setLoading(false);
  }

  async function openSession(s: any) {
    setSession(s);
    const { data: recs } = await supabase
      .from('attendance_records')
      .select('student_id, status')
      .eq('session_id', s.id);
    const m: Record<string, Status> = {};
    (recs || []).forEach((r: any) => (m[r.student_id] = r.status));
    setMarks(m);
  }

  async function startSession() {
    if (!subject.trim()) {
      setError('Fan nomini kiriting');
      return;
    }
    setBusy(true);
    setError('');
    const { data, error: e } = await supabase
      .from('attendance_sessions')
      .insert({
        group_id: teacher.group_id,
        teacher_id: teacher.id,
        subject: subject.trim(),
        session_date: todayLocal(),
        start_time: nowTime(),
        end_time: nowTime(60),
        status: 'active',
      })
      .select()
      .single();
    setBusy(false);
    if (e || !data) {
      setError("Dars ochilmadi: " + (e?.message || 'noma\'lum xato'));
      return;
    }
    setMarks({});
    setSession(data);
  }

  async function mark(studentId: string, status: Status) {
    const prev = marks[studentId];
    setMarks((m) => ({ ...m, [studentId]: status }));
    const { error: e } = await supabase.from('attendance_records').upsert(
      {
        session_id: session.id,
        student_id: studentId,
        status,
        marked_at: new Date().toISOString(),
        marked_by: teacher.id,
      },
      { onConflict: 'session_id,student_id' }
    );
    if (e) {
      setError('Saqlanmadi: ' + e.message);
      setMarks((m) => {
        const c = { ...m };
        if (prev) c[studentId] = prev;
        else delete c[studentId];
        return c;
      });
    } else {
      setError('');
    }
  }

  async function markAll(status: Status) {
    setBusy(true);
    const rows = students.map((s) => ({
      session_id: session.id,
      student_id: s.id,
      status,
      marked_at: new Date().toISOString(),
      marked_by: teacher.id,
    }));
    const { error: e } = await supabase
      .from('attendance_records')
      .upsert(rows, { onConflict: 'session_id,student_id' });
    setBusy(false);
    if (e) {
      setError('Saqlanmadi: ' + e.message);
      return;
    }
    const m: Record<string, Status> = {};
    students.forEach((s) => (m[s.id] = status));
    setMarks(m);
    setError('');
  }

  async function finish() {
    setBusy(true);
    // Anyone not marked is recorded as absent
    const missing = students.filter((s) => !marks[s.id]);
    if (missing.length) {
      const rows = missing.map((s) => ({
        session_id: session.id,
        student_id: s.id,
        status: 'absent',
        marked_at: new Date().toISOString(),
        marked_by: teacher.id,
      }));
      const { error: e1 } = await supabase
        .from('attendance_records')
        .upsert(rows, { onConflict: 'session_id,student_id' });
      if (e1) {
        setBusy(false);
        setError('Saqlanmadi: ' + e1.message);
        return;
      }
    }
    const { error: e2 } = await supabase
      .from('attendance_sessions')
      .update({ status: 'closed' })
      .eq('id', session.id);
    setBusy(false);
    if (e2) {
      setError('Dars yopilmadi: ' + e2.message);
      return;
    }
    router.push('/teacher/dashboard');
    router.refresh();
  }

  if (loading) {
    return <div className="p-4 text-slate-400">Yuklanmoqda...</div>;
  }

  if (!session) {
    return (
      <div className="p-4 space-y-5 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-white">Yangi dars</h1>
        <p className="text-slate-400 text-sm">
          Fanni tanlang va davomat belgilashni boshlang.
        </p>
        {subjects.length > 0 ? (
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3"
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Fan nomi"
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3"
          />
        )}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={startSession}
          disabled={busy || !teacher}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-4 rounded-xl text-lg disabled:opacity-50"
        >
          {busy ? 'Ochilmoqda...' : 'Davomatni boshlash'}
        </button>
      </div>
    );
  }

  const count = (st: Status) => Object.values(marks).filter((v) => v === st).length;
  const marked = Object.keys(marks).length;

  return (
    <div className="p-4 pb-32 space-y-4 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">{session.subject}</h1>
        <p className="text-slate-400 text-sm">
          {session.session_date} · belgilandi {marked}/{students.length}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {ORDER.map((st) => (
          <div key={st} className="bg-slate-800 border border-slate-700 rounded-lg py-2">
            <p className="text-slate-400">{STATUS_LABEL[st]}</p>
            <p className="text-lg font-bold text-white">{count(st)}</p>
          </div>
        ))}
      </div>

      <button
        onClick={() => markAll('present')}
        disabled={busy}
        className="w-full bg-slate-800 border border-slate-700 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50"
      >
        Hammasini "Keldi" qilish
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="space-y-2">
        {students.map((s, i) => (
          <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3">
            <p className="text-white text-sm font-medium mb-2">
              {i + 1}. {s.full_name}
            </p>
            <div className="grid grid-cols-4 gap-1.5">
              {ORDER.map((st) => (
                <button
                  key={st}
                  onClick={() => mark(s.id, st)}
                  className={
                    'text-xs font-semibold py-2 rounded-lg border ' +
                    (marks[s.id] === st
                      ? STATUS_COLOR[st]
                      : 'bg-slate-900 text-slate-400 border-slate-700')
                  }
                >
                  {STATUS_LABEL[st]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 border-t border-slate-800">
        <button
          onClick={finish}
          disabled={busy}
          className="w-full max-w-md mx-auto block bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50"
        >
          {busy ? 'Saqlanmoqda...' : 'Darsni yakunlash'}
        </button>
      </div>
    </div>
  );
}
