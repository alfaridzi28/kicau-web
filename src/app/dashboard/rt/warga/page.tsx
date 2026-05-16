'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';

export default function RTWargaPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ miskin: 0, hamil: 0, balita: 0 });

  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    nomor_kk: '',
    alamat: '',
    no_telp: '',
    is_fakir: false,
    is_miskin: false,
    is_ibu_hamil: false,
    is_balita: false,
    latitude: null as number | null,
    longitude: null as number | null,
  });
  
  const limit = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const endpoint = `/warga?rt=${user?.rt}&rw=${user?.rw}&search=${search}&skip=${skip}&limit=${limit}`;
      const res = await apiFetch(endpoint);
      setWarga(res.items || []);
      setTotal(res.total || 0);

      // Fetch stats (simplified for now)
      const allRes = await apiFetch(`/warga?rt=${user?.rt}&rw=${user?.rw}&limit=1000`);
      const allItems = allRes.items || [];
      setStats({
        miskin: allItems.filter((w: any) => w.is_miskin || w.is_fakir).length,
        hamil: allItems.filter((w: any) => w.is_ibu_hamil).length,
        balita: allItems.filter((w: any) => w.is_balita).length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAllData = async () => {
    const endpoint = `/warga?rt=${user?.rt}&rw=${user?.rw}&search=${search}&limit=10000`;
    const res = await apiFetch(endpoint);
    return { data: res.items || [] };
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, page, search]);

  const handleOpenModal = (w?: any) => {
    if (w) {
      setSelectedWarga(w);
      setFormData({
        nama: w.nama,
        nik: w.nik,
        nomor_kk: w.nomor_kk || '',
        alamat: w.alamat || '',
        no_telp: w.no_telp || '',
        is_fakir: w.is_fakir,
        is_miskin: w.is_miskin,
        is_ibu_hamil: w.is_ibu_hamil,
        is_balita: w.is_balita,
        latitude: w.latitude || null,
        longitude: w.longitude || null,
      });
    } else {
      setSelectedWarga(null);
      setFormData({
        nama: '',
        nik: '',
        nomor_kk: '',
        alamat: '',
        no_telp: '',
        is_fakir: false,
        is_miskin: false,
        is_ibu_hamil: false,
        is_balita: false,
        latitude: null,
        longitude: null,
      });

      // Ambil lokasi RT saat ini untuk default lat long warga baru
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
          },
          (err) => console.log("Gagal mengambil lokasi:", err),
          { enableHighAccuracy: true }
        );
      }
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedWarga) {
        await apiFetch(`/warga/${selectedWarga.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch(`/warga`, {
          method: 'POST',
          body: JSON.stringify({ ...formData, rt: user?.rt, rw: user?.rw, role: 'warga' })
        });
      }
      setShowModal(false);
      fetchData();
      alert("Data warga berhasil disimpan");
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data warga ini secara permanen?")) return;
    try {
      await apiFetch(`/warga/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus data");
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
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Kelola <span className="text-indigo-400">Warga RT {user.rt}</span></h1>
               <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-indigo-500/30 tracking-widest">Wilayah RW {user.rw}</span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Basis Data Kependudukan Digital • Monitoring Kesejahteraan</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">🔍</span>
                <input 
                  type="text" 
                  placeholder="Cari Nama atau NIK..." 
                  className="bg-slate-800/40 border border-white/5 rounded-2xl py-3 pl-12 pr-6 text-sm text-white focus:outline-none focus:border-indigo-500/50 w-full md:w-64 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>

             <button 
               onClick={() => handleOpenModal()}
               className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-2xl shadow-xl shadow-indigo-900/40 transition-all active:scale-95 border border-indigo-500/50"
             >
                + Tambah Warga
             </button>

             <ExportButton 
               data={warga}
               filename={`Data_Warga_RT${user.rt}`}
               columns={[
                 { key: 'nama', label: 'Nama' },
                 { key: 'nik', label: 'NIK' },
                 { key: 'nomor_kk', label: 'No. KK' },
                 { key: 'alamat', label: 'Alamat' }
               ]}
               label="Export XLSX"
               fetchDataToExport={handleFetchAllData}
             />
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 animate-in fade-in slide-in-from-bottom duration-500">
           <StatCard title="Total Warga" value={total} icon="👥" color="indigo" subtitle="Warga Terdaftar" />
           <StatCard title="Kurang Mampu" value={stats.miskin} icon="🆘" color="red" subtitle="Fakir & Miskin" />
           <StatCard title="Ibu Hamil" value={stats.hamil} icon="🤰" color="pink" subtitle="Monitoring Kesehatan" />
           <StatCard title="Balita" value={stats.balita} icon="👶" color="cyan" subtitle="Cek Stunting/Gizi" />
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">
              <tr>
                <th className="p-8">Identitas Warga</th>
                <th className="p-8">Keluarga & Alamat</th>
                <th className="p-8">Status Sosial</th>
                <th className="p-8 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">Sinkronisasi Database Warga...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-600 italic font-bold uppercase tracking-widest">Tidak ada data warga ditemukan.</td></tr>
              ) : warga.map(w => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-xl shadow-inner">
                          {w.foto ? <img src={w.foto} className="w-full h-full rounded-full object-cover" /> : "👤"}
                       </div>
                       <div>
                          <p className="font-black text-white group-hover:text-indigo-400 transition-colors text-base uppercase tracking-tight">{w.nama}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tighter">NIK: {w.nik}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <p className="text-white font-bold text-xs uppercase tracking-widest">KK: {w.nomor_kk || '-'}</p>
                    <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-1">{w.alamat || 'Alamat belum diatur'}</p>
                  </td>
                  <td className="p-8">
                    <div className="flex flex-wrap gap-2">
                      {w.is_fakir && <span className="bg-red-500/10 text-red-400 text-[8px] px-2 py-1 rounded-lg border border-red-500/20 font-black uppercase">Fakir</span>}
                      {w.is_miskin && <span className="bg-orange-500/10 text-orange-400 text-[8px] px-2 py-1 rounded-lg border border-orange-500/20 font-black uppercase">Miskin</span>}
                      {w.is_ibu_hamil && <span className="bg-pink-500/10 text-pink-400 text-[8px] px-2 py-1 rounded-lg border border-pink-500/20 font-black uppercase">Hamil</span>}
                      {w.is_balita && <span className="bg-blue-500/10 text-blue-400 text-[8px] px-2 py-1 rounded-lg border border-blue-500/20 font-black uppercase">Balita</span>}
                      {!w.is_fakir && !w.is_miskin && !w.is_ibu_hamil && !w.is_balita && <span className="bg-emerald-500/10 text-emerald-400 text-[8px] px-2 py-1 rounded-lg border border-emerald-500/20 font-black uppercase">Sehat/Mampu</span>}
                    </div>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                       <button 
                         onClick={() => handleOpenModal(w)}
                         className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl border border-indigo-500/20 transition-all"
                       >
                         Edit
                       </button>
                       <button 
                         onClick={() => handleDelete(w.id)}
                         className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-xl border border-red-500/20 transition-all"
                       >
                         Hapus
                       </button>
                    </div>
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

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 max-h-[95vh] flex flex-col">
               <div className="p-10 overflow-y-auto">
                  <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic uppercase">{selectedWarga ? 'Update Data Warga' : 'Registrasi Warga Baru'}</h2>
                  <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase px-1">Nama Lengkap</label>
                             <input required className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase px-1">NIK (Nomor Induk Kependudukan)</label>
                             <input required className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 shadow-inner font-mono" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} />
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase px-1">Nomor Kartu Keluarga</label>
                             <input className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 shadow-inner font-mono" value={formData.nomor_kk} onChange={e => setFormData({...formData, nomor_kk: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase px-1">Nomor Telepon / WA</label>
                             <input className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 shadow-inner font-mono" placeholder="0812..." value={formData.no_telp} onChange={e => setFormData({...formData, no_telp: e.target.value})} />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase px-1">Alamat Domisili</label>
                       <textarea className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 h-24 shadow-inner" value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})}></textarea>
                    </div>

                    {/* Indikator Lokasi */}
                    <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase">Titik Koordinat (Otomatis)</p>
                          {formData.latitude && formData.longitude ? (
                             <p className="text-xs text-indigo-400 font-mono mt-1">
                                Lat: {formData.latitude.toFixed(6)}, Lng: {formData.longitude.toFixed(6)}
                             </p>
                          ) : (
                             <p className="text-xs text-orange-400 font-mono mt-1 italic animate-pulse">
                                Mendeteksi lokasi GPS...
                             </p>
                          )}
                       </div>
                       <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">📍</div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5 pb-2">Status Khusus & Kesejahteraan</p>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Fakir', key: 'is_fakir', color: 'red' },
                            { label: 'Miskin', key: 'is_miskin', color: 'orange' },
                            { label: 'Ibu Hamil', key: 'is_ibu_hamil', color: 'pink' },
                            { label: 'Balita', key: 'is_balita', color: 'blue' },
                          ].map(item => (
                            <label key={item.key} className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border ${
                              (formData as any)[item.key] 
                              ? `bg-indigo-600/20 border-indigo-500/50` 
                              : 'bg-white/5 border-white/5 hover:border-white/10'
                            }`}>
                               <input 
                                 type="checkbox"
                                 checked={(formData as any)[item.key]}
                                 onChange={(e) => setFormData({...formData, [item.key]: e.target.checked})}
                                 className="w-5 h-5 rounded-lg accent-indigo-500"
                               />
                               <span className={`text-[10px] font-black uppercase ${(formData as any)[item.key] ? 'text-white' : 'text-slate-500'}`}>{item.label}</span>
                            </label>
                          ))}
                       </div>
                    </div>

                    <div className="flex gap-4 pt-6">
                       <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-2xl text-slate-400 font-bold hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest">Batal</button>
                       <button type="submit" className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest shadow-lg shadow-indigo-900/40 transition-all active:scale-95">
                          {selectedWarga ? 'Simpan Perubahan' : 'Registrasi Warga'}
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


