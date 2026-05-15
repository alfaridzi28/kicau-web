'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function RWAsetPage() {
  const { user, isLoading, logout } = useAuth();
  const [asetRW, setAsetRW] = useState<any[]>([]);
  const [asetRT, setAsetRT] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAset, setNewAset] = useState({ nama_aset: '', deskripsi: '', jumlah: 1, foto: '', kepemilikan: 'aset_rw' });
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rwData, rtData] = await Promise.all([
        apiFetch(`/aset?rw=${user?.rw}&kepemilikan=aset_rw`),
        apiFetch(`/aset?rw=${user?.rw}&kepemilikan=aset_rt`)
      ]);
      setAsetRW(rwData);
      setAsetRT(rtData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/upload/image', { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData 
      });
      const data = await res.json();
      setNewAset({ ...newAset, foto: data.url });
    } catch (err) {
      alert("Gagal upload foto");
    } finally {
      setUploading(false);
    }
  };

  const handleAddAset = async () => {
    try {
      await apiFetch('/aset', {
        method: 'POST',
        body: JSON.stringify({
          ...newAset,
          rw: user?.rw
        })
      });
      setShowAddModal(false);
      setNewAset({ nama_aset: '', deskripsi: '', jumlah: 1, foto: '', kepemilikan: 'aset_rw' });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menambah aset");
    }
  };

  const handleBorrowFromRT = async (asetId: string) => {
    const keperluan = prompt("Masukkan keperluan peminjaman:");
    if (!keperluan) return;
    
    try {
      await apiFetch('/aset/pinjam', {
        method: 'POST',
        body: JSON.stringify({ aset_id: asetId, keperluan })
      });
      alert("Permintaan peminjaman berhasil dikirim ke RT terkait");
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal meminjam aset");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Manajemen Aset RW</h1>
            <p className="text-slate-400">Inventaris barang milik RW {user.rw}</p>
          </div>
          <div className="flex gap-4">
            <ExportButton 
              data={[...asetRW, ...asetRT]}
              filename={`Aset_RW${user.rw}`}
              columns={[
                { key: 'nama_aset', label: 'Nama Barang' },
                { key: 'deskripsi', label: 'Deskripsi' },
                { key: 'jumlah', label: 'Stok' },
                { key: 'status', label: 'Status' },
                { key: 'kepemilikan', label: 'Pemilik' },
                { key: 'rt', label: 'RT' },
                { key: 'rw', label: 'RW' }
              ]}
              label="Export Inventaris"
            />
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-900/40 transition flex items-center gap-2"
            >
              <span>➕</span> Tambah Aset RW
            </button>
          </div>
        </header>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
            Daftar Aset RW
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {asetRW.map(aset => (
              <div key={aset.id} className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden group">
                <div className="h-40 bg-slate-900 relative">
                  {aset.foto ? (
                    <img src={aset.foto} alt={aset.nama_aset} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700 text-4xl font-bold">📦</div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      aset.status === 'tersedia' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {aset.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white truncate">{aset.nama_aset}</h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-1">{aset.deskripsi || 'Tidak ada deskripsi'}</p>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                    <span>Stok: {aset.jumlah}</span>
                    <div className="flex gap-2">
                      <button onClick={async () => {
                        if (confirm("Hapus aset ini?")) {
                          try {
                            await apiFetch(`/aset/${aset.id}`, { method: 'DELETE' });
                            fetchData();
                          } catch (err: any) { alert(err.message); }
                        }
                      }} className="text-red-400 hover:text-red-300">Hapus</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
            Aset RT (Wilayah RW {user.rw})
          </h2>
          <p className="text-sm text-slate-500 mb-4">* Anda dapat meminjam aset RT yang berstatus "tersedia" untuk keperluan RW.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {asetRT.map(aset => (
              <div key={aset.id} className="bg-slate-800/20 rounded-2xl border border-white/5 overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                <div className="p-4 flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-900 flex-shrink-0 overflow-hidden border border-white/10">
                    {aset.foto ? <img src={aset.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-white truncate">{aset.nama_aset}</h3>
                    <p className="text-[10px] text-slate-500">Milik RT {aset.pemilik?.rt}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`text-[9px] font-bold uppercase ${aset.status === 'tersedia' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {aset.status}
                      </span>
                      {aset.status === 'tersedia' && (
                        <button 
                          onClick={() => handleBorrowFromRT(aset.id)}
                          className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-1 rounded transition"
                        >
                          Pinjam
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modal Add Aset */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Tambah Aset RW</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nama Barang</label>
                  <input 
                    type="text" 
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newAset.nama_aset}
                    onChange={(e) => setNewAset({ ...newAset, nama_aset: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Deskripsi</label>
                  <textarea 
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newAset.deskripsi}
                    onChange={(e) => setNewAset({ ...newAset, deskripsi: e.target.value })}
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Jumlah</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newAset.jumlah}
                      onChange={(e) => setNewAset({ ...newAset, jumlah: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Foto</label>
                    <input type="file" onChange={handleUpload} className="text-[10px] text-slate-500 mt-2" />
                    {uploading && <p className="text-[10px] text-indigo-400 animate-pulse">Uploading...</p>}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-800 text-white font-bold py-2 rounded-xl">Batal</button>
                  <button onClick={handleAddAset} className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-xl">Simpan</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
