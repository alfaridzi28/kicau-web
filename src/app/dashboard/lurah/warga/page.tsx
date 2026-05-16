'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function LurahWargaPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterRT, setFilterRT] = useState('');
  const [filterRW, setFilterRW] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedWarga, setSelectedWarga] = useState<any>(null);
  const [rwList, setRwList] = useState<string[]>([]);
  const [rtList, setRtList] = useState<string[]>([]);

  const limit = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      // Ambil data warga dengan saringan lengkap
      const query = `/warga?rt=${filterRT}&rw=${filterRW}&search=${search}&skip=${skip}&limit=${limit}`;
      const res = await apiFetch(query);
      
      if (res && res.items) {
        setWarga(res.items);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error("Lurah Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (targetId: string, newRole: string) => {
    let rtValue = selectedWarga.rt;
    let rwValue = selectedWarga.rw;

    if (newRole === 'rt') {
      const num = prompt("Masukkan Nomor RT untuk jabatan baru ini (Contoh: 05):", rtValue || "");
      if (num === null) return;
      rtValue = num;
    } else if (newRole === 'rw') {
      const num = prompt("Masukkan Nomor RW untuk jabatan baru ini (Contoh: 02):", rwValue || "");
      if (num === null) return;
      rwValue = num;
    }

    if (!confirm(`Yakin ingin mengubah jabatan warga ini menjadi ${newRole.toUpperCase()} ${newRole === 'rt' ? 'RT ' + rtValue : newRole === 'rw' ? 'RW ' + rwValue : ''}?`)) return;
    
    try {
      const jabatanValue = (newRole === 'rt' || newRole === 'rw') ? `Ketua` : 'Warga Biasa';
      
      await apiFetch(`/warga/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          role: newRole,
          rt: rtValue,
          rw: rwValue,
          jabatan: jabatanValue
        })
      });
      alert(`Jabatan berhasil diperbarui menjadi ${jabatanValue}`);
      setSelectedWarga(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal mengubah jabatan");
    }
  };

  const fetchRegions = async () => {
    try {
      const data = await apiFetch('/stats/regions');
      setRwList(data.rw_list);
      setRtList(data.rt_list);
    } catch (err) {
      console.error("Gagal ambil wilayah:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      fetchRegions();
    }
  }, [user, filterRT, filterRW, search, page]);

  const totalPages = Math.ceil(total / limit);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">Database <span className="text-indigo-400">Kependudukan</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Total {total} Warga • Halaman {page} dari {totalPages || 1}</p>
          </div>
          <div className="flex gap-4">
             <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">🔍</span>
                <input 
                  type="text"
                  placeholder="Cari Nama atau NIK..."
                  className="bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all w-full md:w-64 md:w-80"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
             </div>
             <ExportButton 
               data={warga}
               filename={`Data_Warga_Kelurahan`}
               columns={[
                 { key: 'nama', label: 'Nama Lengkap' },
                 { key: 'nik', label: 'NIK' },
                 { key: 'rt', label: 'RT' },
                 { key: 'rw', label: 'RW' },
                 { key: 'alamat', label: 'Alamat' }
               ]}
               label="Export Halaman Ini"
             />
          </div>
        </header>

        <div className="flex gap-4 mb-8 bg-slate-800/40 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-slate-500 uppercase px-2">Filter RW:</label>
               <select className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" value={filterRW} onChange={e => { setFilterRW(e.target.value); setPage(1); }}>
                  <option value="">Semua RW</option>
                  {rwList.map(r => <option key={r} value={r}>RW {r}</option>)}
               </select>
            </div>
            <div className="flex items-center gap-3">
               <label className="text-[10px] font-black text-slate-500 uppercase px-2">Filter RT:</label>
               <select className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-xs text-white" value={filterRT} onChange={e => { setFilterRT(e.target.value); setPage(1); }}>
                  <option value="">Semua RT</option>
                  {rtList.map(r => <option key={r} value={r}>RT {r}</option>)}
               </select>
           </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl mb-8">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="p-6">Nama Lengkap</th>
                <th className="p-6">Identitas NIK</th>
                <th className="p-6">Wilayah</th>
                <th className="p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">MENGAMBIL DATA HALAMAN {page}...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-600 italic">Tidak ada data warga ditemukan.</td></tr>
              ) : warga.map((w) => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-6">
                    <p className="font-black text-white group-hover:text-indigo-400 transition-colors">{w.nama}</p>
                    <p className="text-[9px] text-slate-500 font-mono tracking-tighter italic">UID: {w.id.slice(0,8)}</p>
                  </td>
                  <td className="p-6 text-slate-400 font-mono text-xs">{w.nik}</td>
                  <td className="p-6 font-bold">RT {w.rt || '-'} / RW {w.rw || '-'}</td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => setSelectedWarga(w)}
                      className="text-indigo-400 hover:text-indigo-300 font-black text-[10px] uppercase tracking-widest border border-indigo-500/30 px-4 py-1.5 rounded-full hover:bg-indigo-500/10 transition"
                    >
                      Detail Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-8">
             <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-6 py-3 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 font-black text-xs uppercase transition-all border border-white/5">← Prev</button>
             <div className="flex gap-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                   <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${page === i + 1 ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>{i + 1}</button>
                ))}
             </div>
             <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-6 py-3 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 font-black text-xs uppercase transition-all border border-white/5">Next →</button>
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
                   <div className="relative -mt-16 mb-8 flex justify-between flex-wrap gap-y-4 items-end">
                      <div className="w-32 h-32 bg-slate-800 rounded-[40px] border-8 border-slate-900 overflow-hidden shadow-2xl">
                         {selectedWarga.foto ? (
                            <img src={selectedWarga.foto} className="w-full h-full object-cover" />
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
                         )}
                      </div>
                      <div className="flex gap-3 mb-4">
                         <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase">Kelurahan</span>
                         <span className="bg-slate-800 text-slate-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-white/5 uppercase font-mono">ID: {selectedWarga.id.slice(0,8)}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <div>
                            <h2 className="text-3xl font-black text-white tracking-tighter mb-1">{selectedWarga.nama}</h2>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">{selectedWarga.role?.toUpperCase() || 'Warga Biasa'}</p>
                         </div>
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Informasi Identitas</p>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                               <div className="flex justify-between flex-wrap gap-y-4 text-xs">
                                  <span className="text-slate-500">NIK:</span>
                                  <span className="text-white font-mono">{selectedWarga.nik || '-'}</span>
                               </div>
                               <div className="flex justify-between flex-wrap gap-y-4 text-xs">
                                  <span className="text-slate-500">No. KK:</span>
                                  <span className="text-white font-mono">{selectedWarga.nomor_kk || '-'}</span>
                               </div>
                            </div>
                         </div>
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Domisili</p>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                               <p className="text-xs text-white leading-relaxed">{selectedWarga.alamat || 'Alamat belum diisi'}</p>
                               <div className="mt-3 pt-3 border-t border-white/5 flex gap-4">
                                  <span className="text-[10px] font-black text-indigo-400 uppercase">RT {selectedWarga.rt || '-'}</span>
                                  <span className="text-[10px] font-black text-indigo-400 uppercase">RW {selectedWarga.rw || '-'}</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="space-y-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kontak</p>
                            <a href={`tel:${selectedWarga.no_telp}`} className="flex items-center gap-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 p-4 rounded-2xl transition-all group">
                               <span className="text-xl">📞</span>
                               <div>
                                  <p className="text-xs font-black text-emerald-400 group-hover:text-emerald-300">WhatsApp / Telp</p>
                                  <p className="text-sm font-bold text-white">{selectedWarga.no_telp || 'Tidak ada nomor'}</p>
                               </div>
                            </a>
                         </div>

                         <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Khusus</p>
                            <div className="flex flex-wrap gap-2">
                               {selectedWarga.is_miskin && <span className="bg-orange-500/10 text-orange-400 text-[9px] px-3 py-1.5 rounded-xl border border-orange-500/20 font-black uppercase">Miskin</span>}
                               {selectedWarga.is_fakir && <span className="bg-red-500/10 text-red-400 text-[9px] px-3 py-1.5 rounded-xl border border-red-500/20 font-black uppercase">Fakir</span>}
                               {selectedWarga.is_ibu_hamil && <span className="bg-pink-500/10 text-pink-400 text-[9px] px-3 py-1.5 rounded-xl border border-pink-500/20 font-black uppercase">Ibu Hamil</span>}
                               {selectedWarga.is_balita && <span className="bg-blue-500/10 text-blue-400 text-[9px] px-3 py-1.5 rounded-xl border border-blue-500/20 font-black uppercase">Balita</span>}
                            </div>
                         </div>

                         <div className="pt-6 border-t border-white/5 space-y-4">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Otoritas Lurah: Manajemen Jabatan</p>
                            <div className="flex flex-wrap gap-2">
                               {['warga', 'rt', 'rw'].map(r => (
                                  <button 
                                    key={r}
                                    onClick={() => handleRoleChange(selectedWarga.id, r)}
                                    disabled={selectedWarga.role === r}
                                    className={`flex-1 min-w-[80px] py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                      selectedWarga.role === r 
                                      ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400 cursor-not-allowed' 
                                      : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20'
                                    }`}
                                  >
                                     Set {r}
                                  </button>
                               ))}
                            </div>
                         </div>
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


