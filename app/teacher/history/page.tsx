'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_LABEL } from '@/lib/utils';

type Session = { id: string; subject: string; session_date: string; status: string };
type Rec = { session_id: string; status: Status; students: { full_name: string } | null };

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [records, setRecords] = useState<Rec[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: s, error: e } = await supabase
        .from('attendance_sessions')
        .select('id, subject, session_date, status')
        .order('created_at', { ascending: false })
        .limit(30);
      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      setSessions(s || []);
      const ids = (s || []).map((x) => x.id);
      if (ids.length) {
        const { data: r } = await supabase
          .from('attendance_records')
          .select('session_id, status, students(full_name)')
          .in('session_id', ids);
        setRecords((r as any) || []);
      }
      setLoading(false);
    })();
  }, []);

  const countFor = (sid: string, st: Status) =>
    records.filter((r) => r.session_id === sid && r.status === st).length;

  return (
    <div className="p-4 pb-16 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white">Tarix</h1>
      {loading && <p className="text-slate-400">Yuklanmoqda...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && sessions.length === 0 && !error && (
        <p className="text-slate-400">Hali darslar yo'q.</p>
      )}
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="bg-slate-800 border border-slate-700 rounded-xl">
            <button
              onClick={() => setOpen(open === s.id ? null : s.id)}
              className="w-full text-left p-3"
            >
              <div className="flex justify-between">
                <p className="text-white font-semibold">{s.subject}</p>
                <p className="text-slate-400 text-sm">{s.session_date}</p>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Keldi {countFor(s.id, 'present')} · Kech {countFor(s.id, 'late')} · Kelmadi{' '}
                {countFor(s.id, 'absent')} · Sababli {countFor(s.id, 'excused')}
                {s.status === 'active' ? ' · davom etmoqda' : ''}
              </p>
            </button>
            {open === s.id && (
              <div className="border-t border-slate-700 p-3 space-y-1">
                {records
                  .filter((r) => r.session_id === s.id)
                  .sort((a, b) =>
                    (a.students?.full_name || '').localeCompare(b.students?.full_name || '')
                  )
                  .map((r, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-300">{r.students?.full_name}</span>
                      <span className="text-slate-400">{STATUS_LABEL[r.status]}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
