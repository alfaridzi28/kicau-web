'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';

export default function WargaAsetPage() {
  const { user, isLoading, logout } = useAuth();
  const [aset, setAset] = useState<any[]>([]);
  const [peminjaman, setPeminjaman] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPinjamModal, setShowPinjamModal] = useState(false);
  const [selectedAset, setSelectedAset] = useState<any>(null);
  const [keperluan, setKeperluan] = useState('');
  const [activeTab, setActiveTab] = useState<'katalog' | 'riwayat'>('katalog');

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch available assets (RT + RW)
      const asetRes = await apiFetch('/aset?limit=50');
      setAset(asetRes.items || []);

      // 2. Fetch my borrowing history
      const pinjamRes = await apiFetch('/aset/peminjaman');
      setPeminjaman(pinjamRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handlePinjam = async () => {
    if (!keperluan) {
      alert("Harap masukkan keperluan peminjaman");
      return;
    }
    try {
      await apiFetch('/aset/pinjam', {
        method: 'POST',
        body: JSON.stringify({ aset_id: selectedAset.id, keperluan })
      });
      alert("Permintaan peminjaman telah dikirim. Mohon tunggu persetujuan pengurus.");
      setShowPinjamModal(false);
      setKeperluan('');
      fetchData();
      setActiveTab('riwayat');
    } catch (err: any) {
      alert(err.message || "Gagal meminjam aset");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const stats = {
    total: aset.length,
    tersedia: aset.filter(a => a.status === 'tersedia').length,
    dipinjam: peminjaman.filter(p => p.status === 'disetujui').length
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10"></div>
        
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top duration-700">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Katalog <span className="text-indigo-400">Aset Wilayah</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-[0.2em] text-[10px]">Fasilitas RT {user.rt} & RW {user.rw} • Peminjaman Digital Warga</p>
          </div>
          <div className="flex gap-2 bg-slate-800/40 p-1.5 rounded-2xl border border-white/5">
             <button onClick={() => setActiveTab('katalog')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'katalog' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Katalog Aset</button>
             <button onClick={() => setActiveTab('riwayat')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'riwayat' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Pinjaman Saya</button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           <StatCard title="Total Aset" value={stats.total} icon="📦" color="indigo" subtitle="Tersedia di RT/RW" />
           <StatCard title="Siap Pinjam" value={stats.tersedia} icon="✅" color="emerald" subtitle="Aset Kondisi Baik" />
           <StatCard title="Aktif Dipinjam" value={stats.dipinjam} icon="🤝" color="orange" subtitle="Barang yang Anda bawa" />
        </div>

        {activeTab === 'katalog' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom duration-500">
            {loading ? (
              <div className="col-span-full py-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest italic">Sinkronisasi Katalog...</div>
            ) : aset.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-600 italic font-bold border-2 border-dashed border-white/5 rounded-[40px]">Belum ada aset publik yang terdaftar di wilayah Anda.</div>
            ) : aset.map(item => (
              <div key={item.id} className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden flex flex-col group hover:border-indigo-500/30 transition-all hover:shadow-2xl hover:shadow-indigo-900/10">
                <div className="h-48 bg-slate-900 relative overflow-hidden">
                  {item.foto ? (
                    <img src={item.foto} alt={item.nama_aset} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">📦</div>
                  )}
                  <div className="absolute top-4 right-4">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border backdrop-blur-md ${
                      item.status === 'tersedia' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border border-white/10">
                       {item.kepemilikan === 'aset_rw' ? `RW ${user.rw}` : `RT ${user.rt}`}
                    </span>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{item.nama_aset}</h3>
                  <p className="text-xs text-slate-500 mb-6 line-clamp-2 leading-relaxed italic">{item.deskripsi || 'Tidak ada deskripsi produk.'}</p>
                  
                  <div className="mt-auto">
                    <button 
                      onClick={() => { setSelectedAset(item); setShowPinjamModal(true); }}
                      disabled={item.status !== 'tersedia'}
                      className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                        item.status === 'tersedia' 
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-900/40' 
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      {item.status === 'tersedia' ? "Ajukan Peminjaman" : "Tidak Tersedia"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in duration-500">
             <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                   <tr>
                      <th className="p-8">Nama Aset</th>
                      <th className="p-8">Keperluan</th>
                      <th className="p-8 text-center">Status</th>
                      <th className="p-8 text-right">Tanggal</th>
                   </tr>
                </thead>
                <tbody className="text-sm">
                   {peminjaman.length === 0 ? (
                      <tr><td colSpan={4} className="p-20 text-center text-slate-600 italic font-bold uppercase tracking-widest">Anda belum memiliki riwayat peminjaman.</td></tr>
                   ) : peminjaman.map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                         <td className="p-8">
                            <p className="font-black text-white uppercase">{p.aset?.nama_aset}</p>
                            <p className="text-[10px] text-indigo-400 font-mono tracking-tighter">Milik {p.aset?.kepemilikan === 'aset_rw' ? 'RW' : 'RT'}</p>
                         </td>
                         <td className="p-8 text-slate-400 text-xs italic">"{p.keperluan}"</td>
                         <td className="p-8">
                            <div className="flex justify-center">
                               <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                                  p.status === 'disetujui' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  p.status === 'ditolak' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                  p.status === 'dikembalikan' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                  'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse'
                               }`}>
                                  {p.status}
                               </span>
                            </div>
                         </td>
                         <td className="p-8 text-right text-[10px] text-slate-500 font-mono italic">
                            {new Date(p.created_at).toLocaleDateString()}
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}

        {/* Borrow Modal */}
        {showPinjamModal && selectedAset && (
          <div className="fixed inset-0 bg-[#020617]/95 backdrop-blur-2xl flex items-center justify-center p-6 z-50">
            <div className="bg-[#0f172a] border border-white/10 rounded-[48px] w-full max-w-xl p-12 shadow-2xl animate-in zoom-in duration-300">
               <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Form <span className="text-indigo-400">Peminjaman</span></h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Aset: {selectedAset.nama_aset}</p>
                  </div>
                  <button onClick={() => setShowPinjamModal(false)} className="text-slate-500 hover:text-white text-3xl transition-colors">×</button>
               </div>
               
               <div className="space-y-8">
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-6">
                     <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-4xl">
                        {selectedAset.foto ? <img src={selectedAset.foto} className="w-full h-full object-cover rounded-2xl" /> : '📦'}
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Status Aset</p>
                        <p className="text-lg font-black text-white uppercase">{selectedAset.nama_aset}</p>
                        <p className="text-xs text-slate-500 italic">Milik {selectedAset.kepemilikan === 'aset_rw' ? `RW ${user.rw}` : `RT ${user.rt}`}</p>
                     </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Keperluan Peminjaman</label>
                     <textarea 
                        className="w-full bg-slate-950/50 border border-white/10 rounded-[24px] px-8 py-5 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700 resize-none h-32"
                        placeholder="Contoh: Digunakan untuk acara syukuran rumah tangga selama 2 hari..."
                        value={keperluan}
                        onChange={(e) => setKeperluan(e.target.value)}
                     ></textarea>
                  </div>

                  <div className="flex gap-6">
                     <button onClick={() => setShowPinjamModal(false)} className="flex-1 bg-white/5 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-[10px] hover:bg-white/10 transition">Batal</button>
                     <button onClick={handlePinjam} className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-[10px] hover:bg-indigo-500 shadow-2xl shadow-indigo-900/40 transition active:scale-95">Ajukan Sekarang</button>
                  </div>
                  
                  <p className="text-[9px] text-slate-600 text-center uppercase font-bold tracking-widest leading-relaxed">
                     Pengajuan Anda akan divalidasi oleh Ketua {selectedAset.kepemilikan === 'aset_rw' ? 'RW' : 'RT'}. Harap menjaga aset dengan baik selama peminjaman.
                  </p>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
