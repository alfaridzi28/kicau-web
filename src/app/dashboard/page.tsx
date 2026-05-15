'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

const ROLE_TO_ROUTE: Record<string, string> = {
  superadmin: '/dashboard/superadmin',
  lurah: '/dashboard/lurah',
  staff: '/dashboard/lurah',
  rw: '/dashboard/rw',
  rt: '/dashboard/rt',
  warga: '/dashboard/warga',
};

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        const role = user.effective_role || user.role;
        const route = ROLE_TO_ROUTE[role] || '/dashboard/warga';
        router.push(route);
      } else {
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-bold text-white">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-indigo-300">Menuju Dashboard...</p>
    </div>
  );
}
