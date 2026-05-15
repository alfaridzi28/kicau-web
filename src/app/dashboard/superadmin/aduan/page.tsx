'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function SuperadminAduanPage() {
  const { user, isLoading, logout } = useAuth();
  const [aduan, setAduan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAduan = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/aduan');
      setAduan(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAduan();
  }, [user]);

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-black text-white tracking-tighter italic">Global Aduan Hub</h1>
          <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-xs">Monitoring Aspirasi & Laporan Seluruh Wilayah</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
           {[
             { label: 'Total Aduan', val: aduan.length, color: 'text-purple-400' },
             { label: 'Pending', val: aduan.filter(a => a.status === 'pending').length, color: 'text-orange-400' },
             { label: 'Diproses', val: aduan.filter(a => a.status === 'diproses').length, color: 'text-blue-400' },
             { label: 'Selesai', val: aduan.filter(a => a.status === 'selesai').length, color: 'text-emerald-400' },
           ].map(s => (
             <div key={s.label} className="bg-slate-800/40 p-6 rounded-3xl border border-white/5 shadow-xl">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
             </div>
           ))}
        </div>

        <div className="space-y-4">
           {loading ? (
             <div className="p-20 text-center animate-pulse text-slate-500 font-black uppercase">Mensinkronisasi Laporan Warga...</div>
           ) : aduan.length === 0 ? (
             <div className="p-20 text-center bg-slate-800/40 rounded-[40px] border-2 border-dashed border-white/5 text-slate-600 font-bold">
                Belum ada aduan yang masuk ke sistem.
             </div>
           ) : aduan.map((a) => (
             <div key={a.id} className="bg-slate-800/40 backdrop-blur-md p-8 rounded-[32px] border border-white/5 hover:bg-white/5 transition-all group flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        a.status === 'selesai' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>{a.status.replace('_', ' ')}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Wilayah: RT {a.user?.rt} / RW {a.user?.rw}</span>
                   </div>
                   <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors mb-1">{a.judul}</h3>
                   <p className="text-slate-400 text-sm line-clamp-2 max-w-2xl">{a.isi}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                   <p className="text-[10px] text-slate-500 font-black uppercase">Pelapor: {a.user?.nama}</p>
                   <p className="text-[9px] text-slate-600 font-mono italic">{new Date(a.created_at).toLocaleString('id-ID')}</p>
                   <button className="mt-2 text-[10px] font-black text-purple-400 uppercase tracking-widest hover:underline">Detail Laporan →</button>
                </div>
             </div>
           ))}
        </div>
      </main>
    </div>
  );
}
