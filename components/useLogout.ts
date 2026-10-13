'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { clearCache } from '@/lib/swr';

export const LOGOUT_ASK_EVENT = 'sa:logout-ask';

// Shows the "are you sure?" dialog (rendered by AppShell)
export function askLogout() {
  window.dispatchEvent(new Event(LOGOUT_ASK_EVENT));
}

// Signs out immediately (used after the confirmation)
export function useSignOut() {
  const router = useRouter();
  return async () => {
    await supabase.auth.signOut();
    clearCache();
    router.push('/auth/login');
    router.refresh();
  };
}
