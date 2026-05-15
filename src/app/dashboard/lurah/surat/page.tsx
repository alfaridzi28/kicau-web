'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function LurahSuratPage() {
  const { user, isLoading, logout } = useAuth();
  const [surat, setSurat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSurat = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/surat');
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
        <header className="mb-12">
          <h1 className="text-5xl font-black text-white italic tracking-tighter">Monitoring <span className="text-indigo-400">Arsip Surat</span></h1>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Rekapitulasi Administrasi Surat Pengantar Seluruh Wilayah</p>
        </header>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-[48px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="p-8">Identitas Warga</th>
                <th className="p-8">Jenis Layanan</th>
                <th className="p-8">Wilayah (RT/RW)</th>
                <th className="p-8">Tanggal Pengajuan</th>
                <th className="p-8 text-right">Status Akhir</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-500 font-black tracking-widest uppercase">Sinkronisasi Basis Data...</td></tr>
              ) : surat.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs italic">Tidak ada catatan surat pengantar ditemukan.</td></tr>
              ) : surat.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-8">
                    <p className="font-black text-white group-hover:text-indigo-400 transition-colors text-base">{s.user?.nama || 'Warga'}</p>
                    <p className="text-[10px] text-slate-500 font-mono italic">NIK: {s.user?.nik || '-'}</p>
                  </td>
                  <td className="p-8">
                    <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter border border-indigo-500/20">{s.kategori || s.jenis_surat}</span>
                  </td>
                  <td className="p-8 font-bold text-slate-400 uppercase text-xs">
                     RT {s.user?.rt || '-'} / RW {s.user?.rw || '-'}
                  </td>
                  <td className="p-8 text-slate-500 font-mono text-xs">
                     {new Date(s.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="p-8 text-right">
                    <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase border ${
                      s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
                      s.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                      'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse'
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
