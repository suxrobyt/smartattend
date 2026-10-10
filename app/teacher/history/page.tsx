'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_ORDER, STATUS_SOFT, fmtDate } from '@/lib/utils';
import { subjectLabel } from '@/lib/schedule';
import { useLang } from '@/components/LanguageProvider';
import Icon from '@/components/Icon';
import { Alert, Empty, PageTitle, Spinner } from '@/components/ui';

type Sess = { id: string; subject: string; session_date: string; status: string };
type Rec = { session_id: string; status: Status; students: { full_name: string } | null };

export default function HistoryPage() {
  const { t, lang } = useLang();
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [records, setRecords] = useState<Rec[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: s, error: e } = await supabase
        .from('attendance_sessions')
        .select('id, subject, session_date, status')
        .order('session_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(40);
      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      setSessions((s as Sess[]) || []);
      const ids = (s || []).map((x: any) => x.id);
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

  const countFor = (sid: string, st: Status) => records.filter((r) => r.session_id === sid && r.status === st).length;

  if (loading) return <Spinner label={t('common.loading')} />;

  return (
    <div className="space-y-4">
      <PageTitle title={t('hist.title')} />
      {error && <Alert kind="error">{error}</Alert>}
      {!error && sessions.length === 0 && <Empty icon="history" text={t('hist.empty')} />}
      <div className="space-y-2.5">
        {sessions.map((s) => {
          const isOpen = open === s.id;
          const recs = records.filter((r) => r.session_id === s.id).sort((a, b) => (a.students?.full_name || '').localeCompare(b.students?.full_name || ''));
          return (
            <div key={s.id} className="card overflow-hidden">
              <button type="button" onClick={() => setOpen(isOpen ? null : s.id)} className="w-full px-4 py-3.5 text-left">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-semibold leading-snug">{subjectLabel(s.subject, lang)}</p>
                  <span className="shrink-0 text-xs text-muted">{fmtDate(s.session_date)}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {STATUS_ORDER.map((st) => (
                    <span key={st} className={'rounded-full border px-2 py-0.5 text-xs font-medium ' + STATUS_SOFT[st]}>
                      {t('status.' + st)} {countFor(s.id, st)}
                    </span>
                  ))}
                  {s.status === 'active' && <span className="chip !border-warn/30 !text-warn">{t('hist.active')}</span>}
                </div>
              </button>
              {isOpen && (
                <div className="divide-y divide-line border-t border-line bg-surface-2/40">
                  {recs.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="truncate">{r.students?.full_name}</span>
                      <span className={'shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ' + STATUS_SOFT[r.status]}>{t('status.' + r.status)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
