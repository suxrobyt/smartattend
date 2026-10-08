'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_LABEL, STATUS_COLOR } from '@/lib/utils';

type Rec = { id: string; status: Status; created_at: string };

export default function StudentHistory() {
  const [rows, setRows] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: me } = await supabase
        .from('students')
        .select('id')
        .single();
      if (!me) {
        setLoading(false);
        return;
      }
      const { data, error: e } = await supabase
        .from('attendance_records')
        .select('id, status, created_at')
        .eq('student_id', me.id)
        .order('created_at', { ascending: false });
      if (e) setError(e.message);
      setRows((data as Rec[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-4 pb-16 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white">Davomat tarixi</h1>
      {loading && <p className="text-slate-400">Yuklanmoqda...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && rows.length === 0 && !error && (
        <p className="text-slate-400">Hali yozuvlar yo'q.</p>
      )}
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex justify-between items-center bg-slate-800 border border-slate-700 rounded-xl p-3"
          >
            <span className="text-slate-300 text-sm">
              {new Date(r.created_at).toLocaleString('uz-UZ', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </span>
            <span className={'text-xs font-semibold px-2.5 py-1 rounded-lg border ' + STATUS_COLOR[r.status]}>
              {STATUS_LABEL[r.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
