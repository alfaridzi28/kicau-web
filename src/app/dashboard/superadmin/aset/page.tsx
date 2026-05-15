'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function SuperadminAsetPage() {
  const { user, isLoading, logout } = useAuth();
  const [aset, setAset] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRw, setFilterRw] = useState('');
  const [filterRt, setFilterRt] = useState('');

  const fetchAset = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filterRw) query.append('rw', filterRw);
      if (filterRt) query.append('rt', filterRt);
      
      const data = await apiFetch(`/aset?${query.toString()}`);
      setAset(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAset();
  }, [user, filterRw, filterRt]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter">Inventaris <span className="text-purple-400">Global</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Monitoring Seluruh Aset Wilayah Terintegrasi</p>
          </div>
          <div className="flex gap-4">
             <input 
               type="text" 
               placeholder="RW..." 
               className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs w-20 focus:ring-2 focus:ring-purple-500 outline-none"
               value={filterRw}
               onChange={(e) => setFilterRw(e.target.value)}
             />
             <input 
               type="text" 
               placeholder="RT..." 
               className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs w-20 focus:ring-2 focus:ring-purple-500 outline-none"
               value={filterRt}
               onChange={(e) => setFilterRt(e.target.value)}
             />
             <ExportButton 
               data={aset}
               filename="Aset_Global_KICAU"
               columns={[
                 { key: 'nama_aset', label: 'Nama Barang' },
                 { key: 'deskripsi', label: 'Deskripsi' },
                 { key: 'jumlah', label: 'Jumlah' },
                 { key: 'status', label: 'Status' },
                 { key: 'rt', label: 'RT' },
                 { key: 'rw', label: 'RW' },
                 { key: 'kepemilikan', label: 'Jenis' }
               ]}
               label="Download Master Data"
             />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500 animate-pulse font-black uppercase tracking-widest">Sinkronisasi Inventaris...</div>
          ) : aset.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-600 italic font-bold">Tidak ada aset terdata di wilayah ini.</div>
          ) : aset.map(item => (
            <div key={item.id} className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden group">
              <div className="h-40 bg-slate-900 relative">
                {item.foto ? (
                   <img src={item.foto} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                )}
                <div className="absolute top-3 left-3">
                   <span className="bg-purple-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-lg">RT {item.rt} / RW {item.rw}</span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
                    item.status === 'tersedia' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-black text-white truncate group-hover:text-purple-400 transition-colors mb-1">{item.nama_aset}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-4">{item.kepemilikan.replace('_', ' ')}</p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                   <span className="text-xs text-slate-400">Stok: <strong>{item.jumlah}</strong></span>
                   <button className="text-[10px] font-black text-purple-400 uppercase tracking-widest hover:underline">Kelola →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
