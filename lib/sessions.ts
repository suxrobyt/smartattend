import { supabase } from '@/lib/supabase';

export type SessRow = { id: string; subject: string; session_date: string; status: string; created_at: string };

// Records of many sessions, fetched in small chunks (the API returns at most 1000 rows per call)
export async function fetchRecords<T = any>(ids: string[], select: string): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 20) {
    const { data, error } = await supabase.from('attendance_records').select(select).in('session_id', ids.slice(i, i + 20));
    if (error) throw error;
    out.push(...(((data as unknown) as T[]) || []));
  }
  return out;
}

// A lesson only counts once at least one student has been marked.
// Old empty lessons (left over from just tapping "Start") are removed from the database.
export function dropEmpty<S extends { id: string; created_at: string }>(sessions: S[], recs: { session_id: string }[]): S[] {
  const has = new Set(recs.map((r) => r.session_id));
  const kept: S[] = [];
  const stale: string[] = [];
  for (const s of sessions) {
    if (has.has(s.id)) kept.push(s);
    else if (Date.now() - new Date(s.created_at).getTime() > 10 * 60 * 1000) stale.push(s.id);
  }
  if (stale.length) {
    supabase
      .from('attendance_sessions')
      .delete()
      .in('id', stale)
      .then(() => {});
  }
  return kept;
}

// The "last lesson" of a day: the one that comes latest in the timetable
// (lessons not in the timetable count as earliest; ties go to the newest).
export function pickLast<S extends { subject: string; created_at: string }>(sessions: S[], pairOf: (subject: string) => number): S | undefined {
  return [...sessions].sort((a, b) => {
    const d = pairOf(b.subject) - pairOf(a.subject);
    return d !== 0 ? d : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  })[0];
}
