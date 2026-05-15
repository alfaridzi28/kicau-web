'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function WargaAsetPage() {
  const { user, isLoading, logout } = useAuth();
  const [aset, setAset] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAset = async () => {
    setLoading(true);
    try {
      // Warga only sees assets from their own RT
      const data = await apiFetch(`/aset?rt=${user?.rt}&rw=${user?.rw}&kepemilikan=aset_rt`);
      setAset(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAset();
  }, [user]);

  const handlePinjam = async (asetId: string) => {
    const keperluan = prompt("Apa keperluan peminjaman Anda?");
    if (!keperluan) return;

    try {
      await apiFetch('/aset/pinjam', {
        method: 'POST',
        body: JSON.stringify({ aset_id: asetId, keperluan })
      });
      alert("Permintaan peminjaman telah dikirim ke Ketua RT. Mohon tunggu persetujuan.");
      fetchAset();
    } catch (err: any) {
      alert(err.message || "Gagal meminjam aset");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">Peminjaman Aset RT {user.rt}</h1>
          <p className="text-slate-400">Fasilitas umum yang tersedia untuk warga di wilayah Anda</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500">Memuat data...</div>
          ) : aset.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 italic">Belum ada aset terdaftar di RT Anda.</div>
          ) : aset.map(item => (
            <div key={item.id} className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden flex flex-col">
              <div className="h-40 bg-slate-900 relative">
                {item.foto ? <img src={item.foto} alt={item.nama_aset} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${item.status === 'tersedia' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-white mb-1">{item.nama_aset}</h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.deskripsi || 'Tidak ada deskripsi.'}</p>
                
                <div className="mt-auto">
                  <button 
                    onClick={() => handlePinjam(item.id)}
                    disabled={item.status !== 'tersedia'}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition ${
                      item.status === 'tersedia' 
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/40' 
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {item.status === 'tersedia' ? "Pinjam Sekarang" : "Sedang Dipinjam"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
