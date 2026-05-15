'use client';

import { useAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RWBaganPage() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-white tracking-tighter italic">Struktur <span className="text-emerald-400">Organisasi RW</span></h1>
          <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Hierarki Kepengurusan & Tata Kelola Wilayah</p>
        </header>

        <div className="flex flex-col items-center gap-12 py-10">
          {/* RW Level */}
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <div className="relative bg-slate-800/60 backdrop-blur-xl p-10 rounded-[40px] border border-emerald-500/30 text-center w-72 shadow-2xl">
              <div className="w-20 h-20 bg-emerald-600 rounded-3xl mx-auto mb-4 flex items-center justify-center text-3xl shadow-lg">👑</div>
              <h3 className="text-xl font-black text-white">Ketua RW {user.rw}</h3>
              <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-2">{user.nama}</p>
            </div>
            <div className="absolute left-1/2 -bottom-12 w-px h-12 bg-white/20"></div>
          </div>

          {/* Connectors */}
          <div className="relative w-full max-w-4xl h-px bg-white/20">
            <div className="absolute left-0 top-0 w-px h-12 bg-white/20"></div>
            <div className="absolute left-1/3 top-0 w-px h-12 bg-white/20"></div>
            <div className="absolute left-2/3 top-0 w-px h-12 bg-white/20"></div>
            <div className="absolute right-0 top-0 w-px h-12 bg-white/20"></div>
          </div>

          {/* RT Level */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl">
            {[1, 2, 3, 4].map((rt) => (
              <div key={rt} className="bg-slate-800/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 text-center hover:bg-white/5 transition-all">
                <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl mx-auto mb-3 flex items-center justify-center text-xl">🏠</div>
                <h4 className="text-sm font-black text-white">Ketua RT 0{rt}</h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Koordinator Unit</p>
              </div>
            ))}
          </div>

          {/* Info Card */}
          <div className="mt-20 max-w-2xl bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[40px] text-center">
             <p className="text-indigo-400 font-black uppercase tracking-[0.2em] text-[10px] mb-4">Informasi Struktur</p>
             <p className="text-slate-400 text-sm leading-relaxed">
               Bagan ini merepresentasikan hierarki resmi kepengurusan wilayah RW {user.rw}. Setiap Ketua RT bertanggung jawab langsung kepada Ketua RW dalam hal koordinasi administrasi dan pelayanan warga.
             </p>
          </div>
        </div>
      </main>
    </div>
  );
}
