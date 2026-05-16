'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';

export default function RWWargaPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterRT, setFilterRT] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ miskin: 0, hamil: 0, balita: 0 });
  const [rtList, setRtList] = useState<string[]>([]);

  const limit = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      // RW filters across all its RTs
      const endpoint = `/warga?rw=${user?.rw}&rt=${filterRT}&search=${search}&skip=${skip}&limit=${limit}`;
      const res = await apiFetch(endpoint);
      setWarga(res.items || []);
      setTotal(res.total || 0);

      // Fetch global stats for this RW
      const allRes = await apiFetch(`/warga?rw=${user?.rw}&limit=2000`);
      const allItems = allRes.items || [];
      setStats({
        miskin: allItems.filter((w: any) => w.is_miskin || w.is_fakir).length,
        hamil: allItems.filter((w: any) => w.is_ibu_hamil).length,
        balita: allItems.filter((w: any) => w.is_balita).length
      });

      // Extract unique RT list for filtering
      const rts = Array.from(new Set(allItems.map((w: any) => w.rt))).filter(Boolean).sort();
      setRtList(rts as string[]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, page, search, filterRT]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10"></div>

        <header className="mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Database <span className="text-indigo-400">Warga RW {user.rw}</span></h1>
               <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-4 py-1 rounded-full uppercase border border-indigo-500/30 tracking-widest">Wilayah Kerja Terpadu</span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Monitoring Kependudukan Lintas RT • Statistik Kesejahteraan</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">🔍</span>
                <input 
                  type="text" 
                  placeholder="Cari Nama atau NIK..." 
                  className="bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 w-full md:w-64 transition-all shadow-inner"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>

             <ExportButton 
               data={warga}
               filename={`Data_Warga_RW${user.rw}`}
               columns={[
                 { key: 'nama', label: 'Nama' },
                 { key: 'nik', label: 'NIK' },
                 { key: 'rt', label: 'RT' },
                 { key: 'nomor_kk', label: 'No. KK' },
                 { key: 'alamat', label: 'Alamat' }
               ]}
               label="Export XLSX"
             />
          </div>
        </header>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom duration-500">
           <StatCard title="Total Warga RW" value={total} icon="🏢" color="indigo" subtitle="Seluruh Warga di RW" />
           <StatCard title="Kurang Mampu" value={stats.miskin} icon="🆘" color="red" subtitle="Bantuan Diperlukan" />
           <StatCard title="Ibu Hamil" value={stats.hamil} icon="🤰" color="pink" subtitle="Kesehatan Ibu" />
           <StatCard title="Balita" value={stats.balita} icon="👶" color="cyan" subtitle="Kesehatan Anak" />
        </div>

        {/* RT Filter & List */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-slate-800/40 p-6 rounded-[32px] border border-white/5 backdrop-blur-xl items-center">
           <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">Saring Per RT:</label>
               <select className="bg-slate-900 border border-white/10 rounded-xl px-6 py-2.5 text-xs text-white font-bold outline-none focus:border-indigo-500 transition-all" value={filterRT} onChange={e => { setFilterRT(e.target.value); setPage(1); }}>
                  <option value="">Semua RT di RW {user.rw}</option>
                  {rtList.map(r => <option key={r} value={r}>RT {r}</option>)}
               </select>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block"></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Menampilkan {warga.length} dari {total} Warga</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl mb-8">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">
              <tr>
                <th className="p-8">Profil Warga</th>
                <th className="p-8">Wilayah RT</th>
                <th className="p-8">Status Sosial</th>
                <th className="p-8 text-right">Informasi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">Sinkronisasi Database Wilayah RW...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-600 italic font-bold uppercase tracking-widest">Data warga tidak ditemukan.</td></tr>
              ) : warga.map(w => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-xl shadow-inner">
                          {w.foto ? <img src={w.foto} className="w-full h-full rounded-full object-cover" /> : "👤"}
                       </div>
                       <div>
                          <p className="font-black text-white group-hover:text-indigo-400 transition-colors text-base uppercase tracking-tight">{w.nama}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tighter italic">NIK: {w.nik}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex flex-col">
                       <span className="text-indigo-400 font-black text-xs uppercase tracking-widest">RT {w.rt || '-'}</span>
                       <span className="text-[10px] text-slate-500 line-clamp-1 italic">{w.alamat || 'Alamat tidak diatur'}</span>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex flex-wrap gap-2">
                      {w.is_fakir && <span className="bg-red-500/10 text-red-400 text-[8px] px-2 py-1 rounded-lg border border-red-500/20 font-black uppercase">Fakir</span>}
                      {w.is_miskin && <span className="bg-orange-500/10 text-orange-400 text-[8px] px-2 py-1 rounded-lg border border-orange-500/20 font-black uppercase">Miskin</span>}
                      {w.is_ibu_hamil && <span className="bg-pink-500/10 text-pink-400 text-[8px] px-2 py-1 rounded-lg border border-pink-500/20 font-black uppercase">Hamil</span>}
                      {w.is_balita && <span className="bg-blue-500/10 text-blue-400 text-[8px] px-2 py-1 rounded-lg border border-blue-500/20 font-black uppercase">Balita</span>}
                    </div>
                  </td>
                  <td className="p-8 text-right">
                     <span className="bg-white/5 text-slate-400 text-[9px] font-black px-4 py-2 rounded-xl border border-white/5 uppercase tracking-widest">Terverifikasi</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {total > limit && (
            <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Halaman {page} dari {Math.ceil(total / limit)}</p>
              <div className="flex gap-3">
                 <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-6 py-2.5 rounded-xl bg-slate-800 text-white disabled:opacity-20 font-black text-[10px] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ">Sebelumnya</button>
                 <button onClick={() => setPage(p => Math.min(Math.ceil(total/limit), p + 1))} disabled={page === Math.ceil(total/limit)} className="px-6 py-2.5 rounded-xl bg-slate-800 text-white disabled:opacity-20 font-black text-[10px] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ">Berikutnya</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


