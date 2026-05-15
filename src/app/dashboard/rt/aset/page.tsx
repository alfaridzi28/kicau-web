'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function RTAsetPage() {
  const { user, isLoading, logout } = useAuth();
  const [aset, setAset] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAset, setNewAset] = useState({ nama_aset: '', deskripsi: '', jumlah: 1, foto: '', kepemilikan: 'aset_rt' });
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/aset?rt=${user?.rt}&rw=${user?.rw}&kepemilikan=aset_rt`);
      setAset(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
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
          rt: user?.rt,
          rw: user?.rw
        }) 
      });
      setShowAddModal(false);
      setNewAset({ nama_aset: '', deskripsi: '', jumlah: 1, foto: '', kepemilikan: 'aset_rt' });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menambah aset");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex justify-between items-center mb-8 bg-slate-800/40 p-6 rounded-3xl border border-white/5 shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-3xl font-black text-white italic tracking-tighter underline decoration-emerald-500/30">Inventaris <span className="text-emerald-400">RT {user.rt}</span></h1>
               <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-500/30">{user.role}</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">Pencatatan & Pengelolaan Aset Lingkungan</p>
          </div>
          <div className="flex gap-4 items-center">
            <ExportButton 
              data={aset}
              filename={`Aset_RT${user.rt}`}
              columns={[
                { key: 'nama_aset', label: 'Nama Barang' },
                { key: 'deskripsi', label: 'Deskripsi' },
                { key: 'jumlah', label: 'Stok' },
                { key: 'status', label: 'Status' }
              ]}
              label="Unduh Laporan"
            />
            {(user.role === 'rt' || user.role === 'staff' || user.role === 'superadmin') && (
              <button 
                onClick={() => setShowAddModal(true)} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-3.5 rounded-2xl shadow-2xl shadow-emerald-900/40 transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest text-[10px]"
              >
                <span className="text-lg">📦</span> + Tambah Aset
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500">Memuat data...</div>
          ) : aset.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 italic">Belum ada aset terdaftar.</div>
          ) : aset.map(item => (
            <div key={item.id} className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden group">
              <div className="h-40 bg-slate-900 relative">
                {item.foto ? <img src={item.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'tersedia' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white truncate">{item.nama_aset}</h3>
                <p className="text-xs text-slate-500 mb-2">Jumlah: {item.jumlah}</p>
                <div className="flex justify-between items-center">
                  <button className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase">Detail</button>
                  <button onClick={async () => {
                    if (confirm("Hapus aset ini?")) {
                      try {
                        await apiFetch(`/aset/${item.id}`, { method: 'DELETE' });
                        fetchData();
                      } catch (err: any) { alert(err.message); }
                    }
                  }} className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase">Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Tambah Aset RT</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Nama Barang" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white" value={newAset.nama_aset} onChange={(e) => setNewAset({ ...newAset, nama_aset: e.target.value })} />
                <textarea placeholder="Deskripsi" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white" value={newAset.deskripsi} onChange={(e) => setNewAset({ ...newAset, deskripsi: e.target.value })}></textarea>
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Jumlah" className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-white" value={newAset.jumlah} onChange={(e) => setNewAset({ ...newAset, jumlah: parseInt(e.target.value) })} />
                  <div>
                    <input type="file" onChange={handleUpload} className="text-[10px] text-slate-500 mt-2" />
                    {uploading && <p className="text-[10px] text-indigo-400">Uploading...</p>}
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
