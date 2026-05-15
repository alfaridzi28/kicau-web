'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function SuperadminWargaPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nik: '', nama: '', nomor_kk: '', rt: '', rw: '', role: 'warga', no_telp: '', foto: ''
  });

  const limit = 10;

  const fetchWarga = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      // Note: Backend doesn't support search query yet, we'll do search on client side for now 
      // but fetch total for accurate pagination.
      const data = await apiFetch(`/warga?skip=${skip}&limit=${limit}`);
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
  }, [user, page]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/warga', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ nik: '', nama: '', nomor_kk: '', rt: '', rw: '', role: 'warga', no_telp: '', foto: '' });
      fetchWarga();
      alert('User berhasil ditambahkan');
    } catch (err: any) {
      alert(err.message || "Gagal menambahkan user");
    }
  };

  const handleResetPassword = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin mereset password ${nama} menjadi 'password123'?`)) return;
    try {
      const res = await apiFetch(`/warga/${id}/reset-password`, { method: 'PATCH' });
      alert(res.message);
    } catch (err: any) {
      alert(err.message || "Gagal reset password");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, nama: string) => {
    const action = currentStatus ? 'menonaktifkan' : 'mengaktifkan';
    if (!confirm(`Apakah Anda yakin ingin ${action} akun ${nama}?`)) return;
    try {
      const res = await apiFetch(`/warga/${id}/toggle-active`, { method: 'PATCH' });
      alert(res.message);
      setWarga(prev => prev.map(w => w.id === id ? { ...w, is_active: res.is_active } : w));
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status akun");
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
             <h1 className="text-4xl font-black text-white italic tracking-tighter">Manajemen <span className="text-purple-400">Otoritas</span></h1>
             <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Total {total} Akun Sistem • Halaman {page} dari {totalPages || 1}</p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button 
              onClick={() => setShowModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-black px-8 py-3 rounded-2xl shadow-xl shadow-purple-900/20 transition-all active:scale-95 uppercase tracking-widest text-[10px] whitespace-nowrap"
            >
              + Tambah User
            </button>
          </div>
        </header>

        <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl mb-8">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="p-6">User / Identitas</th>
                <th className="p-6">Domisili</th>
                <th className="p-6">Kontak</th>
                <th className="p-6">Level Akses</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Manajemen</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">Sinkronisasi Data Halaman {page}...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center text-slate-600 italic font-bold">Data tidak ditemukan.</td></tr>
              ) : warga.map((w) => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                          {w.foto ? <img src={w.foto} className="w-full h-full object-cover" /> : '👤'}
                       </div>
                       <div>
                          <p className="font-black text-white group-hover:text-purple-400 transition-colors">{w.nama}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tighter">NIK: {w.nik}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-tighter">RT {w.rt || '-'} / RW {w.rw || '-'}</p>
                    <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Wilayah {w.rw}</p>
                  </td>
                  <td className="p-6">
                     <p className="text-xs font-mono text-emerald-400/70">{w.no_telp || '-'}</p>
                  </td>
                  <td className="p-6">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
                      w.role === 'superadmin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                      w.role === 'staff' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}>
                      {w.role}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
                      w.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {w.is_active ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => handleResetPassword(w.id, w.nama)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-indigo-400 transition-all border border-white/5" title="Reset Password">🔑</button>
                       <button onClick={() => handleToggleActive(w.id, w.is_active, w.nama)} className={`p-2 rounded-xl transition-all border border-white/5 ${w.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`} title={w.is_active ? 'Nonaktifkan' : 'Aktifkan'}>{w.is_active ? '🚫' : '✅'}</button>
                    </div>
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
                   <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${page === i + 1 ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>{i + 1}</button>
                ))}
             </div>
             <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-6 py-3 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 font-black text-xs uppercase transition-all border border-white/5">Next →</button>
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in duration-300 overflow-y-auto max-h-[90vh]">
               <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic">Pendaftaran <span className="text-purple-400">User Baru</span></h2>
               <form onSubmit={handleCreate} className="space-y-6">
                  <div className="flex flex-col items-center mb-8">
                     <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-dashed border-white/10 flex items-center justify-center text-3xl overflow-hidden relative group/avatar">
                        {formData.foto ? <img src={formData.foto} className="w-full h-full object-cover" /> : '📷'}
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                           <span className="text-[9px] font-black text-white uppercase">Upload</span>
                           <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                     </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nama Lengkap</label>
                        <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-purple-500" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">NIK (Username)</label>
                        <input type="text" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-purple-500" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} />
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nomor KK</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-purple-500" value={formData.nomor_kk} onChange={e => setFormData({...formData, nomor_kk: e.target.value})} />
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nomor Telepon</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-purple-500" value={formData.no_telp} onChange={e => setFormData({...formData, no_telp: e.target.value})} />
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Wilayah RT</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-purple-500" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} />
                     </div>
                     <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Wilayah RW</label>
                        <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-purple-500" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} />
                     </div>
                     <div className="col-span-full">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Level Akses (Role)</label>
                        <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-purple-500" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                           <option value="warga" className="bg-slate-900">Warga Biasa</option>
                           <option value="rt" className="bg-slate-900">Ketua RT</option>
                           <option value="rw" className="bg-slate-900">Ketua RW</option>
                           <option value="lurah" className="bg-slate-900">Lurah</option>
                           <option value="superadmin" className="bg-slate-900">Superadmin</option>
                        </select>
                     </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                     <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]">Batal</button>
                     <button type="submit" className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px] shadow-xl shadow-purple-900/40">Daftarkan User</button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
