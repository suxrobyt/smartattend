'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useLogout() {
  const router = useRouter();
  return async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };
}
