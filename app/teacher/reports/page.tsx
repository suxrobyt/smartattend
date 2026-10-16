'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Status, STATUS_ORDER, toCsv, downloadCsv, fmtDate } from '@/lib/utils';
import { subjectLabel } from '@/lib/schedule';
import { mySubjects } from '@/lib/teacher';
import { useMe } from '@/components/MeProvider';
import { useLang } from '@/components/LanguageProvider';
import Icon from '@/components/Icon';
import { Alert, PageTitle, Spinner } from '@/components/ui';

type SessionRow = { id: string; subject: string; session_date: string };
type RecRow = { session_id: string; student_id: string; status: Status; students: { full_name: string; username: string } | null };
type StudentRow = { id: string; full_name: string; username: string };

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString('en-CA');
}

export default function ReportsPage() {
  const { t, lang } = useLang();
  const { me } = useMe();
  const mine = mySubjects(me?.row); // a subject teacher gets reports for his/her own subjects only
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [records, setRecords] = useState<RecRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (me === undefined) return; // wait for the profile
    const f = daysAgo(30);
    const tt = daysAgo(0);
    setFrom(f);
    setTo(tt);
    load(f, tt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me === undefined]);

  async function load(f: string, tt: string) {
    setLoading(true);
    setError('');
    try {
      const { data: st } = await supabase.from('students').select('id, full_name, username').order('full_name');
      setStudents((st as StudentRow[]) || []);
      if (mine && mine.length === 0) {
        setSessions([]);
        setRecords([]);
        setLoading(false);
        return;
      }
      let sq = supabase
        .from('attendance_sessions')
        .select('id, subject, session_date')
        .gte('session_date', f)
        .lte('session_date', tt)
        .order('session_date', { ascending: true })
        .limit(500);
      if (mine) sq = sq.in('subject', mine);
      const { data: ss, error: se } = await sq;
      if (se) throw se;
      setSessions((ss as SessionRow[]) || []);
      const ids = (ss || []).map((s: any) => s.id);
      const all: RecRow[] = [];
      for (let i = 0; i < ids.length; i += 20) {
        const { data: rr, error: re } = await supabase
          .from('attendance_records')
          .select('session_id, student_id, status, students(full_name, username)')
          .in('session_id', ids.slice(i, i + 20));
        if (re) throw re;
        all.push(...((rr as any) || []));
      }
      setRecords(all);
    } catch (e: any) {
      setError(e.message || t('common.error'));
    }
    setLoading(false);
  }

  const summary = students.map((s) => {
    const mine = records.filter((r) => r.student_id === s.id);
    const c = (st: Status) => mine.filter((r) => r.status === st).length;
    const total = mine.length;
    return { ...s, present: c('present'), late: c('late'), absent: c('absent'), excused: c('excused'), total, percent: total ? Math.round(((c('present') + c('late')) / total) * 100) : 0 };
  });

  function csvSummary() {
    const rows: (string | number)[][] = [
      ['№', t('rep.student'), t('rep.login'), t('status.present'), t('status.late'), t('status.absent'), t('status.excused'), t('rep.total'), t('rep.percent')],
      ...summary.map((s, i) => [i + 1, s.full_name, s.username, s.present, s.late, s.absent, s.excused, s.total, s.percent]),
    ];
    downloadCsv(`davomat-xulosa_${from}_${to}.csv`, toCsv(rows));
  }

  function csvDetailed() {
    const byId = new Map<string, SessionRow>(sessions.map((s) => [s.id, s] as [string, SessionRow]));
    const rows: (string | number)[][] = [[t('rep.date'), t('rep.subject'), t('rep.student'), t('rep.login'), t('rep.status')]];
    records
      .slice()
      .sort((a, b) => (byId.get(a.session_id)?.session_date || '').localeCompare(byId.get(b.session_id)?.session_date || ''))
      .forEach((r) => {
        const s = byId.get(r.session_id);
        rows.push([s ? fmtDate(s.session_date) : '', s ? subjectLabel(s.subject, lang) : '', r.students?.full_name || '', r.students?.username || '', t('status.' + r.status)]);
      });
    downloadCsv(`davomat-batafsil_${from}_${to}.csv`, toCsv(rows));
  }

  return (
    <div className="space-y-4">
      <PageTitle title={t('rep.title')} />
      <div className="card space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{t('rep.from')}</label>
            <input type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('rep.to')}</label>
            <input type="date" className="field" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <button type="button" className="btn-soft w-full" onClick={() => load(from, to)} disabled={loading}>
          {t('common.search')}
        </button>
      </div>

      {error && <Alert kind="error">{error}</Alert>}
      {loading ? (
        <Spinner label={t('common.loading')} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4">
              <p className="eyebrow">{t('rep.lessons')}</p>
              <p className="mt-1 text-3xl font-bold">{sessions.length}</p>
            </div>
            <div className="card p-4">
              <p className="eyebrow">{t('rep.records')}</p>
              <p className="mt-1 text-3xl font-bold">{records.length}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="btn-primary" onClick={csvSummary}>
              <Icon name="download" className="h-[18px] w-[18px]" />
              {t('rep.csvSummary')}
            </button>
            <button type="button" className="btn-soft" onClick={csvDetailed}>
              <Icon name="download" className="h-[18px] w-[18px]" />
              {t('rep.csvDetailed')}
            </button>
          </div>
          <div className="card divide-y divide-line overflow-hidden">
            {summary.map((s) => {
              const tone = s.percent >= 85 ? 'text-ok' : s.percent >= 60 ? 'text-warn' : 'text-bad';
              return (
                <div key={s.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-[15px] font-semibold">{s.full_name}</p>
                    <span className={'text-base font-bold ' + tone}>{s.percent}%</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {STATUS_ORDER.map((st) => `${t('status.' + st)} ${(s as any)[st]}`).join(' · ')} · {t('rep.total')}: {s.total}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
