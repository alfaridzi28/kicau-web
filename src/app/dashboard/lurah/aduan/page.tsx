'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function LurahAduanPage() {
  const { user, isLoading, logout } = useAuth();
  const [aduan, setAduan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRT, setFilterRT] = useState('');
  const [filterRW, setFilterRW] = useState('');

  const fetchAduan = async () => {
    setLoading(true);
    try {
      let url = '/aduan?';
      if (filterRT) url += `rt=${filterRT}&`;
      if (filterRW) url += `rw=${filterRW}&`;
      
      const data = await apiFetch(url);
      setAduan(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAduan();
    }
  }, [user, filterRT, filterRW]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex justify-between flex-wrap gap-y-4 items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Aduan Warga</h1>
            <p className="text-slate-400">Monitoring keluhan masyarakat di seluruh wilayah</p>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">RW</label>
              <select 
                className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={filterRW}
                onChange={(e) => setFilterRW(e.target.value)}
              >
                <option value="">Semua RW</option>
                {['01', '02', '03', '04', '05'].map(rw => <option key={rw} value={rw}>RW {rw}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">RT</label>
              <select 
                className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                value={filterRT}
                onChange={(e) => setFilterRT(e.target.value)}
              >
                <option value="">Semua RT</option>
                {['01', '02', '03', '04', '05'].map(rt => <option key={rt} value={rt}>RT {rt}</option>)}
              </select>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500">Memuat data aduan...</div>
          ) : aduan.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 italic">Tidak ada aduan ditemukan untuk wilayah ini.</div>
          ) : aduan.map((item) => (
            <div key={item.id} className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all group">
              <div className="flex justify-between flex-wrap gap-y-4 items-start mb-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  item.status === 'selesai' ? 'bg-emerald-500/20 text-emerald-400' :
                  item.status === 'diproses' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
                <p className="text-[10px] text-slate-500 font-medium">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">{item.judul}</h3>
              <p className="text-sm text-slate-400 line-clamp-2 mb-4">{item.isi}</p>
              
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px] text-indigo-400 font-bold">
                    {item.user?.nama?.charAt(0) || 'W'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300">{item.user?.nama || 'Warga'}</p>
                    <p className="text-[10px] text-slate-500">RT {item.user?.rt} / RW {item.user?.rw}</p>
                  </div>
                </div>
                <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Lihat Detail →</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

