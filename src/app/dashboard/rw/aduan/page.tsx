'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RWAduanPage() {
  const { user, isLoading, logout } = useAuth();
  const [aduan, setAduan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAduan, setSelectedAduan] = useState<any>(null);
  const [balasan, setBalasan] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fotoSelesai, setFotoSelesai] = useState('');

  const fetchAduan = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/aduan?rw=${user?.rw}`);
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
  }, [user]);

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
      alert("Aduan berhasil diperbarui");
      setSelectedAduan(null);
      fetchAduan();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui aduan");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">Manajemen Aduan RW {user.rw}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500">Memuat data aduan...</div>
          ) : aduan.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 italic">Tidak ada aduan di wilayah Anda.</div>
          ) : aduan.map((item) => (
            <div key={item.id} className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                  item.status === 'selesai' ? 'bg-emerald-500/20 text-emerald-400' :
                  item.status === 'diproses' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-orange-500/20 text-orange-400'
                }`}>
                  {item.status.replace('_', ' ')}
                </span>
                <p className="text-[10px] text-slate-500 font-medium">{new Date(item.created_at).toLocaleDateString('id-ID')}</p>
              </div>
              
              <h3 className="text-lg font-bold text-white mb-2">{item.judul}</h3>
              <p className="text-sm text-slate-400 line-clamp-2 mb-4">{item.isi}</p>
              
              {item.foto_bukti && (
                <img src={item.foto_bukti} alt="Bukti" className="w-full h-32 object-cover rounded-xl mb-4 border border-white/10" />
              )}

              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-300">RT {item.user?.rt} - {item.user?.nama}</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedAduan(item);
                    setStatusUpdate(item.status);
                    setBalasan(item.balasan || '');
                    setFotoSelesai(item.foto_selesai || '');
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-900/40 transition"
                >
                  Tindak Lanjut
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Tindak Lanjut */}
        {selectedAduan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Tindak Lanjut Aduan</h2>
                <button onClick={() => setSelectedAduan(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Update Status</label>
                  <select 
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                  >
                    <option value="belum_dibaca">Belum Dibaca</option>
                    <option value="diproses">Diproses</option>
                    <option value="selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Balasan / Catatan</label>
                  <textarea 
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                    placeholder="Tulis jawaban atau tindakan yang diambil..."
                    value={balasan}
                    onChange={(e) => setBalasan(e.target.value)}
                  ></textarea>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Foto Bukti Selesai (Opsional)</label>
                  <div className="flex items-center gap-4">
                    <input type="file" onChange={handleUpload} className="text-xs text-slate-400" />
                    {uploading && <span className="text-xs text-indigo-400 animate-pulse">Uploading...</span>}
                  </div>
                  {fotoSelesai && (
                    <img src={fotoSelesai} alt="Selesai" className="mt-4 w-32 h-32 object-cover rounded-xl border border-indigo-500/30" />
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setSelectedAduan(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl transition"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleProcessAduan}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl shadow-lg shadow-indigo-900/40 transition"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
