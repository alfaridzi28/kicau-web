'use client';

import { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ImageUpload from '@/components/ImageUpload';

export default function WargaBuatAduanPage() {
  const { user, token, isLoading, logout } = useAuth();
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [foto, setFoto] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRiwayat();
      // Get geolocation on mount
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => console.error("Geolocation error:", err)
        );
      }
    }
  }, [user]);

  const fetchRiwayat = async () => {
    try {
      const data = await apiFetch('/aduan');
      setRiwayat(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/aduan', {
        method: 'POST',
        body: JSON.stringify({
          judul,
          isi,
          foto_bukti: foto,
          latitude: coords?.lat,
          longitude: coords?.lng
        })
      });
      alert("Aduan berhasil dikirim!");
      setJudul('');
      setIsi('');
      setFoto('');
      fetchRiwayat();
    } catch (err: any) {
      alert(err.message || "Gagal mengirim aduan");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight italic decoration-orange-500">Pusat Pengaduan Warga</h1>
          <p className="text-slate-400 mt-1">Laporkan kendala di lingkungan Anda untuk segera kami tindak lanjuti</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl h-fit">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-sm">📢</span>
              Buat Laporan Baru
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Judul Laporan</label>
                <input 
                  type="text"
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  placeholder="Misal: Lampu jalan mati, Sampah menumpuk..."
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Detail Laporan</label>
                <textarea 
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all min-h-[120px]"
                  placeholder="Ceritakan detail permasalahan..."
                  value={isi}
                  onChange={(e) => setIsi(e.target.value)}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Foto Bukti</label>
                  <ImageUpload onUpload={setFoto} currentUrl={foto} token={token || ''} />
                </div>
                <div className="flex flex-col justify-end">
                   <div className={`p-4 rounded-2xl border ${coords ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                      <p className="text-[10px] font-bold uppercase mb-1">Lokasi Otomatis</p>
                      <p className="text-[10px] font-mono leading-tight">
                        {coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : 'Mendeteksi lokasi...'}
                      </p>
                   </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-orange-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Mengirim Laporan...' : 'Kirim Laporan Masyarakat →'}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm">📋</span>
              Status Laporan Saya
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-auto pr-2 custom-scrollbar">
              {riwayat.length === 0 ? (
                <div className="p-10 text-center text-slate-500 italic bg-slate-800/20 rounded-3xl border border-dashed border-white/5">
                  Anda belum pernah mengirim laporan.
                </div>
              ) : riwayat.map(a => (
                <div key={a.id} className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex justify-between flex-wrap gap-y-4 items-start mb-3">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      a.status === 'selesai' ? 'bg-emerald-500/20 text-emerald-400' :
                      a.status === 'diproses' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {a.status.replace('_', ' ')}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono">{new Date(a.created_at).toLocaleDateString('id-ID')}</p>
                  </div>
                  <h3 className="font-bold text-white mb-1">{a.judul}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{a.isi}</p>
                  {a.balasan && (
                    <div className="mt-4 p-3 bg-indigo-500/10 border-l-2 border-indigo-500 rounded-r-xl">
                       <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Tanggapan RT/RW:</p>
                       <p className="text-xs text-slate-300 italic">"{a.balasan}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

