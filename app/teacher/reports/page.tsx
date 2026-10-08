'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_LABEL, toCsv, downloadCsv } from '@/lib/utils';

type SessionRow = { id: string; subject: string; session_date: string };
type RecRow = {
  session_id: string;
  student_id: string;
  status: Status;
  students: { full_name: string; username: string } | null;
};
type StudentRow = { id: string; full_name: string; username: string };

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA');
}

export default function ReportsPage() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(daysAgo(0));
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [records, setRecords] = useState<RecRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data: st } = await supabase
        .from('students')
        .select('id, full_name, username')
        .order('full_name');
      setStudents((st as StudentRow[]) || []);

      const { data: ss, error: se } = await supabase
        .from('attendance_sessions')
        .select('id, subject, session_date')
        .gte('session_date', from)
        .lte('session_date', to)
        .order('session_date', { ascending: true })
        .limit(500);
      if (se) throw se;
      setSessions((ss as SessionRow[]) || []);

      // Fetch records in small chunks so we never hit the 1000-row limit
      const ids = (ss || []).map((s: any) => s.id);
      const all: RecRow[] = [];
      for (let i = 0; i < ids.length; i += 20) {
        const chunk = ids.slice(i, i + 20);
        const { data: rr, error: re } = await supabase
          .from('attendance_records')
          .select('session_id, student_id, status, students(full_name, username)')
          .in('session_id', chunk);
        if (re) throw re;
        all.push(...((rr as any) || []));
      }
      setRecords(all);
    } catch (e: any) {
      setError(e.message || 'Xato');
    }
    setLoading(false);
  }

  const summary = students.map((s) => {
    const mine = records.filter((r) => r.student_id === s.id);
    const c = (st: Status) => mine.filter((r) => r.status === st).length;
    const total = mine.length;
    const percent = total ? Math.round(((c('present') + c('late')) / total) * 100) : 0;
    return {
      ...s,
      present: c('present'),
      late: c('late'),
      absent: c('absent'),
      excused: c('excused'),
      total,
      percent,
    };
  });

  function csvSummary() {
    const rows: (string | number)[][] = [
      ['№', 'Talaba', 'Username', 'Keldi', 'Kechikdi', 'Kelmadi', 'Sababli', 'Jami darslar', 'Davomat %'],
      ...summary.map((s, i) => [
        i + 1,
        s.full_name,
        s.username,
        s.present,
        s.late,
        s.absent,
        s.excused,
        s.total,
        s.percent,
      ]),
    ];
    downloadCsv(`davomat-xulosa_${from}_${to}.csv`, toCsv(rows));
  }

  function csvDetailed() {
    const sById = new Map<string, SessionRow>(
      sessions.map((s) => [s.id, s] as [string, SessionRow])
    );
    const rows: (string | number)[][] = [['Sana', 'Fan', 'Talaba', 'Username', 'Holat']];
    records
      .slice()
      .sort((a, b) =>
        (sById.get(a.session_id)?.session_date || '').localeCompare(
          sById.get(b.session_id)?.session_date || ''
        )
      )
      .forEach((r) => {
        const s = sById.get(r.session_id);
        rows.push([
          s?.session_date || '',
          s?.subject || '',
          r.students?.full_name || '',
          r.students?.username || '',
          STATUS_LABEL[r.status],
        ]);
      });
    downloadCsv(`davomat-batafsil_${from}_${to}.csv`, toCsv(rows));
  }

  const input = 'w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm';

  return (
    <div className="p-4 pb-20 max-w-md mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-white">Hisobot</h1>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-400 space-y-1">
          Boshlanish
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </label>
        <label className="text-xs text-slate-400 space-y-1">
          Tugash
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} />
        </label>
      </div>
      <button
        onClick={load}
        disabled={loading}
        className="w-full bg-slate-800 border border-slate-700 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50"
      >
        {loading ? 'Yuklanmoqda...' : "Ko'rsatish"}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && !error && (
        <>
          <p className="text-slate-400 text-sm">
            Darslar: {sessions.length} · Yozuvlar: {records.length}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={csvSummary}
              disabled={!students.length}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              ⬇ CSV: xulosa
            </button>
            <button
              onClick={csvDetailed}
              disabled={!records.length}
              className="bg-slate-800 border border-slate-700 text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              ⬇ CSV: batafsil
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs text-left">
                  <th className="py-2 pr-2">Talaba</th>
                  <th className="px-1">K</th>
                  <th className="px-1">Kech</th>
                  <th className="px-1">Yo'q</th>
                  <th className="px-1">Sab</th>
                  <th className="pl-1">%</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((s) => (
                  <tr key={s.id} className="border-t border-slate-800 text-slate-200">
                    <td className="py-2 pr-2">{s.full_name}</td>
                    <td className="px-1">{s.present}</td>
                    <td className="px-1">{s.late}</td>
                    <td className="px-1">{s.absent}</td>
                    <td className="px-1">{s.excused}</td>
                    <td
                      className={
                        'pl-1 font-bold ' + (s.total && s.percent < 75 ? 'text-red-400' : 'text-green-400')
                      }
                    >
                      {s.total ? s.percent + '%' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-xs">
            K = keldi, Kech = kechikdi, Yo'q = kelmadi, Sab = sababli. Foiz = (keldi + kechikdi) / jami.
          </p>
        </>
      )}
    </div>
  );
}
