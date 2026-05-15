'use client';

import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import dynamic from 'next/dynamic';

const PetaWarga = dynamic(() => import('@/components/PetaWarga'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-[10px]">Sinkronisasi Global Map...</div>
});

export default function SuperadminPetaPage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 flex flex-col">
        <header className="p-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-md">
           <h1 className="text-3xl font-black text-white tracking-tighter">Peta Sebaran Global</h1>
           <p className="text-slate-400 text-xs uppercase tracking-widest font-bold mt-1">Monitoring Spasial Seluruh Wilayah</p>
        </header>
        <div className="flex-1 relative">
           <PetaWarga token={localStorage.getItem('token') || ""} />
        </div>
      </main>
    </div>
  );
}
