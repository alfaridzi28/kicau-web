'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';

export default function RWAsetPage() {
  const { user, isLoading, logout } = useAuth();
  const [asetRW, setAsetRW] = useState<any[]>([]);
  const [asetRT, setAsetRT] = useState<any[]>([]);
  const [permintaan, setPermintaan] = useState<any[]>([]);
  const [totalRW, setTotalRW] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'inventaris' | 'permintaan' | 'katalog_rt'>('inventaris');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPinjamModal, setShowPinjamModal] = useState(false);
  const [selectedAset, setSelectedAset] = useState<any>(null);
  const [keperluan, setKeperluan] = useState('');
  const [editingAset, setEditingAset] = useState<any>(null);
  const [newAset, setNewAset] = useState({ 
    nama_aset: '', deskripsi: '', jumlah: 1, foto: '', status: 'tersedia', kepemilikan: 'aset_rw' 
  });
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState({ baik: 0, rusak: 0, dipinjam: 0 });

  const limit = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const statusParam = filterStatus === 'all' ? '' : filterStatus;
      
      const rwRes = await apiFetch(`/aset?rw=${user?.rw}&kepemilikan=aset_rw&search=${search}&status=${statusParam}&skip=${skip}&limit=${limit}`);
      setAsetRW(rwRes.items || []);
      setTotalRW(rwRes.total || 0);
      
      const pinjamRes = await apiFetch('/aset/peminjaman');
      setPermintaan(pinjamRes || []);

      const rtRes = await apiFetch(`/aset?rw=${user?.rw}&kepemilikan=aset_rt&limit=100`);
      setAsetRT(rtRes.items || []);
      
      setStats({
        baik: (rwRes.items || []).filter((a: any) => a.status === 'tersedia').length,
        rusak: (rwRes.items || []).filter((a: any) => a.status === 'rusak' || a.status === 'tidak_layak').length,
        dipinjam: (pinjamRes || []).filter((p: any) => p.status === 'disetujui' && p.aset?.kepemilikan === 'aset_rw').length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, page, filterStatus, activeTab]);

  const handleActionPinjam = async (id: string, status: string) => {
    try {
      await apiFetch(`/aset/peminjaman/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      alert(`Permintaan pinjaman telah ${status}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal memproses permintaan");
    }
  };

  const handlePinjamKeRT = async () => {
    if (!keperluan) return alert("Harap isi keperluan");
    try {
      await apiFetch('/aset/pinjam', {
        method: 'POST',
        body: JSON.stringify({ aset_id: selectedAset.id, keperluan })
      });
      alert(`Permintaan pinjaman ke RT ${selectedAset.rt} telah dikirim`);
      setShowPinjamModal(false);
      setKeperluan('');
      fetchData();
      setActiveTab('permintaan');
    } catch (err: any) {
      alert(err.message || "Gagal meminjam");
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/upload`, { 
        method: 'POST', body: formData 
      });
      const data = await res.json();
      if (editingAset) setEditingAset({ ...editingAset, foto: data.url });
      else setNewAset({ ...newAset, foto: data.url });
    } catch (err) {
      alert("Gagal upload foto");
    } finally {
      setUploading(false);
    }
  };

  const handleAddAset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/aset', {
        method: 'POST',
        body: JSON.stringify({ ...newAset, rw: String(user?.rw || '') })
      });
      setShowAddModal(false);
      setNewAset({ nama_aset: '', deskripsi: '', jumlah: 1, foto: '', status: 'tersedia', kepemilikan: 'aset_rw' });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menambah aset");
    }
  };

  const handleUpdateAset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/aset/${editingAset.id}`, { 
        method: 'PATCH', 
        body: JSON.stringify(editingAset) 
      });
      setEditingAset(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui aset");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10"></div>
        
        <header className="mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Pusat Aset <span className="text-indigo-400">RW {user.rw}</span></h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Otoritas Wilayah • Monitoring & Distribusi Fasilitas</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="bg-slate-800/40 p-1.5 rounded-2xl border border-white/5 flex gap-2">
                <button onClick={() => setActiveTab('inventaris')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'inventaris' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Inventaris RW</button>
                <button onClick={() => setActiveTab('permintaan')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'permintaan' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                   Permintaan Masuk 
                   {permintaan.filter(p => p.status === 'menunggu' && p.aset?.pemilik_id === user.id).length > 0 && <span className="ml-2 bg-red-500 text-white px-1.5 py-0.5 rounded-md text-[8px] animate-pulse">{permintaan.filter(p => p.status === 'menunggu' && p.aset?.pemilik_id === user.id).length}</span>}
                </button>
                <button onClick={() => setActiveTab('katalog_rt')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'katalog_rt' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Monitor Aset RT</button>
             </div>
             
             {activeTab === 'inventaris' && (
                <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-xl">+ Tambah Aset RW</button>
             )}
          </div>
        </header>

        {activeTab === 'inventaris' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 animate-in fade-in slide-in-from-bottom duration-500">
               <StatCard title="Total Aset RW" value={stats.baik + stats.rusak} icon="🏢" color="indigo" subtitle="Milik Wilayah RW" />
               <StatCard title="Kondisi Baik" value={stats.baik} icon="✅" color="emerald" subtitle="Siap Distribusi" />
               <StatCard title="Aktif Dipinjam" value={stats.dipinjam} icon="🤝" color="orange" subtitle="Dipakai RT/Warga" />
            </div>

            <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                  <tr>
                    <th className="p-8">Nama Aset RW</th>
                    <th className="p-8">Stok</th>
                    <th className="p-8">Kondisi</th>
                    <th className="p-8 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {asetRW.map(item => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                      <td className="p-8">
                        <div className="flex items-center gap-5">
                           <div className="w-14 h-14 rounded-2xl bg-slate-900 overflow-hidden border border-white/5">
                              {item.foto ? <img src={item.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🏢</div>}
                           </div>
                           <p className="font-black text-white group-hover:text-indigo-400 uppercase tracking-tight">{item.nama_aset}</p>
                        </div>
                      </td>
                      <td className="p-8 text-white font-black">{item.jumlah} Unit</td>
                      <td className="p-8">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${item.status === 'tersedia' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                           {item.status}
                        </span>
                      </td>
                      <td className="p-8 text-right">
                         <button onClick={() => setEditingAset(item)} className="text-[10px] font-black text-slate-500 hover:text-white uppercase transition-colors mr-4">Edit</button>
                         <button onClick={() => { if(confirm('Hapus?')) apiFetch(`/aset/${item.id}`, {method:'DELETE'}).then(fetchData) }} className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase transition-colors">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'permintaan' && (
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500">
             <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                   <tr>
                      <th className="p-8">Peminjam</th>
                      <th className="p-8">Asal Wilayah</th>
                      <th className="p-8">Keperluan</th>
                      <th className="p-8 text-right">Keputusan</th>
                   </tr>
                </thead>
                <tbody className="text-sm">
                   {permintaan.filter(p => p.aset?.pemilik_id === user.id).length === 0 ? (
                      <tr><td colSpan={4} className="p-20 text-center text-slate-600 font-black uppercase italic">Tidak ada antrian peminjaman.</td></tr>
                   ) : permintaan.filter(p => p.aset?.pemilik_id === user.id).map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                         <td className="p-8">
                            <p className="font-black text-white uppercase">{p.peminjam?.nama || 'Pengurus'}</p>
                            <p className="text-[10px] text-indigo-400 font-bold">{p.peminjam?.role?.toUpperCase()} {p.peminjam?.rt ? `RT ${p.peminjam.rt}` : ''}</p>
                         </td>
                         <td className="p-8">
                            <p className="font-bold text-white uppercase">{p.aset?.nama_aset}</p>
                            <p className="text-[9px] text-slate-500 uppercase">Milik Wilayah RW</p>
                         </td>
                         <td className="p-8 text-xs text-slate-400 italic">"{p.keperluan}"</td>
                         <td className="p-8 text-right">
                            {p.status === 'menunggu' ? (
                               <div className="flex justify-end gap-2">
                                  <button onClick={() => handleActionPinjam(p.id, 'ditolak')} className="px-5 py-2 rounded-xl bg-red-500/10 text-red-500 font-black text-[9px] uppercase border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Tolak</button>
                                  <button onClick={() => handleActionPinjam(p.id, 'disetujui')} className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-black text-[9px] uppercase shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 transition-all">Setujui</button>
                               </div>
                            ) : (
                               <div className="flex justify-end gap-3 items-center">
                                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${p.status === 'disetujui' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>{p.status}</span>
                                  {p.status === 'disetujui' && (
                                     <button onClick={() => handleActionPinjam(p.id, 'dikembalikan')} className="px-4 py-1.5 rounded-lg bg-white/5 text-white font-black text-[8px] uppercase border border-white/10 hover:bg-white/10 transition-all">Terima Balik</button>
                                  )}
                               </div>
                            )}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {activeTab === 'katalog_rt' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
             {asetRT.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-600 font-black uppercase border-2 border-dashed border-white/5 rounded-[40px]">Belum ada data aset dari RT wilayah Anda.</div>
             ) : asetRT.map(item => (
                <div key={item.id} className="bg-slate-800/40 p-6 rounded-[32px] border border-white/5 group hover:border-indigo-500/30 transition-all shadow-xl">
                   <div className="h-32 bg-slate-900 rounded-2xl mb-4 overflow-hidden border border-white/5 relative">
                      {item.foto ? <img src={item.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">📦</div>}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black text-white border border-white/10">RT {item.rt}</div>
                   </div>
                   <h3 className="font-black text-white uppercase text-sm mb-2 truncate">{item.nama_aset}</h3>
                   <p className="text-[10px] text-slate-500 italic mb-6 line-clamp-2">{item.deskripsi || 'Aset milik wilayah RT.'}</p>
                   <button 
                     onClick={() => { setSelectedAset(item); setShowPinjamModal(true); }}
                     disabled={item.status !== 'tersedia'}
                     className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${item.status === 'tersedia' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                   >
                      {item.status === 'tersedia' ? `Pinjam Aset RT ${item.rt}` : 'Dipinjam'}
                   </button>
                </div>
             ))}
          </div>
        )}

        {/* Pinjam Modal */}
        {showPinjamModal && selectedAset && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 z-50">
             <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-lg p-12 shadow-2xl animate-in zoom-in duration-300">
                <h2 className="text-2xl font-black text-white mb-8 tracking-tighter italic uppercase">Permohonan Pinjam Ke <span className="text-emerald-400">RT {selectedAset.rt}</span></h2>
                <div className="space-y-6">
                   <div className="bg-white/5 p-5 rounded-2xl border border-white/5 flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center text-3xl">📦</div>
                      <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nama Barang</p>
                         <p className="text-lg font-black text-white uppercase">{selectedAset.nama_aset}</p>
                      </div>
                   </div>
                   <textarea 
                     className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-emerald-500 h-32 text-sm"
                     placeholder="Sebutkan alasan Pak RW meminjam aset RT ini..."
                     value={keperluan}
                     onChange={(e) => setKeperluan(e.target.value)}
                   ></textarea>
                   <div className="flex gap-4">
                      <button onClick={() => setShowPinjamModal(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] tracking-widest">Batal</button>
                      <button onClick={handlePinjamKeRT} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-900/40 transition-all active:scale-95">Ajukan Ke Pak RT</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(showAddModal || editingAset) && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
               <div className="p-10">
                  <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic uppercase">{editingAset ? 'Edit Aset RW' : 'Tambah Aset RW'}</h2>
                  <form onSubmit={editingAset ? handleUpdateAset : handleAddAset} className="space-y-6">
                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-500 uppercase px-1">Nama Barang</label>
                              <input 
                                required 
                                className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner" 
                                value={editingAset ? editingAset.nama_aset : newAset.nama_aset} 
                                onChange={e => editingAset ? setEditingAset({...editingAset, nama_aset: e.target.value}) : setNewAset({...newAset, nama_aset: e.target.value})} 
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase px-1">Jumlah</label>
                                 <input 
                                   type="number" 
                                   required 
                                   className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 shadow-inner" 
                                   value={editingAset ? editingAset.jumlah : newAset.jumlah} 
                                   onChange={e => editingAset ? setEditingAset({...editingAset, jumlah: parseInt(e.target.value)}) : setNewAset({...newAset, jumlah: parseInt(e.target.value)})} 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase px-1">Kondisi</label>
                                 <select 
                                   className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 shadow-inner" 
                                   value={editingAset ? editingAset.status : newAset.status} 
                                   onChange={e => editingAset ? setEditingAset({...editingAset, status: e.target.value}) : setNewAset({...newAset, status: e.target.value})}
                                 >
                                    <option value="tersedia">Baik</option>
                                    <option value="tidak_layak">Rusak</option>
                                 </select>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase px-1">Foto Aset</label>
                           <div className="relative aspect-square bg-slate-800 rounded-[32px] border-2 border-dashed border-white/10 overflow-hidden group hover:border-indigo-500/50 transition-all shadow-inner">
                              {(editingAset?.foto || newAset.foto) ? (
                                 <>
                                    <img src={editingAset ? editingAset.foto : newAset.foto} className="w-full h-full object-cover" />
                                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all text-[10px] font-black text-white uppercase tracking-widest">
                                       Ganti Foto
                                       <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                    </label>
                                 </>
                              ) : (
                                 <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-indigo-400 transition-all">
                                    <span className="text-4xl mb-2">{uploading ? '⏳' : '📸'}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center px-6">{uploading ? 'Mengunggah...' : 'Klik untuk Upload'}</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                 </label>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase px-1">Deskripsi / Catatan Lokasi</label>
                        <textarea 
                          className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 h-24 shadow-inner" 
                          placeholder="Misal: Disimpan di gudang RW..." 
                          value={editingAset ? editingAset.deskripsi : newAset.deskripsi} 
                          onChange={e => editingAset ? setEditingAset({...editingAset, deskripsi: e.target.value}) : setNewAset({...newAset, deskripsi: e.target.value})}
                        ></textarea>
                     </div>

                     <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => { setShowAddModal(false); setEditingAset(null); }} className="flex-1 py-4 rounded-2xl text-slate-400 font-bold hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest">Batal</button>
                        <button type="submit" disabled={uploading} className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-900/40 disabled:opacity-50 transition-all active:scale-95">
                           {editingAset ? 'Simpan Perubahan' : 'Simpan Aset'}
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
