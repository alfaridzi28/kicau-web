'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RWWargaPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Filter by RW
      apiFetch(`/warga?rw=${user.rw}`).then(setWarga).finally(() => setLoading(false));
    }
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-2">Daftar Seluruh Warga RW {user.rw}</h1>
        <p className="text-slate-400 mb-8">Pemantauan data penduduk lintas RT di wilayah RW {user.rw}</p>
        
        <div className="bg-slate-800/40 rounded-3xl border border-white/5 overflow-hidden shadow-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs uppercase font-bold tracking-widest">
                <th className="p-5 border-b border-white/10">Nama / NIK</th>
                <th className="p-5 border-b border-white/10">Wilayah</th>
                <th className="p-5 border-b border-white/10">Status Sosial</th>
                <th className="p-5 border-b border-white/10">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center">Memuat data...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-500 italic">Tidak ada warga terdaftar di wilayah RW ini.</td></tr>
              ) : warga.map((w) => (
                <tr key={w.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <td className="p-5">
                    <p className="font-bold text-white">{w.nama}</p>
                    <p className="text-xs text-slate-500">{w.nik}</p>
                  </td>
                  <td className="p-5 text-slate-400 font-medium">RT {w.rt} / RW {w.rw}</td>
                  <td className="p-5">
                    <div className="flex gap-2">
                       {w.is_miskin && <span className="bg-orange-500/10 text-orange-400 text-[10px] px-2 py-0.5 rounded-full border border-orange-500/20">Miskin</span>}
                       {w.is_fakir && <span className="bg-red-500/10 text-red-400 text-[10px] px-2 py-0.5 rounded-full border border-red-500/20">Fakir</span>}
                    </div>
                  </td>
                  <td className="p-5">
                    <button className="text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase">Lihat Detail</button>
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
