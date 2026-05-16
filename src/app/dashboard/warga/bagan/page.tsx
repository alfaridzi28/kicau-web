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
      const data = await apiFetch(`/warga?rw=${user?.rw}&limit=1000`);
      setWarga(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchWarga();
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const clean = (s: any) => String(s || '').replace(/^0+/, '') || '0';
  
  const ketuaRw = warga.find(w => w.role === 'rw' && w.jabatan?.toLowerCase().includes('ketua'));
  const staffRw = warga.filter(w => w.role === 'rw' && !w.jabatan?.toLowerCase().includes('ketua'));
  
  // Group RTs: Map<RTNumber, {chair, staffs}>
  const rtGroups: Record<string, {chair: any, staffs: any[]}> = {};
  warga.forEach(w => {
    if (w.role === 'rt') {
      const num = clean(w.rt);
      if (!rtGroups[num]) rtGroups[num] = { chair: null, staffs: [] };
      rtGroups[num].staffs.push(w);
    }
  });

  // Pick chairs
  Object.keys(rtGroups).forEach(num => {
    const group = rtGroups[num];
    const chairIdx = group.staffs.findIndex(w => w.jabatan?.toLowerCase().includes('ketua'));
    if (chairIdx >= 0) {
       group.chair = group.staffs.splice(chairIdx, 1)[0];
    } else if (group.staffs.length > 0) {
       group.chair = group.staffs.shift(); // First one becomes chair
    }
  });

  const rtNumbers = Object.keys(rtGroups).sort((a,b) => parseInt(a) - parseInt(b));

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative min-w-0">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10"></div>
        
        <header className="mb-20 text-center animate-in fade-in slide-in-from-top duration-1000">
           <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">Bagan <span className="text-indigo-400">Organisasi</span></h1>
           <p className="text-slate-500 mt-3 font-bold uppercase tracking-[0.4em] text-[10px]">Struktur Pemerintahan Tingkat RW {user.rw} Kelurahan Lontar</p>
        </header>

        <div className="flex flex-col items-center pb-20">
           
           {/* LEVEL 1: KETUA RW */}
           <div className="relative mb-24 flex flex-col items-center">
              <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-2xl p-10 rounded-[48px] border-2 border-indigo-500/30 text-center w-full max-w-sm shadow-2xl hover:border-indigo-400 transition-all duration-500">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-xl shadow-indigo-900/40">👑</div>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase italic">{ketuaRw?.nama || 'Belum Terdata'}</h3>
                <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mt-3">{ketuaRw?.jabatan || `Ketua RW ${user.rw}`}</p>
                <div className="mt-4 pt-4 border-t border-white/5">
                   <p className="text-[10px] text-slate-500 font-mono italic">NIK: {ketuaRw?.nik || '...'}</p>
                </div>
              </div>
              
              {/* Vertical Connector Down */}
              <div className="absolute -bottom-24 w-px h-24 bg-gradient-to-b from-indigo-500 to-indigo-500/20"></div>
           </div>

           {/* LEVEL 2: STAFF RW (Symmetric Grid) */}
           {staffRw.length > 0 && (
             <div className="relative mb-24 flex flex-col items-center w-full">
                <div className="flex flex-wrap justify-center gap-8 relative">
                   {/* Horizontal Line Connecting Staff */}
                   <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 -z-10"></div>
                   
                   {staffRw.map(s => (
                     <div key={s.id} className="bg-slate-800/40 backdrop-blur-md border border-white/10 p-6 rounded-[32px] text-center w-full max-w-64 shadow-xl hover:-translate-y-1 transition-all">
                        <div className="w-10 h-10 bg-slate-700 rounded-xl mx-auto mb-4 flex items-center justify-center text-xl">👔</div>
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{s.nama}</h4>
                        <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-2">{s.jabatan || 'Tim Kerja RW'}</p>
                     </div>
                   ))}
                </div>
                {/* Vertical Connector Down to RTs */}
                <div className="w-px h-24 bg-gradient-to-b from-indigo-500/20 to-indigo-500/5 mt-24"></div>
             </div>
           )}

           {/* LEVEL 3: RT GRID */}
           <div className="w-full max-w-7xl">
              <div className="flex items-center gap-8 mb-16">
                 <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                 <h3 className="text-slate-500 font-black uppercase tracking-[0.5em] text-[10px] italic">Jajaran Pengurus Unit RT</h3>
                 <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
                 {rtNumbers.map(num => {
                   const group = rtGroups[num];
                   return (
                     <div key={num} className="flex flex-col bg-slate-800/20 rounded-[40px] border border-white/5 overflow-hidden group hover:bg-slate-800/40 transition-all duration-500">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-xl font-black text-indigo-400 border border-indigo-500/20">{num}</div>
                              <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ketua RT {num}</p>
                                 <h4 className="text-lg font-black text-white italic tracking-tight">{group.chair?.nama || 'Belum Terdata'}</h4>
                              </div>
                           </div>
                           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">➡️</div>
                        </div>
                        
                        {group.staffs.length > 0 && (
                          <div className="p-8 bg-black/20">
                             <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Staf & Pengurus RT</p>
                             <div className="grid grid-cols-1 gap-3">
                                {group.staffs.map(s => (
                                  <div key={s.id} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-colors">
                                     <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-sm">👤</div>
                                     <div>
                                        <p className="text-xs font-bold text-white leading-tight">{s.nama}</p>
                                        <p className="text-[8px] text-slate-500 font-black uppercase mt-0.5 tracking-tighter">{s.jabatan || 'Anggota Pengurus'}</p>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                        )}
                     </div>
                   );
                 })}
              </div>
           </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center">
             <div className="text-center">
                <div className="w-16 h-16 border-t-4 border-indigo-500 rounded-full animate-spin mx-auto mb-8"></div>
                <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-xs">Menyusun Struktur...</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

