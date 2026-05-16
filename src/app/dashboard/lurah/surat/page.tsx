'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';

export default function LurahSuratPage() {
  const { user, isLoading, logout } = useAuth();
  const [surat, setSurat] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterRw, setFilterRw] = useState('');
  const [filterRt, setFilterRt] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pending: 0, approved: 0 });

  const limit = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const statusParam = statusFilter === 'all' ? '' : statusFilter;
      const endpoint = `/surat?rw=${filterRw}&rt=${filterRt}&status=${statusParam}&skip=${skip}&limit=${limit}`;
      const data = await apiFetch(endpoint);
      setSurat(data.items || []);
      setTotal(data.total || 0);

      // Global stats for Lurah
      const allRes = await apiFetch(`/surat?limit=5000`);
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

  useEffect(() => {
    if (user) fetchData();
  }, [user, page, filterRw, filterRt, statusFilter]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10"></div>
        
        <header className="mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Monitoring <span className="text-indigo-400">Administrasi Kelurahan</span></h1>
               <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-4 py-1 rounded-full uppercase border border-indigo-500/30 tracking-widest">Akses Lurah</span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Pusat Data Dokumen Kependudukan • Pengawasan Lintas Wilayah</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="bg-slate-800/40 p-2 rounded-2xl border border-white/5 flex gap-4 shadow-inner">
                <div className="flex items-center gap-2">
                   <label className="text-[9px] font-black text-slate-500 uppercase">RW:</label>
                   <select className="bg-slate-900 text-[10px] font-black text-white px-3 py-1.5 rounded-lg outline-none" value={filterRw} onChange={e => setFilterRw(e.target.value)}>
                      <option value="">Semua</option>
                      {["01", "02", "03", "04", "05"].map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
                <div className="flex items-center gap-2">
                   <label className="text-[9px] font-black text-slate-500 uppercase">RT:</label>
                   <select className="bg-slate-900 text-[10px] font-black text-white px-3 py-1.5 rounded-lg outline-none" value={filterRt} onChange={e => setFilterRt(e.target.value)}>
                      <option value="">Semua</option>
                      {["01", "02", "03", "04", "05"].map(r => <option key={r} value={r}>{r}</option>)}
                   </select>
                </div>
             </div>

             <ExportButton 
               data={surat}
               filename={`Arsip_Surat_Kelurahan_${new Date().toLocaleDateString()}`}
               columns={[
                 { key: 'nama', label: 'Nama Warga' },
                 { key: 'rt', label: 'RT' },
                 { key: 'rw', label: 'RW' },
                 { key: 'kategori', label: 'Jenis Surat' },
                 { key: 'status', label: 'Status' }
               ]}
               label="Export XLSX"
             />
          </div>
        </header>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 animate-in fade-in slide-in-from-bottom duration-500">
           <StatCard title="Total Dokumen" value={stats.pending + stats.approved} icon="📂" color="indigo" subtitle="Seluruh Pengajuan" />
           <StatCard title="Sedang Diproses" value={stats.pending} icon="⏳" color="orange" subtitle="Menunggu Validasi RT" />
           <StatCard title="Telah Terbit" value={stats.approved} icon="📜" color="emerald" subtitle="Sudah Disetujui" />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-10 bg-slate-800/40 p-1.5 rounded-[24px] border border-white/5 w-fit">
           {[
             { id: 'all', label: 'Semua Arsip', icon: '📋' },
             { id: 'pending', label: 'Belum Selesai', icon: '⏳' },
             { id: 'approved', label: 'Sudah Selesai', icon: '✅' },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => { setStatusFilter(tab.id); setPage(1); }}
               className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                 statusFilter === tab.id 
                 ? 'bg-indigo-600 text-white shadow-lg' 
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
                <th className="p-8">Identitas Pemohon</th>
                <th className="p-8">Wilayah (RT/RW)</th>
                <th className="p-8">Kategori Dokumen</th>
                <th className="p-8 text-right">Status Akhir</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase">Mengakses Pusat Data Administrasi...</td></tr>
              ) : surat.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-600 italic font-bold uppercase tracking-widest">Tidak ada arsip dokumen di kategori ini.</td></tr>
              ) : surat.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-lg shadow-inner">👤</div>
                       <div>
                          <p className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{s.user?.nama}</p>
                          <p className="text-[10px] text-slate-500 font-mono italic tracking-tighter">NIK: {s.user?.nik}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-8">
                     <span className="text-white font-black text-xs">RT {s.user?.rt || '-'} / RW {s.user?.rw || '-'}</span>
                  </td>
                  <td className="p-8">
                    <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black px-3 py-1 rounded-lg border border-indigo-500/20 uppercase tracking-widest">{s.kategori}</span>
                  </td>
                  <td className="p-8 text-right">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
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

