'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Row = {
  id: string;
  full_name: string;
  username: string;
  attendance_percentage: number | null;
};

export default function StudentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: e } = await supabase
        .from('students')
        .select('id, full_name, username, attendance_percentage')
        .order('full_name');
      if (e) setError(e.message);
      setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-4 pb-16 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white">Talabalar ({rows.length})</h1>
      {loading && <p className="text-slate-400">Yuklanmoqda...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={r.id}
            className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl p-3"
          >
            <div className="pr-3">
              <p className="text-white text-sm font-medium">
                {i + 1}. {r.full_name}
              </p>
              <p className="text-slate-500 text-xs">{r.username}</p>
            </div>
            <p className="text-blue-400 font-bold whitespace-nowrap">
              {Math.round(Number(r.attendance_percentage || 0))}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
