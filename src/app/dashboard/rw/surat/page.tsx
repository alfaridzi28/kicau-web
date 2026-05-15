'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RWSuratPage() {
  const { user, isLoading, logout } = useAuth();
  const [surat, setSurat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSurat = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/surat?rw=${user?.rw}`);
      setSurat(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSurat();
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white italic tracking-tighter">Arsip <span className="text-indigo-400">Administrasi RW</span></h1>
          <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Monitoring & Pengawasan Dokumen Pengantar Warga</p>
        </header>

        <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="p-6">Pemohon (Warga)</th>
                <th className="p-6">Jenis / Kategori</th>
                <th className="p-6">Keterangan</th>
                <th className="p-6">Otoritas RT</th>
                <th className="p-6 text-right">Status Akhir</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase">Sinkronisasi Data Dokumen...</td></tr>
              ) : surat.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-600 italic">Belum ada aktivitas administrasi surat.</td></tr>
              ) : surat.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-white">{s.user?.nama || 'Warga'}</p>
                    <p className="text-[10px] text-slate-500">RT {s.user?.rt || '-'}</p>
                  </td>
                  <td className="p-6">
                    <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-2 py-1 rounded uppercase tracking-tighter border border-indigo-500/20">{s.kategori || s.jenis_surat}</span>
                  </td>
                  <td className="p-6 text-slate-400 text-xs italic max-w-xs truncate">{s.keterangan || s.tujuan || '-'}</td>
                  <td className="p-6">
                     <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Divalidasi Oleh:</p>
                     <p className="text-xs font-bold text-white">Ketua RT {s.user?.rt || '-'}</p>
                  </td>
                  <td className="p-6 text-right">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${
                      s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      s.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                      {s.status.replace('_', ' ')}
                    </span>
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
