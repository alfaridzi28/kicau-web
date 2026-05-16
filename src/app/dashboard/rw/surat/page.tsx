'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';

export default function RWSuratPage() {
  const { user, isLoading, logout } = useAuth();
  const [surat, setSurat] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterRt, setFilterRt] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0 });

  const limit = 10;

  const fetchSurat = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const statusParam = statusFilter === 'all' ? '' : statusFilter;
      const endpoint = `/surat?rw=${user?.rw}&rt=${filterRt}&status=${statusParam}&skip=${skip}&limit=${limit}`;
      const data = await apiFetch(endpoint);
      setSurat(data.items || []);
      setTotal(data.total || 0);

      // Fetch global counts for stats
      const allRes = await apiFetch(`/surat?rw=${user?.rw}&limit=2000`);
      const allItems = allRes.items || [];
      setStats({
        pending: allItems.filter((s: any) => s.status === 'pending').length,
        approved: allItems.filter((s: any) => s.status === 'approved').length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAllSurat = async () => {
    const statusParam = statusFilter === 'all' ? '' : statusFilter;
    const res = await apiFetch(`/surat?rw=${user?.rw}&rt=${filterRt}&status=${statusParam}&skip=0&limit=10000`);
    const mappedItems = (res.items || []).map((s: any) => ({
      ...s,
      nama: s.user?.nama || '-',
      rt: s.user?.rt || '-'
    }));
    return { data: mappedItems };
  };

  useEffect(() => {
    if (user) fetchSurat();
  }, [user, page, filterRt, statusFilter]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10"></div>
        
        <header className="mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Monitoring <span className="text-indigo-400">Arsip RW {user.rw}</span></h1>
               <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-indigo-500/30 tracking-widest">Wilayah RW {user.rw}</span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Pengawasan Administrasi Surat Pengantar • Rekapitulasi Data</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="bg-slate-800/40 p-1.5 rounded-2xl border border-white/5 flex gap-2 shadow-inner">
                <label className="text-[9px] font-black text-slate-500 flex items-center px-2 uppercase">Saring RT:</label>
                <select 
                  className="bg-slate-900 text-xs font-black text-white px-4 py-2 rounded-xl outline-none focus:border-indigo-500 transition-all border border-transparent"
                  value={filterRt}
                  onChange={e => { setFilterRt(e.target.value); setPage(1); }}
                >
                  <option value="">Semua RT</option>
                  {Array.from({length: 20}).map((_, i) => (
                    <option key={i} value={String(i+1).padStart(2, '0')}>RT {String(i+1).padStart(2, '0')}</option>
                  ))}
                </select>
             </div>

             <ExportButton 
               data={surat}
               filename={`Monitoring_Surat_RW${user.rw}`}
               columns={[
                 { key: 'nama', label: 'Nama Warga' },
                 { key: 'rt', label: 'RT' },
                 { key: 'kategori', label: 'Kategori' },
                 { key: 'status', label: 'Status' }
               ]}
               label="Export XLSX"
               fetchDataToExport={handleFetchAllSurat}
             />
          </div>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 animate-in fade-in slide-in-from-bottom duration-500">
           <StatCard title="Total Pengajuan" value={total} icon="📋" color="indigo" subtitle="Semua Surat Masuk" />
           <StatCard title="Menunggu RT" value={stats.pending} icon="⏳" color="orange" subtitle="Perlu Tindakan RT" />
           <StatCard title="Telah Selesai" value={stats.approved} icon="✅" color="emerald" subtitle="Sudah Ditandatangani" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-10 bg-slate-800/40 p-1.5 rounded-[24px] border border-white/5 w-fit">
           {[
             { id: 'all', label: 'Seluruh Arsip', icon: '📋' },
             { id: 'pending', label: 'Menunggu', icon: '⏳' },
             { id: 'approved', label: 'Disetujui', icon: '✅' },
             { id: 'rejected', label: 'Ditolak', icon: '❌' },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => { setStatusFilter(tab.id); setPage(1); }}
               className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 statusFilter === tab.id 
                 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                 : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
               }`}
             >
                <span>{tab.icon}</span>
                {tab.label}
             </button>
           ))}
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">
              <tr>
                <th className="p-8">Pemohon / Wilayah</th>
                <th className="p-8">Kategori Surat</th>
                <th className="p-8">Keterangan</th>
                <th className="p-8">Validasi RT</th>
                <th className="p-8 text-right">Status Akhir</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">Sinkronisasi Monitoring Surat...</td></tr>
              ) : surat.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-600 italic font-bold uppercase tracking-widest">Belum ada aktivitas administrasi surat.</td></tr>
              ) : surat.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-lg">👤</div>
                       <div>
                          <p className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{s.user?.nama}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tighter">RT {s.user?.rt || '-'}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-3 py-1 rounded-lg border border-indigo-500/20 uppercase tracking-widest">{s.kategori}</span>
                  </td>
                  <td className="p-8 max-w-xs truncate text-slate-400 text-xs italic">
                    {s.keterangan || '-'}
                  </td>
                  <td className="p-8">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Otoritas:</p>
                     <p className="text-xs font-bold text-white">Ketua RT {s.user?.rt || '-'}</p>
                  </td>
                  <td className="p-8 text-right">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                      s.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      s.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      'bg-orange-500/10 border-orange-500/20 text-orange-400'
                    }`}>
                       <div className={`w-1.5 h-1.5 rounded-full ${
                         s.status === 'approved' ? 'bg-emerald-500' :
                         s.status === 'rejected' ? 'bg-red-500' :
                         'bg-orange-500 animate-pulse'
                       }`}></div>
                       <span className="text-[9px] font-black uppercase tracking-widest">{s.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {total > limit && (
            <div className="p-8 border-t border-white/5 flex items-center justify-between bg-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Halaman {page} dari {Math.ceil(total / limit)}</p>
              <div className="flex gap-3">
                 <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-6 py-2.5 rounded-xl bg-slate-800 text-white disabled:opacity-20 font-black text-[10px] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ">Sebelumnya</button>
                 <button onClick={() => setPage(p => Math.min(Math.ceil(total/limit), p + 1))} disabled={page === Math.ceil(total/limit)} className="px-6 py-2.5 rounded-xl bg-slate-800 text-white disabled:opacity-20 font-black text-[10px] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ">Berikutnya</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

