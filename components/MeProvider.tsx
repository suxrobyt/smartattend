'use client';

import { createContext, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@/lib/swr';

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
};

const MeContext = createContext<Ctx>({ me: undefined, students: undefined, reloadStudents: async () => {} });

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

  return (
    <MeContext.Provider value={{ me: meQ.loading ? undefined : meQ.data ?? null, students: stuQ.data, reloadStudents: stuQ.reload }}>
      {children}
    </MeContext.Provider>
  );
}

export const useMe = () => useContext(MeContext);
