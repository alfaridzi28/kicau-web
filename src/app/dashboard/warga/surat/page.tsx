'use client';

import { useState, useEffect } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function WargaBuatSuratPage() {
  const { user, isLoading, logout } = useAuth();
  const [kategori, setKategori] = useState('Surat Keterangan Domisili');
  const [keterangan, setKeterangan] = useState('');
  const [riwayat, setRiwayat] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRiwayat = async () => {
    try {
      const data = await apiFetch('/surat');
      setRiwayat(data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) fetchRiwayat();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/surat', {
        method: 'POST',
        body: JSON.stringify({ kategori, keterangan })
      });
      alert("Permohonan surat berhasil dikirim!");
      setKeterangan('');
      fetchRiwayat();
    } catch (err: any) {
      alert(err.message || "Gagal mengirim permohonan");
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Layanan Surat Pengantar</h1>
          <p className="text-slate-400 mt-1">Ajukan surat pengantar RT/RW untuk keperluan administrasi Anda</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Form Section */}
          <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">📝</span>
              Form Pengajuan Baru
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Jenis Surat</label>
                <select 
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                >
                  <option>Surat Keterangan Domisili</option>
                  <option>Surat Keterangan Tidak Mampu (SKTM)</option>
                  <option>Surat Keterangan Usaha</option>
                  <option>Surat Pengantar KTP/KK</option>
                  <option>Surat Keterangan Kematian</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Keperluan / Keterangan</label>
                <textarea 
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[120px]"
                  placeholder="Contoh: Untuk persyaratan pendaftaran sekolah anak..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-900/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Mengirim...' : 'Kirim Permohonan →'}
              </button>
            </form>
          </div>

          {/* History Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">🕒</span>
              Riwayat Pengajuan
            </h2>
            <div className="space-y-4 max-h-[500px] overflow-auto pr-2 custom-scrollbar">
              {riwayat.length === 0 ? (
                <div className="p-10 text-center text-slate-500 italic bg-slate-800/20 rounded-3xl border border-dashed border-white/5">
                  Belum ada riwayat pengajuan surat.
                </div>
              ) : riwayat.map(s => (
                <div key={s.id} className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 flex justify-between items-center group hover:border-white/10 transition-all">
                  <div>
                    <p className="font-bold text-white text-sm">{s.kategori}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{new Date(s.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                      s.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      s.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {s.status}
                    </span>
                    {s.status === 'approved' && (
                       <p className="text-[9px] text-indigo-400 mt-2 font-bold cursor-pointer hover:underline">Download PDF</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
