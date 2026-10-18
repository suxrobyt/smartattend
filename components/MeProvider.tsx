'use client';

import { createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@/lib/swr';
import { DEFAULT_GROUP } from '@/lib/schedule';

export type Student = {
  id: string;
  full_name: string;
  username: string;
  user_id: string | null;
  group_id: string | null;
  attendance_percentage: number;
};
export type Me = { userId: string; row: any } | null;

type Ctx = {
  me: Me | undefined; // undefined = still loading
  students: Student[] | undefined; // teacher only
  reloadStudents: () => Promise<void>;
  groupCode: string | undefined; // e.g. '9-26' or '7-26'; undefined = still loading
};

const MeContext = createContext<Ctx>({ me: undefined, students: undefined, reloadStudents: async () => {}, groupCode: undefined });

// Loaded once per role layout, so page changes inside the app are instant.
export function MeProvider({ role, children }: { role: 'teacher' | 'student'; children: React.ReactNode }) {
  const meQ = useQuery<Me>('me:' + role, async () => {
    // getSession reads the local cookie: no network round trip (unlike getUser)
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;
    const { data } = await supabase
      .from(role === 'teacher' ? 'teachers' : 'students')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    return { userId: session.user.id, row: data };
  });

  const stuQ = useQuery<Student[]>(role === 'teacher' ? 'students' : null, async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, username, user_id, group_id, attendance_percentage')
      .order('full_name');
    if (error) throw error;
    return (data as Student[]) || [];
  });

  // The user's group decides which timetable is shown (groups are readable by everyone)
  const grpQ = useQuery<{ id: string; code: string }[]>('groups', async () => {
    const { data, error } = await supabase.from('groups').select('id, code');
    if (error) throw error;
    return (data as { id: string; code: string }[]) || [];
  });

  const meVal: Me | undefined = meQ.loading ? undefined : meQ.data ?? null;
  const gid = meVal?.row?.group_id as string | undefined;
  let groupCode: string | undefined;
  if (meVal === undefined) groupCode = undefined;
  else if (!gid) groupCode = DEFAULT_GROUP;
  else if (grpQ.data) groupCode = grpQ.data.find((g) => g.id === gid)?.code ?? DEFAULT_GROUP;
  else groupCode = grpQ.error ? DEFAULT_GROUP : undefined;

  return (
    <MeContext.Provider value={{ me: meVal, students: stuQ.data, reloadStudents: stuQ.reload, groupCode }}>
      {children}
    </MeContext.Provider>
  );
}

export const useMe = () => useContext(MeContext);
