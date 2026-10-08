'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AppHeader({ home }: { home: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === home;

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      {isHome ? (
        <span className="font-bold text-white">SmartAttend</span>
      ) : (
        <Link href={home} className="text-blue-400 font-semibold">
          ← Bosh sahifa
        </Link>
      )}
      <button
        onClick={logout}
        className="text-sm text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5"
      >
        Chiqish
      </button>
    </header>
  );
}
