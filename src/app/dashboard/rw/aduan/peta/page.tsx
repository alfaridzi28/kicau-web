'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

const PetaAduan = dynamic(() => import('@/components/PetaAduan'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-[10px]">Mapping Complaints Data...</div>
});

export default function RWAduanPetaPage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto flex flex-col">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
             <h1 className="text-4xl font-black text-white tracking-tighter">Peta Lokasi Aduan</h1>
             <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-[10px]">Visualisasi Titik Laporan Warga Wilayah RW {user.rw}</p>
          </div>
          <div className="flex gap-4">
             <a href="/dashboard/rw/aduan" className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">List View →</a>
          </div>
        </header>

        <div className="flex-1 min-h-[600px] relative">
           <PetaAduan />
        </div>
      </main>
    </div>
  );
}
