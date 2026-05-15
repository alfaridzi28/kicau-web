'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function WargaBaganPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWarga = async () => {
    setLoading(true);
    try {
      // Fetch administrative users with large limit for complete mapping
      const data = await apiFetch(`/warga?rw=${user?.rw}&limit=1000`);
      const items = data.items || [];
      setWarga(items.filter((w: any) => w.role !== 'warga'));
    } catch (err) {
      console.error(err);
      setWarga([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchWarga();
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const ketuaRw = warga.find(w => w.role === 'rw');
  const staffRw = warga.filter(w => w.role === 'staff' && !w.rt);
  const rtNumbers = Array.from(new Set(warga.filter(w => w.role === 'rt').map(w => w.rt).filter(Boolean))).sort((a,b) => parseInt(a) - parseInt(b));

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-12 text-center">
           <h1 className="text-4xl font-black text-white tracking-tighter italic">Struktur <span className="text-blue-400">Kepengurusan RW {user.rw}</span></h1>
           <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">Mengenal Pelayan Masyarakat di Lingkungan Anda</p>
        </header>

        <div className="flex flex-col items-center gap-20 py-10">
           {/* TIER 1: RW LEADERSHIP */}
           <div className="flex flex-col items-center gap-10 w-full">
              {/* Ketua RW */}
              <div className="relative">
                 <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20"></div>
                 <div className="relative bg-slate-800/80 backdrop-blur-xl p-10 rounded-[40px] border border-blue-500/30 text-center w-80 shadow-2xl">
                   <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">👑</div>
                   <h3 className="text-xl font-black text-white">Ketua RW {user.rw}</h3>
                   <p className="text-blue-400 text-xs font-black uppercase tracking-widest mt-2">{ketuaRw?.nama || 'Belum Ditunjuk'}</p>
                 </div>
              </div>

              {/* Staff RW */}
              {staffRw.length > 0 && (
                <div className="flex flex-wrap justify-center gap-6">
                   {staffRw.map(s => (
                     <div key={s.id} className="bg-slate-800/40 border border-white/5 p-4 rounded-3xl text-center w-48">
                        <div className="w-8 h-8 bg-slate-700 rounded-lg mx-auto mb-2 flex items-center justify-center text-sm">📋</div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tim Kerja RW</p>
                        <p className="text-xs font-bold text-white">{s.nama}</p>
                     </div>
                   ))}
                </div>
              )}
              <div className="w-px h-20 bg-gradient-to-b from-white/10 to-transparent"></div>
           </div>

           {/* TIER 2: RT LEADERSHIP GRID */}
           <div className="w-full max-w-7xl">
              <h3 className="text-center text-slate-500 font-black uppercase tracking-[0.4em] text-xs mb-16 italic">Jajaran Pengurus Unit RT</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                 {rtNumbers.map(num => {
                   const chair = warga.find(w => w.role === 'rt' && w.rt === num);
                   const staffs = warga.filter(w => w.role === 'staff' && w.rt === num);
                   return (
                     <div key={num} className="flex flex-col items-center">
                        <div className="bg-slate-800/60 p-6 rounded-[32px] border border-indigo-500/20 w-full relative shadow-xl">
                           <div className="absolute -top-4 left-6 w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-sm font-black text-white shadow-lg">{num}</div>
                           <h4 className="text-[10px] font-black text-slate-500 uppercase mt-2 mb-1">Ketua RT {num}</h4>
                           <p className="text-sm font-black text-white">{chair?.nama || '-'}</p>
                        </div>
                        
                        {/* Staff RT Connectors */}
                        {staffs.length > 0 && (
                          <div className="flex flex-col items-center w-full mt-4 gap-2">
                             {staffs.map(s => (
                               <div key={s.id} className="w-4/5 bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                                  <div className="w-5 h-5 bg-slate-700 rounded-md flex items-center justify-center text-[8px]">📋</div>
                                  <p className="text-[10px] text-slate-300 font-medium truncate">{s.nama}</p>
                               </div>
                             ))}
                          </div>
                        )}
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>

        {loading && (
          <div className="text-center py-20 animate-pulse text-slate-500 font-black uppercase tracking-widest">Menyusun Struktur Wilayah...</div>
        )}
      </main>
    </div>
  );
}
