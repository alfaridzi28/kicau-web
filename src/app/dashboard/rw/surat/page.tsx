'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RWSuratPage() {
  const { user, isLoading, logout } = useAuth();
  const [surat, setSurat] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterRt, setFilterRt] = useState('');
  const [filterKat, setFilterKat] = useState('');
  const [loading, setLoading] = useState(true);

  const limit = 10;

  const fetchSurat = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      let url = `/surat?rw=${user?.rw}&skip=${skip}&limit=${limit}`;
      if (filterRt) url += `&rt=${filterRt}`;
      if (filterKat) url += `&status=${filterKat}`; // Backend uses status for filtering usually in the current schema or we can add category
      
      const data = await apiFetch(url);
      setSurat(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSurat();
  }, [user, page, filterRt, filterKat]);

  const totalPages = Math.ceil(total / limit);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter">Arsip <span className="text-indigo-400">Administrasi RW</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Monitoring & Pengawasan Dokumen Pengantar Warga • Halaman {page} dari {totalPages || 1}</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-800/40 p-2 rounded-2xl border border-white/5 flex gap-2">
               <select 
                 className="bg-transparent text-xs font-black text-white px-4 outline-none border-r border-white/5"
                 value={filterRt}
                 onChange={e => setFilterRt(e.target.value)}
               >
                 <option value="" className="bg-slate-900">Semua RT</option>
                 {Array.from({length: 20}).map((_, i) => (
                   <option key={i} value={String(i+1).padStart(2, '0')} className="bg-slate-900">RT {String(i+1).padStart(2, '0')}</option>
                 ))}
               </select>
               <select 
                 className="bg-transparent text-xs font-black text-white px-4 outline-none"
                 value={filterKat}
                 onChange={e => setFilterKat(e.target.value)}
               >
                 <option value="" className="bg-slate-900">Semua Status</option>
                 <option value="pending" className="bg-slate-900">Menunggu</option>
                 <option value="approved" className="bg-slate-900">Disetujui</option>
                 <option value="rejected" className="bg-slate-900">Ditolak</option>
               </select>
            </div>
            <div className="bg-slate-800/40 px-4 py-2 rounded-xl border border-white/5">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Arsip</p>
               <p className="text-lg font-black text-indigo-400 leading-none">{total} <span className="text-[10px] text-slate-600">Dokumen</span></p>
            </div>
          </div>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-10">
             <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-6 py-3 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 font-black text-xs uppercase transition-all border border-white/5">← Prev</button>
             <div className="flex gap-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                   <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${page === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>{i + 1}</button>
                ))}
             </div>
             <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-6 py-3 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 font-black text-xs uppercase transition-all border border-white/5">Next →</button>
          </div>
        )}
      </main>
    </div>
  );
}
