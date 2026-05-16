'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RWAduanPage() {
  const { user, isLoading, logout } = useAuth();
  const [aduan, setAduan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('semua');
  const [selectedAduan, setSelectedAduan] = useState<any>(null);
  const [balasan, setBalasan] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fotoSelesai, setFotoSelesai] = useState('');

  const fetchAduan = async () => {
    setLoading(true);
    try {
      const statusParam = filter !== 'semua' ? `&status=${filter}` : '';
      const data = await apiFetch(`/aduan?rw=${user?.rw}${statusParam}`);
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
  }, [user, filter]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', e.target.files[0]);

    try {
      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setFotoSelesai(data.url);
    } catch (err) {
      alert("Gagal upload foto");
    } finally {
      setUploading(false);
    }
  };

  const handleProcessAduan = async () => {
    if (!selectedAduan) return;
    
    try {
      await apiFetch(`/aduan/${selectedAduan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: statusUpdate,
          balasan: balasan,
          foto_selesai: fotoSelesai
        })
      });
      alert("Tanggapan berhasil disimpan & Notifikasi dikirim ke Ketua RT terkait");
      setSelectedAduan(null);
      fetchAduan();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui aduan");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const filters = [
    { id: 'semua', label: 'Semua Aduan', icon: '📋' },
    { id: 'belum_dibaca', label: 'Baru Masuk', icon: '📩' },
    { id: 'diproses', label: 'Sedang Diproses', icon: '⚙️' },
    { id: 'selesai', label: 'Sudah Selesai', icon: '✅' },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter italic">Pusat <span className="text-indigo-400">Aduan Warga</span></h1>
          <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Monitoring & Koordinasi Masalah Wilayah RW {user.rw}</p>
        </header>

        <div className="flex flex-wrap gap-2 mb-8 bg-slate-800/40 p-2 rounded-2xl border border-white/5 w-fit">
           {filters.map(f => (
              <button 
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${filter === f.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                 <span>{f.icon}</span> {f.label}
              </button>
           ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500 animate-pulse font-black uppercase tracking-widest">Sinkronisasi Aduan...</div>
          ) : aduan.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-800/20 rounded-[40px] border border-dashed border-white/10">
               <p className="text-slate-500 italic font-bold">Tidak ada aduan dalam kategori ini.</p>
            </div>
          ) : aduan.map((item) => (
            <div key={item.id} className="bg-slate-800/40 backdrop-blur-md rounded-[32px] border border-white/5 p-8 hover:border-indigo-500/30 transition-all flex flex-col group shadow-2xl">
              <div className="flex justify-between flex-wrap gap-y-4 items-start mb-6">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                  item.status === 'selesai' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  item.status === 'diproses' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-orange-500/10 text-orange-400 border-orange-500/20'
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
              </div>
              
              <h3 className="text-xl font-black text-white mb-3 group-hover:text-indigo-400 transition-colors">{item.judul}</h3>
              <p className="text-sm text-slate-400 line-clamp-3 mb-6 leading-relaxed">{item.isi}</p>
              
              {item.foto_bukti && (
                <div className="relative h-40 w-full mb-6 rounded-2xl overflow-hidden border border-white/5">
                   <img src={item.foto_bukti} alt="Bukti" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}

              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pelapor</p>
                  <p className="text-xs font-bold text-white italic">RT {item.user?.rt} — {item.user?.nama}</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedAduan(item);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-black px-5 py-2.5 rounded-full transition-all border border-white/10 uppercase tracking-widest"
                >
                  Lihat Detail
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Detail Aduan (View Only) */}
        {selectedAduan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-2xl p-10 shadow-2xl overflow-y-auto max-h-[90vh] animate-in zoom-in duration-300">
              <div className="flex justify-between flex-wrap gap-y-4 items-center mb-10">
                <div>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter">Detail <span className="text-indigo-400">Aduan Warga</span></h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">ID: {selectedAduan.id.slice(0,8)} • Status: {selectedAduan.status.replace('_', ' ')}</p>
                </div>
                <button onClick={() => setSelectedAduan(null)} className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-white hover:bg-red-500/20 transition-all">✕</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                   <div>
                      <h3 className="text-xl font-black text-white mb-2">{selectedAduan.judul}</h3>
                      <p className="text-slate-400 leading-relaxed text-sm">{selectedAduan.isi}</p>
                   </div>
                   
                   {selectedAduan.foto_bukti && (
                     <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Foto Bukti Pelapor</p>
                        <img src={selectedAduan.foto_bukti} alt="Bukti" className="w-full rounded-3xl border border-white/5" />
                     </div>
                   )}
                </div>

                <div className="space-y-8 bg-white/5 p-8 rounded-[32px] border border-white/5">
                   <div>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Tanggapan Otoritas RT</p>
                      <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 min-h-[100px]">
                         <p className="text-sm text-slate-300 italic">
                           {selectedAduan.balasan || "Belum ada tanggapan resmi dari Ketua RT terkait."}
                         </p>
                      </div>
                   </div>

                   {selectedAduan.foto_selesai && (
                     <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Foto Bukti Penyelesaian</p>
                        <img src={selectedAduan.foto_selesai} alt="Selesai" className="w-full rounded-2xl border border-emerald-500/20" />
                     </div>
                   )}

                   <div className="pt-4 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Monitoring Mode Active</p>
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

