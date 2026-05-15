'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

const PetaAduan = dynamic(() => import('@/components/PetaAduan'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500">Memuat Peta Aduan...</div>
});

export default function AduanPetaPage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 flex flex-col">
        <header className="p-6 border-b border-white/5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Peta Sebaran Aduan</h1>
            <p className="text-slate-400 text-sm mt-1">Pantau lokasi permasalahan di wilayah Anda secara real-time</p>
          </div>
          <div className="flex gap-4 text-[10px] font-bold uppercase">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400" /> Belum Dibaca</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Diproses</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Selesai</span>
          </div>
        </header>
        <div className="flex-1 p-6 relative">
           <PetaAduan />
        </div>
      </main>
    </div>
  );
}
