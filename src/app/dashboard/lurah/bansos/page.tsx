'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';

export default function LurahBansosPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterRT, setFilterRT] = useState('');
  const [filterRW, setFilterRW] = useState('');
  const [filterCategory, setFilterCategory] = useState(''); // New: Category filter
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rwList, setRwList] = useState<string[]>([]);
  const [rtList, setRtList] = useState<string[]>([]);

  const limit = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      let url = `/warga?bansos=true&rt=${filterRT}&rw=${filterRW}&search=${search}&skip=${skip}&limit=${limit}`;
      
      // Add category filter if selected
      if (filterCategory) {
        url += `&${filterCategory}=true`;
      }
      
      const data = await apiFetch(url);
      
      // Process items for clean export and display
      const processedItems = data.items.map((w: any) => {
        const cats = [];
        if (w.is_fakir) cats.push('Fakir');
        if (w.is_miskin) cats.push('Miskin');
        if (w.is_ibu_hamil) cats.push('Ibu Hamil');
        if (w.is_balita) cats.push('Balita');
        return { 
          ...w, 
          kategori_label: cats.join(', ') || '-',
          // Add sorting priority
          _priority: w.is_fakir ? 1 : w.is_miskin ? 2 : w.is_ibu_hamil ? 3 : 4
        };
      });

      // Sort by priority if it's a global view
      if (!filterCategory) {
        processedItems.sort((a: any, b: any) => a._priority - b._priority);
      }

      setWarga(processedItems);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const data = await apiFetch('/stats/regions');
      setRwList(data.rw_list);
      setRtList(data.rt_list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      fetchRegions();
    }
  }, [user, filterRT, filterRW, filterCategory, search, page]);

  const totalPages = Math.ceil(total / limit);

  const getCategoryLabel = () => {
    if (filterCategory === 'is_fakir') return 'Fakir';
    if (filterCategory === 'is_miskin') return 'Miskin';
    if (filterCategory === 'is_ibu_hamil') return 'Ibu_Hamil';
    if (filterCategory === 'is_balita') return 'Balita';
    return 'Global';
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex-1">
            <h1 className="text-4xl font-black text-white tracking-tighter italic decoration-indigo-500">Monitoring <span className="text-indigo-400">Bansos</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">DTKS Kelurahan • {total} Jiwa {filterCategory ? `Kategori ${getCategoryLabel()}` : 'Terdata'}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                <input 
                  type="text"
                  placeholder="Cari Nama/NIK..."
                  className="bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 w-full md:w-64 transition-all"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
             </div>

             <div className="flex items-center gap-2 bg-slate-800/40 p-2 rounded-2xl border border-white/5 shadow-lg">
                <select className="bg-transparent border-none text-xs font-black text-slate-400 uppercase outline-none px-2 cursor-pointer" value={filterRW} onChange={e => { setFilterRW(e.target.value); setPage(1); }}>
                   <option value="">Semua RW</option>
                   {rwList.map(r => <option key={r} value={r}>RW {r}</option>)}
                </select>
                <div className="w-px h-4 bg-white/10"></div>
                <select className="bg-transparent border-none text-xs font-black text-slate-400 uppercase outline-none px-2 cursor-pointer" value={filterRT} onChange={e => { setFilterRT(e.target.value); setPage(1); }}>
                   <option value="">Semua RT</option>
                   {rtList.map(r => <option key={r} value={r}>RT {r}</option>)}
                </select>
             </div>

             <ExportButton 
               filename={`Bansos_${getCategoryLabel()}_Kelurahan`}
               columns={[
                 { key: 'nama', label: 'Nama Warga' },
                 { key: 'nik', label: 'NIK' },
                 { key: 'rt', label: 'RT' },
                 { key: 'rw', label: 'RW' },
                 { key: 'kategori_label', label: 'Status / Kategori' },
                 { key: 'alamat', label: 'Alamat Lengkap' }
               ]}
               label={`Export ${getCategoryLabel()}`}
               sheets={!filterCategory ? [
                 { name: 'Fakir', data: warga.filter(w => w.is_fakir) },
                 { name: 'Miskin', data: warga.filter(w => w.is_miskin) },
                 { name: 'Ibu Hamil', data: warga.filter(w => w.is_ibu_hamil) },
                 { name: 'Balita', data: warga.filter(w => w.is_balita) },
               ] : undefined}
               data={filterCategory ? warga : undefined}
             />
          </div>
        </header>

        {/* Category Navigation Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-800/40 p-1.5 rounded-[24px] border border-white/5 w-fit">
           {[
             { id: '', label: 'Semua Data', icon: '📋' },
             { id: 'is_fakir', label: 'Fakir', icon: '🔴' },
             { id: 'is_miskin', label: 'Miskin', icon: '🟠' },
             { id: 'is_ibu_hamil', label: 'Ibu Hamil', icon: '💗' },
             { id: 'is_balita', label: 'Anak Balita', icon: '👶' },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => { setFilterCategory(tab.id); setPage(1); }}
               className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 filterCategory === tab.id 
                 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40 scale-105' 
                 : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
               }`}
             >
                <span>{tab.icon}</span>
                {tab.label}
             </button>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-in fade-in slide-in-from-bottom duration-500">
          <StatCard title="Fakir" value={warga.filter(w => w.is_fakir).length} icon="🔴" color="red" subtitle="Kondisi Kritis" />
          <StatCard title="Miskin" value={warga.filter(w => w.is_miskin).length} icon="🟠" color="orange" subtitle="Pra Sejahtera" />
          <StatCard title="Ibu Hamil" value={warga.filter(w => w.is_ibu_hamil).length} icon="💗" color="purple" subtitle="Prioritas Gizi" />
          <StatCard title="Anak Balita" value={warga.filter(w => w.is_balita).length} icon="👶" color="cyan" subtitle="Cegah Stunting" />
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="p-6">Identitas Warga</th>
                <th className="p-6">Wilayah</th>
                <th className="p-6">Kategori Bantuan</th>
                <th className="p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">MENGAMBIL DATA STRATEGIS...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-600 italic font-bold">Tidak ada data penerima bansos ditemukan.</td></tr>
              ) : warga.map(w => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-6">
                    <p className="font-black text-white group-hover:text-indigo-400 transition-colors">{w.nama}</p>
                    <p className="text-[10px] text-slate-500 font-mono italic">{w.nik}</p>
                  </td>
                  <td className="p-6">
                    <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase">RT {w.rt} / RW {w.rw}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${
                        w.is_fakir ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        w.is_miskin ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        w.is_ibu_hamil ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                        'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      }`}>
                        {w.kategori_label}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">Detail Verifikasi</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-10 animate-in fade-in duration-1000">
             <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-6 py-3 rounded-2xl bg-slate-800 text-white disabled:opacity-20 hover:bg-slate-700 font-black text-[10px] uppercase transition-all border border-white/5">← Prev</button>
             <div className="flex gap-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                   <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${page === i + 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>{i + 1}</button>
                ))}
             </div>
             <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-6 py-3 rounded-2xl bg-slate-800 text-white disabled:opacity-20 hover:bg-slate-700 font-black text-[10px] uppercase transition-all border border-white/5">Next →</button>
          </div>
        )}
      </main>
    </div>
  );
}

