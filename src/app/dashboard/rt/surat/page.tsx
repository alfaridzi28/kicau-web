'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import SignaturePad from '@/components/SignaturePad';
import StatCard from '@/components/StatCard';

export default function RTSuratPage() {
  const { user, isLoading, logout } = useAuth();
  const [surat, setSurat] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedSurat, setSelectedSurat] = useState<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const limit = 10;

  const fetchSurat = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * limit;
      const endpoint = `/surat?rt=${user?.rt}&rw=${user?.rw}&status=${statusFilter === 'all' ? '' : statusFilter}&skip=${skip}&limit=${limit}`;
      const data = await apiFetch(endpoint);
      setSurat(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSurat();
  }, [user, page, statusFilter]);

  const handleApprove = async () => {
    if (!signature) {
      alert("Harap bubuhkan tanda tangan digital Ketua RT");
      return;
    }
    
    try {
      await apiFetch(`/surat/${selectedSurat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'approved',
          file_ttd_digital: signature,
          catatan: catatan
        })
      });
      alert("Surat berhasil disetujui dan ditandatangani");
      setSelectedSurat(null);
      setSignature(null);
      setCatatan('');
      fetchSurat();
    } catch (err: any) {
      alert(err.message || "Gagal menyetujui surat");
    }
  };

  const handleReject = async () => {
    if (!catatan) {
      alert("Harap masukkan alasan penolakan pada kolom catatan");
      return;
    }
    try {
      await apiFetch(`/surat/${selectedSurat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected', catatan: catatan })
      });
      alert("Surat pengantar telah ditolak");
      setSelectedSurat(null);
      setCatatan('');
      fetchSurat();
    } catch (err: any) {
      alert(err.message || "Gagal menolak surat");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10"></div>
        
        <header className="mb-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Persetujuan <span className="text-indigo-400">Surat Pengantar</span></h1>
               <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-indigo-500/30 tracking-widest">Wilayah RT {user.rt}</span>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Verifikasi Dokumen & Tanda Tangan Digital • Layanan Warga</p>
          </div>
        </header>

        {/* Stats / Quick Filter */}
        <div className="flex gap-2 mb-10 bg-slate-800/40 p-1.5 rounded-[24px] border border-white/5 w-fit animate-in fade-in slide-in-from-bottom duration-500">
           {[
             { id: 'pending', label: 'Menunggu', icon: '⏳', color: 'orange' },
             { id: 'approved', label: 'Disetujui', icon: '✅', color: 'emerald' },
             { id: 'rejected', label: 'Ditolak', icon: '❌', color: 'red' },
             { id: 'all', label: 'Semua Riwayat', icon: '📋', color: 'slate' },
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
                <th className="p-8">Pemohon</th>
                <th className="p-8">Kategori Surat</th>
                <th className="p-8">Keterangan</th>
                <th className="p-8">Status</th>
                <th className="p-8 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest italic">Sinkronisasi Pengajuan Surat...</td></tr>
              ) : surat.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-600 italic font-bold uppercase tracking-widest">Tidak ada pengajuan surat di kategori ini.</td></tr>
              ) : surat.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-lg">👤</div>
                       <div>
                          <p className="font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{s.user?.nama}</p>
                          <p className="text-[10px] text-slate-500 font-mono tracking-tighter italic">NIK: {s.user?.nik}</p>
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
                  <td className="p-8 text-right">
                    {s.status === 'pending' ? (
                      <button 
                        onClick={() => setSelectedSurat(s)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[9px] uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
                      >
                        Tanda Tangani
                      </button>
                    ) : (
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Selesai Diproses</span>
                    )}
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

        {/* Approval Modal */}
        {selectedSurat && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
               <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="p-12 border-r border-white/5">
                     <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic uppercase">Detail <span className="text-indigo-400">Permohonan</span></h2>
                     <div className="space-y-8">
                        <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                           <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl">👤</div>
                           <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Identitas Pemohon</p>
                              <p className="text-xl font-black text-white uppercase">{selectedSurat.user?.nama}</p>
                              <p className="text-xs text-indigo-400 font-mono italic">NIK: {selectedSurat.user?.nik}</p>
                           </div>
                        </div>
                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Kategori Surat</label>
                              <p className="text-lg font-bold text-white bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/20 uppercase tracking-widest">{selectedSurat.kategori}</p>
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Keterangan Warga</label>
                              <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 italic text-sm text-slate-300 leading-relaxed">
                                 "{selectedSurat.keterangan || 'Tidak ada keterangan tambahan dari warga.'}"
                              </div>
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase px-1 tracking-widest">Catatan Ketua RT</label>
                              <textarea 
                                className="w-full bg-slate-800 border border-white/5 rounded-2xl p-4 text-sm text-white h-24 outline-none focus:border-indigo-500 transition-all shadow-inner mt-2"
                                placeholder="Masukkan catatan tambahan atau alasan jika ditolak..."
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                              ></textarea>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-12 bg-white/[0.02]">
                     <div className="flex justify-between flex-wrap gap-y-4 items-center mb-8">
                        <h2 className="text-xl font-black text-white tracking-widest uppercase">Validasi <span className="text-indigo-400">Digital</span></h2>
                        <button onClick={() => setSelectedSurat(null)} className="text-slate-500 hover:text-white transition-colors text-xl">✕</button>
                     </div>
                     <div className="space-y-6">
                        <div className="bg-slate-900 rounded-[32px] p-8 border-2 border-dashed border-white/10 shadow-inner">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 text-center">Tanda Tangan Ketua RT</p>
                           <SignaturePad onChange={setSignature} />
                        </div>
                        <div className="flex gap-4">
                           <button onClick={handleReject} className="flex-1 py-4 rounded-2xl bg-red-500/10 text-red-400 font-black uppercase text-[10px] tracking-[0.2em] border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Tolak Surat</button>
                           <button onClick={handleApprove} className="flex-1 py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-900/40 hover:bg-indigo-500 transition-all active:scale-95">Setujui & TTD</button>
                        </div>
                        <p className="text-[9px] text-slate-600 text-center uppercase font-bold tracking-widest leading-relaxed">
                           Dengan menekan tombol Setujui, Anda secara sah membubuhkan tanda tangan digital pada surat pengantar warga tersebut.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


