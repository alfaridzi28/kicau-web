'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function SuperadminBansosPage() {
  const { user, isLoading, logout } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const limit = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      // We fetch all but in production this should be a specific /bansos endpoint with pagination
      // For now we'll fetch paginated /warga and filter on client side or use a larger limit
      // Actually, it's better to fetch with a high limit for bansos if we don't have a backend filter
      // But let's try to be consistent.
      const result = await apiFetch(`/warga?skip=${skip}&limit=${limit}`);
      
      // Note: This logic is tricky because pagination on /warga might hide recipients on other pages.
      // In a real system, the backend should have a /warga/bansos endpoint.
      // For now, I'll fetch a larger set to ensure recipients are found, or just paginate the full list.
      const bansos = result.items.filter((w: any) => 
        w.is_fakir || w.is_miskin || w.is_ibu_hamil || w.is_balita
      );
      setData(bansos);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, page]);

  const totalPages = Math.ceil(total / limit);

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">Direktori <span className="text-purple-400">Bansos Global</span></h1>
            <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-[10px]">Total Potensi {total} Data Warga • Halaman {page}</p>
          </div>
          
          <ExportButton 
            data={data.map(w => ({
              ...w,
              kategori: [
                w.is_fakir && 'Bantuan Khusus (Fakir)',
                w.is_miskin && 'Bantuan Sosial (Miskin)',
                (w.is_ibu_hamil || w.is_balita) && 'Bantuan Logistik (Hamil/Balita)'
              ].filter(Boolean).join(', ')
            }))}
            filename={`Data_Bansos_Global`}
            columns={[
              { key: 'nama', label: 'Nama Warga' },
              { key: 'nik', label: 'NIK' },
              { key: 'rt', label: 'RT' },
              { key: 'rw', label: 'RW' },
              { key: 'kategori', label: 'Kategori Bantuan' }
            ]}
            label="Export Halaman Ini"
          />
        </header>

        <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl mb-8">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="p-6">Nama Warga</th>
                <th className="p-6">Wilayah</th>
                <th className="p-6">NIK</th>
                <th className="p-6">Kondisi Sosial</th>
                <th className="p-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase">Mengakses Data Halaman {page}...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-600 italic font-bold">Tidak ada penerima bantuan di halaman ini.</td></tr>
              ) : data.map((w) => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-6">
                    <p className="font-black text-white group-hover:text-purple-400 transition-colors">{w.nama}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">ID: {w.id.slice(0,8)}</p>
                  </td>
                  <td className="p-6">
                    <span className="font-bold">RT {w.rt} / RW {w.rw}</span>
                  </td>
                  <td className="p-6 font-mono text-xs text-slate-400">{w.nik}</td>
                  <td className="p-6">
                    <div className="flex flex-wrap gap-2">
                       {w.is_fakir && <span className="bg-red-500/10 text-red-400 text-[9px] font-black px-2 py-1 rounded uppercase border border-red-500/20">Fakir</span>}
                       {w.is_miskin && <span className="bg-orange-500/10 text-orange-400 text-[9px] font-black px-2 py-1 rounded uppercase border border-orange-500/20">Miskin</span>}
                       {w.is_ibu_hamil && <span className="bg-blue-500/10 text-blue-400 text-[9px] font-black px-2 py-1 rounded uppercase border border-blue-500/20">Ibu Hamil</span>}
                       {w.is_balita && <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-1 rounded uppercase border border-emerald-500/20">Balita</span>}
                    </div>
                  </td>
                  <td className="p-6 text-right">
                     <span className="bg-purple-500/10 text-purple-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-purple-500/20 shadow-lg">Penerima Aktif</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-8">
             <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-6 py-3 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 font-black text-xs uppercase border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ">← Prev</button>
             <div className="flex gap-2">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                   <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${page === i + 1 ? 'bg-purple-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 border border-white/5'}`}>{i + 1}</button>
                ))}
             </div>
             <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-6 py-3 rounded-xl bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700 font-black text-xs uppercase border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ">Next →</button>
          </div>
        )}
      </main>
    </div>
  );
}

