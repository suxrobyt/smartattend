'use client';


import { supabase } from '@/lib/supabase';
import { useQuery } from '@/lib/swr';
import { useMe } from '@/components/MeProvider';
import { Status, STATUS_SOFT, fmtDate } from '@/lib/utils';
import { subjectLabel } from '@/lib/schedule';
import { useLang } from '@/components/LanguageProvider';
import { Alert, Empty, PageTitle, Spinner } from '@/components/ui';

type Rec = { id: string; status: Status; attendance_sessions: { subject: string; session_date: string } | null };

export default function StudentHistory() {
  const { t, lang } = useLang();
  const { me } = useMe();
  const row = me?.row as { id: string } | undefined;
  const q = useQuery<Rec[]>(row ? 'st:hist:' + row.id : null, async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('id, status, attendance_sessions(subject, session_date)')
      .eq('student_id', row!.id);
    if (error) throw error;
    const list = ((data as any) || []) as Rec[];
    list.sort((a, b) => (b.attendance_sessions?.session_date || '').localeCompare(a.attendance_sessions?.session_date || ''));
    return list;
  });
  const rows = q.data || [];
  const error = q.error;

  if (me === undefined || (row && q.data === undefined && !error)) return <Spinner label={t('common.loading')} />;
  return (
    <div className="space-y-4">
      <PageTitle title={t('myhist.title')} />
      {error && <Alert kind="error">{error}</Alert>}
      {!error && rows.length === 0 && <Empty icon="history" text={t('myhist.empty')} />}
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="card flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold">{r.attendance_sessions ? subjectLabel(r.attendance_sessions.subject, lang) : '—'}</p>
              <p className="text-xs text-muted">{r.attendance_sessions ? fmtDate(r.attendance_sessions.session_date) : ''}</p>
            </div>
            <span className={'shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ' + STATUS_SOFT[r.status]}>{t('status.' + r.status)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
