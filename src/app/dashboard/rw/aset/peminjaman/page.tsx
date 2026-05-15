'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RWPeminjamanPage() {
  const { user, isLoading, logout } = useAuth();
  const [peminjaman, setPeminjaman] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPeminjaman = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/aset/peminjaman');
      setPeminjaman(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPeminjaman();
  }, [user]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/aset/peminjaman/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      alert(`Permintaan ${status}`);
      fetchPeminjaman();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui status");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">Peminjaman Aset RW</h1>

        <div className="bg-slate-800/40 rounded-3xl border border-white/5 overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Barang</th>
                <th className="p-4">Peminjam</th>
                <th className="p-4">Keperluan</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center">Memuat data...</td></tr>
              ) : peminjaman.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500 italic">Tidak ada riwayat peminjaman.</td></tr>
              ) : peminjaman.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4 font-bold text-white">{p.aset?.nama_aset}</td>
                  <td className="p-4">
                    <p className="text-white font-semibold">{p.peminjam?.nama}</p>
                    <p className="text-[10px] text-slate-500">{p.peminjam?.role.toUpperCase()}</p>
                  </td>
                  <td className="p-4 text-slate-400">{p.keperluan}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      p.status === 'disetujui' ? 'bg-emerald-500/20 text-emerald-400' :
                      p.status === 'ditolak' ? 'bg-red-500/20 text-red-400' :
                      p.status === 'dikembalikan' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    {p.status === 'menunggu' && (
                      <>
                        <button onClick={() => handleUpdateStatus(p.id, 'ditolak')} className="text-red-400 hover:text-red-300 text-[10px] font-bold">Tolak</button>
                        <button onClick={() => handleUpdateStatus(p.id, 'disetujui')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg">Setujui</button>
                      </>
                    )}
                    {p.status === 'disetujui' && (
                      <button onClick={() => handleUpdateStatus(p.id, 'dikembalikan')} className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-lg">Kembali</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
