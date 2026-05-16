'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';

export default function LurahAsetPage() {
  const { user, isLoading, logout } = useAuth();
  const [aset, setAset] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // New: Status filter
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAset, setSelectedAset] = useState<any>(null);
  
  // Stats
  const [stats, setStats] = useState({ baik: 0, rusak: 0 });

  const [formAset, setFormAset] = useState({
    nama_aset: '',
    deskripsi: '',
    jumlah: 1,
    kepemilikan: 'aset_kelurahan',
    status: 'tersedia',
    foto: ''
  });

  const [uploading, setUploading] = useState(false);

  const limit = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const url = `/aset?search=${search}&status=${filterStatus}&skip=${skip}&limit=${limit}`;
      const data = await apiFetch(url);
      setAset(data.items);
      setTotal(data.total);

      // Fetch global counts for stats (unfiltered by status)
      const allData = await apiFetch(`/aset?limit=1000`); // Simple way to get counts
      const counts = {
        baik: allData.items.filter((a: any) => a.status === 'tersedia').length,
        rusak: allData.items.filter((a: any) => a.status === 'rusak').length
      };
      setStats(counts);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setFormAset({ ...formAset, foto: data.url });
    } catch (err) {
      alert("Gagal mengunggah foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAset.foto) {
        alert("Mohon unggah foto aset terlebih dahulu");
        return;
    }

    try {
      if (selectedAset) {
        await apiFetch(`/aset/${selectedAset.id}`, {
          method: 'PATCH',
          body: JSON.stringify(formAset)
        });
      } else {
        await apiFetch('/aset', {
          method: 'POST',
          body: JSON.stringify(formAset)
        });
      }
      
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedAset(null);
      setFormAset({ nama_aset: '', deskripsi: '', jumlah: 1, kepemilikan: 'aset_kelurahan', status: 'tersedia', foto: '' });
      fetchData();
    } catch (err) {
      alert("Gagal menyimpan data");
    }
  };

  const openEdit = (item: any) => {
    setSelectedAset(item);
    setFormAset({
      nama_aset: item.nama_aset,
      deskripsi: item.deskripsi,
      jumlah: item.jumlah,
      kepemilikan: item.kepemilikan,
      status: item.status,
      foto: item.foto || ''
    });
    setShowEditModal(true);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, search, filterStatus, page]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10"></div>
        
        <header className="mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">Inventaris <span className="text-indigo-400">Kantor</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Aset Pemerintah Kelurahan • Monitoring Kondisi Real-time</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                <input 
                  type="text"
                  placeholder="Cari barang..."
                  className="bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 w-64 transition-all"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
             </div>

             <button 
               onClick={() => {
                 setSelectedAset(null);
                 setFormAset({ nama_aset: '', deskripsi: '', jumlah: 1, kepemilikan: 'aset_kelurahan', status: 'tersedia', foto: '' });
                 setShowAddModal(true);
               }}
               className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-2xl shadow-lg transition-all border border-indigo-500/50"
             >
                + Tambah Aset
             </button>

             <ExportButton 
               data={aset}
               filename={`Inventaris_Lurah_Kondisi_${filterStatus || 'Global'}`}
               columns={[
                 { key: 'nama_aset', label: 'Nama Barang' },
                 { key: 'jumlah', label: 'Qty' },
                 { key: 'status', label: 'Kondisi' },
                 { key: 'deskripsi', label: 'Catatan' }
               ]}
               label="Export XLSX"
             />
          </div>
        </header>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 animate-in fade-in slide-in-from-bottom duration-500">
           <StatCard title="Total Inventaris" value={stats.baik + stats.rusak} icon="🏢" color="indigo" subtitle="Total Seluruh Barang" />
           <StatCard title="Kondisi Baik" value={stats.baik} icon="✅" color="emerald" subtitle="Dapat Digunakan" />
           <StatCard title="Kondisi Rusak" value={stats.rusak} icon="⚠️" color="red" subtitle="Perlu Perbaikan" />
        </div>

        {/* Condition Filter Tabs */}
        <div className="flex gap-2 mb-10 bg-slate-800/40 p-1.5 rounded-[24px] border border-white/5 w-fit">
           {[
             { id: '', label: 'Semua Kondisi', icon: '📋' },
             { id: 'tersedia', label: 'Hanya Baik', icon: '✅' },
             { id: 'rusak', label: 'Hanya Rusak', icon: '⚠️' },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => { setFilterStatus(tab.id); setPage(1); }}
               className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 filterStatus === tab.id 
                 ? 'bg-indigo-600 text-white shadow-lg' 
                 : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
               }`}
             >
                <span>{tab.icon}</span>
                {tab.label}
             </button>
           ))}
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="p-6">Barang</th>
                <th className="p-6">Qty / Catatan</th>
                <th className="p-6">Kondisi</th>
                <th className="p-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse text-slate-500 font-black tracking-widest uppercase">Memuat Data...</td></tr>
              ) : aset.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-600 italic font-bold uppercase">Tidak ada barang dengan kondisi ini.</td></tr>
              ) : aset.map(item => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 rounded-2xl bg-slate-900 overflow-hidden border border-white/5 flex-shrink-0">
                          {item.foto ? <img src={item.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                       </div>
                       <div>
                          <p className="font-black text-white group-hover:text-indigo-400 transition-colors text-lg tracking-tight uppercase">{item.nama_aset}</p>
                          <p className="text-[10px] text-slate-500 font-mono">UID: {item.id.slice(0,8).toUpperCase()}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-white font-bold">{item.jumlah} Unit</p>
                    <p className="text-[10px] text-slate-500 italic max-w-[200px] truncate">{item.deskripsi || 'Tidak ada catatan'}</p>
                  </td>
                  <td className="p-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${item.status === 'tersedia' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'tersedia' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                       <span className="text-[9px] font-black uppercase tracking-widest">
                         {item.status === 'tersedia' ? 'BAIK' : 'RUSAK'}
                       </span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => openEdit(item)}
                      className="bg-white/5 hover:bg-white/10 text-white font-black text-[9px] uppercase tracking-[0.2em] px-5 py-2 rounded-xl transition-all border border-white/5"
                    >
                       Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form Modal (Add / Edit) */}
        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 z-50">
             <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                <div className="p-10">
                   <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic uppercase">{selectedAset ? 'Edit Inventaris' : 'Tambah Inventaris'}</h2>
                   <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-slate-500 uppercase px-1">Nama Barang</label>
                               <input required className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500" value={formAset.nama_aset} onChange={e => setFormAset({...formAset, nama_aset: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-500 uppercase px-1">Jumlah</label>
                                  <input type="number" required className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500" value={formAset.jumlah} onChange={e => setFormAset({...formAset, jumlah: parseInt(e.target.value)})} />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-500 uppercase px-1">Kondisi</label>
                                  <select className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500" value={formAset.status} onChange={e => setFormAset({...formAset, status: e.target.value})}>
                                     <option value="tersedia">Baik</option>
                                     <option value="rusak">Rusak</option>
                                  </select>
                               </div>
                            </div>
                         </div>

                         <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase px-1">Foto Barang</label>
                            <div className="relative aspect-square bg-slate-800 rounded-3xl border-2 border-dashed border-white/10 overflow-hidden group hover:border-indigo-500/50 transition-all">
                               {formAset.foto ? (
                                  <>
                                     <img src={formAset.foto} className="w-full h-full object-cover" />
                                     <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all text-[10px] font-black text-white uppercase tracking-widest">
                                        Ganti Foto
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                     </label>
                                  </>
                               ) : (
                                  <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-indigo-400 transition-all">
                                     <span className="text-4xl mb-2">{uploading ? '⏳' : '📸'}</span>
                                     <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">{uploading ? 'Mengunggah...' : 'Klik untuk Upload'}</span>
                                     <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                                  </label>
                               )}
                            </div>
                         </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase px-1">Catatan Keterangan</label>
                         <textarea className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 h-24" placeholder="Detail lokasi atau spesifikasi..." value={formAset.deskripsi} onChange={e => setFormAset({...formAset, deskripsi: e.target.value})}></textarea>
                      </div>

                      <div className="flex gap-4 pt-4">
                         <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="flex-1 py-4 rounded-2xl text-slate-400 font-bold hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest">Batal</button>
                         <button type="submit" disabled={uploading} className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-900/40 disabled:opacity-50">
                            {selectedAset ? 'Simpan Perubahan' : 'Simpan Inventaris'}
                         </button>
                      </div>
                   </form>
                </div>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
