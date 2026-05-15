'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RWWargaPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterRt, setFilterRt] = useState('');
  const [page, setPage] = useState(1);
  const [selectedWarga, setSelectedWarga] = useState<any>(null);
  
  const limit = 10;

  const fetchWarga = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const data = await apiFetch(`/warga?rw=${user?.rw}&rt=${filterRt}&skip=${skip}&limit=${limit}`);
      setWarga(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchWarga();
  }, [user, filterRt, page]);

  const [allRts, setAllRts] = useState<string[]>([]);
  useEffect(() => {
    if (user) {
       apiFetch(`/warga?rw=${user.rw}&limit=1000`).then(res => {
          const rts = Array.from(new Set(res.items.map((w: any) => w.rt).filter(Boolean))).sort();
          setAllRts(rts as string[]);
       });
    }
  }, [user]);

  const totalPages = Math.ceil(total / limit);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
           <div>
              <h1 className="text-4xl font-black text-white tracking-tighter italic">Daftar Warga <span className="text-indigo-400">RW {user.rw}</span></h1>
              <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Total {total} Warga Terdaftar • Halaman {page} dari {totalPages || 1}</p>
           </div>

           <div className="bg-slate-800/40 p-2 rounded-2xl border border-white/5 flex items-center gap-4">
              <label className="text-[10px] font-black text-slate-500 uppercase px-3 tracking-widest">Unit RT:</label>
              <select 
                value={filterRt} 
                onChange={(e) => { setFilterRt(e.target.value); setPage(1); }}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                 <option value="">Semua RT</option>
                 {allRts.map(rt => (
                   <option key={rt} value={rt}>RT {rt}</option>
                 ))}
              </select>
           </div>
        </header>
        
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl mb-8">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                <th className="p-6">Nama / NIK</th>
                <th className="p-6">Wilayah</th>
                <th className="p-6">Status Sosial</th>
                <th className="p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center font-black animate-pulse text-slate-600 uppercase tracking-widest">Memuat Halaman {page}...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-500 italic font-bold">Tidak ada warga ditemukan.</td></tr>
              ) : warga.map((w) => (
                <tr key={w.id} className="hover:bg-white/5 transition-all border-b border-white/5 last:border-0 group">
                  <td className="p-6">
                    <p className="font-black text-white group-hover:text-indigo-400 transition-colors">{w.nama}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{w.nik}</p>
                  </td>
                  <td className="p-6">
                     <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-3 py-1 rounded-full border border-indigo-500/20 font-black uppercase">RT {w.rt}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex gap-2">
                       {w.is_miskin && <span className="bg-orange-500/10 text-orange-400 text-[9px] px-2 py-0.5 rounded-full border border-orange-500/20 font-black uppercase">Miskin</span>}
                       {w.is_fakir && <span className="bg-red-500/10 text-red-400 text-[9px] px-2 py-0.5 rounded-full border border-red-500/20 font-black uppercase">Fakir</span>}
                       {!w.is_miskin && !w.is_fakir && <span className="text-slate-600 text-[9px] font-bold uppercase tracking-tighter">✅ Normal</span>}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button onClick={() => setSelectedWarga(w)} className="bg-white/5 hover:bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-6 py-2 rounded-xl transition-all border border-white/5">Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-8">
             <button 
               onClick={() => setPage(p => Math.max(1, p - 1))}
               disabled={page === 1}
               className="p-4 rounded-2xl bg-slate-800 border border-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
             >
                ← Prev
             </button>
             <div className="flex gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                   <button 
                     key={i}
                     onClick={() => setPage(i + 1)}
                     className={`w-12 h-12 rounded-xl font-black text-xs transition-all ${
                       page === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-500 border border-white/5 hover:bg-white/10'
                     }`}
                   >
                      {i + 1}
                   </button>
                ))}
             </div>
             <button 
               onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               disabled={page === totalPages}
               className="p-4 rounded-2xl bg-slate-800 border border-white/5 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition-all"
             >
                Next →
             </button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedWarga && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
             <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-2xl overflow-hidden shadow-2xl">
                <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                   <button onClick={() => setSelectedWarga(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">✕</button>
                </div>
                <div className="px-12 pb-12">
                   <div className="relative -mt-16 mb-8 flex justify-between items-end">
                      <div className="w-32 h-32 bg-slate-800 rounded-[40px] border-8 border-slate-900 overflow-hidden shadow-2xl">
                         {selectedWarga.foto ? (
                            <img src={selectedWarga.foto} className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                         )}
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter mb-1">{selectedWarga.nama}</h2>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">{selectedWarga.jabatan || 'Warga Biasa'}</p>
                         </div>
                         <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex justify-between text-xs text-slate-400"><span>NIK:</span> <span className="text-white font-mono">{selectedWarga.nik}</span></div>
                            <div className="flex justify-between text-xs text-slate-400"><span>RT:</span> <span className="text-white font-black">{selectedWarga.rt}</span></div>
                            <div className="flex justify-between text-xs text-slate-400"><span>No. Telp:</span> <span className="text-white">{selectedWarga.no_telp || '-'}</span></div>
                         </div>
                      </div>
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                         <p className="text-[10px] font-black text-slate-500 uppercase mb-4">Alamat</p>
                         <p className="text-xs text-white leading-relaxed">{selectedWarga.alamat || 'Alamat belum diatur'}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
