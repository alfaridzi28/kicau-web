'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

// Dynamic import for Leaflet-based component
const PetaWarga = dynamic(() => import('@/components/PetaWarga'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-[10px]">Sinkronisasi Global Map...</div>
});

export default function LurahPetaPage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold uppercase tracking-widest">Loading Core...</div>;

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="p-8 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">Sistem Informasi <span className="text-indigo-400">Spasial</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">Visualisasi Sebaran Kependudukan & Titik Kesejahteraan</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Geo-Data Active</span>
             </div>
          </div>
        </header>
        <div className="flex-1 relative">
           <PetaWarga token={localStorage.getItem('token') || ""} />
        </div>
      </main>
    </div>
  );
}
