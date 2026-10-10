'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/components/LanguageProvider';
import Avatar from '@/components/Avatar';
import Icon from '@/components/Icon';
import { PageTitle, Spinner } from '@/components/ui';

type S = { id: string; full_name: string; username: string; user_id: string | null; attendance_percentage: number };

export default function StudentsPage() {
  const { t } = useLang();
  const [list, setList] = useState<S[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    supabase
      .from('students')
      .select('id, full_name, username, user_id, attendance_percentage')
      .order('full_name')
      .then(({ data }) => setList((data as S[]) || []));
  }, []);

  if (!list) return <Spinner label={t('common.loading')} />;
  const f = q.trim().toLowerCase();
  const shown = list.filter((s) => !f || s.full_name.toLowerCase().includes(f) || s.username.toLowerCase().includes(f));

  return (
    <div className="space-y-4">
      <PageTitle title={t('stu.title')} subtitle={`${list.length}`} />
      <div className="relative">
        <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" />
        <input className="field pl-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('stu.search')} />
      </div>
      <div className="card divide-y divide-line overflow-hidden">
        {shown.map((s, i) => {
          const pct = Math.round(Number(s.attendance_percentage) || 0);
          const tone = pct >= 85 ? 'text-ok' : pct >= 60 ? 'text-warn' : 'text-bad';
          return (
            <div key={s.id} className="flex items-center gap-3 px-3.5 py-3">
              <span className="w-5 text-center text-xs text-muted">{i + 1}</span>
              <Avatar name={s.full_name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{s.full_name}</p>
                <p className="truncate text-xs text-muted">
                  {s.username}
                  {!s.user_id && ` · ${t('stu.noAccount')}`}
                </p>
              </div>
              <span className={'text-base font-bold ' + tone}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
