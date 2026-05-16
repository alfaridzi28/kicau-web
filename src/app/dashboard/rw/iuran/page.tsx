'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';
import SignatureModal from '@/components/SignatureModal';

export default function RWIuranPage() {
  const { user, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'monitoring' | 'warga' | 'buku_kas' | 'input'>('monitoring');
  const [rekap, setRekap] = useState<any[]>([]);
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [transaksiTotal, setTransaksiTotal] = useState(0);
  const [sumPemasukan, setSumPemasukan] = useState(0);
  const [sumPengeluaran, setSumPengeluaran] = useState(0);
  const [transaksiPage, setTransaksiPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const limit = 10;
  const [selectedRt, setSelectedRt] = useState<string | null>(null);
  const [unpaidWarga, setUnpaidWarga] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [nominalSetting, setNominalSetting] = useState<number>(0);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [bulanTahun, setBulanTahun] = useState(new Date().toISOString().slice(0, 7));

  const handleSaveSignature = async (signatureData: string) => {
    try {
      await apiFetch(`/warga/${user?.id}`, {
        method: 'PUT',
        body: JSON.stringify({ tanda_tangan: signatureData })
      });
      
      const updatedUser = { ...user, tanda_tangan: signatureData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      alert("Tanda tangan berhasil disimpan");
      setShowSignatureModal(false);
      window.location.reload(); 
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan tanda tangan");
    }
  };

  const handleDeleteSignature = async () => {
    if (!confirm("Hapus tanda tangan Anda dari sistem?")) return;
    try {
      await apiFetch(`/warga/${user?.id}`, {
        method: 'PUT',
        body: JSON.stringify({ tanda_tangan: null })
      });
      
      const updatedUser = { ...user, tanda_tangan: null };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      alert("Tanda tangan berhasil dihapus");
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus tanda tangan");
    }
  };

  // Cross-RT payment state
  const [filterRt, setFilterRt] = useState('');
  const [wargaList, setWargaList] = useState<any[]>([]);
  const [loadingWarga, setLoadingWarga] = useState(false);

  // Form State for new transaction
  const [newTrans, setNewTrans] = useState({
    tipe: 'pemasukan',
    kategori: 'Donatur',
    nominal: 0,
    keterangan: '',
    bulan_tahun: new Date().toISOString().slice(0, 7)
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const tSkip = (transaksiPage - 1) * limit;
      const [rekapData, settingData, transData] = await Promise.all([
        apiFetch(`/iuran/rt-to-rw-status?bulan_tahun=${bulanTahun}`),
        apiFetch(`/iuran-setting?rw=${user?.rw}`),
        apiFetch(`/iuran/transaksi?bulan_tahun=${bulanTahun}&skip=${tSkip}&limit=${limit}`)
      ]);
      setRekap(rekapData);
      setTransaksi(transData.items || []);
      setTransaksiTotal(transData.total || 0);
      setSumPemasukan(transData.sum_pemasukan || 0);
      setSumPengeluaran(transData.sum_pengeluaran || 0);
      if (settingData.length > 0) setNominalSetting(settingData[0].nominal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, activeTab, bulanTahun, transaksiPage]);

  useEffect(() => {
    if (activeTab === 'warga' && filterRt) {
      fetchWargaByRt();
    }
  }, [filterRt, activeTab]);

  const fetchWargaByRt = async () => {
    setLoadingWarga(true);
    try {
      const data = await apiFetch(`/iuran/rekap-rt?rt=${filterRt}&rw=${user.rw}`);
      setWargaList(data.data || []);
    } catch (err: any) {
      alert(err.message || "Gagal mengambil data warga");
      setWargaList([]);
    } finally {
      setLoadingWarga(false);
    }
  };

  const handleRTSetoran = async (rtData: any) => {
    if (!rtData.rt_chair_id) return alert("Ketua RT tidak terdaftar");
    try {
      await apiFetch('/iuran', {
        method: 'POST',
        body: JSON.stringify({
          user_id: rtData.rt_chair_id,
          nominal: 200000, // Misal nominal setoran RT ke RW
          tipe: 'pemasukan',
          kategori: 'Kas RW',
          keterangan: `Setoran Kas dari RT ${rtData.rt}`,
          bulan_tahun: new Date().toISOString().slice(0, 7)
        })
      });
      alert(`Setoran Kas dari RT ${rtData.rt} berhasil diterima`);
      fetchData(); // Refresh all
    } catch (err: any) {
      alert(err.message || "Gagal menerima setoran");
    }
  };

  const handleCreateTransaksi = async () => {
    if (newTrans.nominal <= 0) return alert("Nominal harus lebih dari 0");
    try {
      await apiFetch('/iuran', {
        method: 'POST',
        body: JSON.stringify({
          ...newTrans,
          user_id: user.id
        })
      });
      alert("Transaksi berhasil dicatat");
      setNewTrans({ ...newTrans, nominal: 0, keterangan: '' });
      setActiveTab('buku_kas');
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat transaksi");
    }
  };

  const fetchUnpaidDetail = async (rt: string) => {
    setSelectedRt(rt);
    setLoadingDetail(true);
    try {
      const data = await apiFetch(`/iuran/unpaid?rt=${rt}`);
      setUnpaidWarga(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateSetting = async () => {
    try {
      await apiFetch('/iuran-setting', {
        method: 'POST',
        body: JSON.stringify({
          rt: 'KAS_RW',
          rw: user?.rw,
          nominal: nominalSetting,
          keterangan: 'Iuran Wajib RT ke RW'
        })
      });
      alert("Nominal Iuran Kas RW berhasil diperbarui");
      setShowSettingModal(false);
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui setting");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const saldo = transaksi.reduce((acc, curr) => {
    return curr.tipe === 'pengeluaran' ? acc - curr.nominal : acc + curr.nominal;
  }, 0);

  const totalPemasukan = transaksi.filter(t => t.tipe !== 'pengeluaran').reduce((acc, t) => acc + t.nominal, 0);
  const totalPengeluaran = transaksi.filter(t => t.tipe === 'pengeluaran').reduce((acc, t) => acc + t.nominal, 0);

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">Manajemen <span className="text-blue-400">Kas RW {user.rw}</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Pusat Kendali Transaksi & Pengawasan Iuran Wilayah</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-800/40 px-6 py-3 rounded-2xl border border-blue-500/20 shadow-lg text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo Kas RW</p>
                <p className="text-2xl font-black text-white leading-none">Rp {saldo.toLocaleString()}</p>
             </div>
             <button 
                onClick={() => setShowSettingModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-black px-4 rounded-2xl border border-white/10 transition-all flex items-center justify-center"
              >
                ⚙️
              </button>
          </div>
        </header>

        {/* Tab & Filter Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2 bg-slate-800/40 p-2 rounded-2xl border border-white/5 w-fit">
             {[
               { id: 'monitoring', label: 'Monitor RT', icon: '📊' },
               { id: 'warga', label: 'Iuran Warga', icon: '👥' },
               { id: 'buku_kas', label: 'Buku Kas Umum', icon: '📖' },
               { id: 'input', label: 'Transaksi RW', icon: '➕' },
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-widest ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-slate-500 hover:text-slate-300'}`}
               >
                  <span>{tab.icon}</span> {tab.label}
               </button>
             ))}
          </div>

          <div className="bg-slate-800/40 p-2 rounded-2xl border border-white/5 flex items-center gap-3">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 border-r border-white/10 whitespace-nowrap">Periode Laporan</label>
             <input 
               type="month" 
               className="bg-transparent text-white font-black text-xs px-4 py-2 outline-none focus:text-blue-400 transition-colors"
               value={bulanTahun}
               onChange={(e) => setBulanTahun(e.target.value)}
             />
          </div>
        </div>

        {activeTab === 'monitoring' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <StatCard title="Total RT" value={rekap.length} icon="🏠" color="blue" />
              <StatCard title="RT Lunas Kas" value={rekap.filter(r => r.status_kas_rw === 'Lunas').length} icon="✅" color="emerald" />
              <StatCard title="RT Belum Setor" value={rekap.filter(r => r.status_kas_rw !== 'Lunas').length} icon="⚠️" color="orange" />
            </div>

            <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">
                  <tr>
                    <th className="p-6">Unit RT</th>
                    <th className="p-6">Status Kas RW</th>
                    <th className="p-6">Realisasi Iuran Warga</th>
                    <th className="p-6">Tunggakan Jiwa</th>
                    <th className="p-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase">Sinkronisasi Data Wilayah...</td></tr>
                  ) : rekap.length === 0 ? (
                    <tr><td colSpan={5} className="p-20 text-center text-slate-600 italic">Belum ada data RT terdeteksi.</td></tr>
                  ) : rekap.map((item) => (
                    <tr key={item.rt} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center font-black text-white">{item.rt}</div>
                           <p className="font-bold text-white">Unit RT {item.rt}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                           <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${
                             item.status_kas_rw === 'Lunas' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                           }`}>
                             {item.status_kas_rw}
                           </span>
                           {item.status_kas_rw !== 'Lunas' && (
                             <button 
                               onClick={() => handleRTSetoran(item)}
                               className="bg-indigo-600 hover:bg-indigo-500 text-white text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
                             >
                               Terima Setoran
                             </button>
                           )}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="w-full max-w-[120px] bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                           <div className="bg-blue-500 h-full transition-all" style={{ width: `${item.performa_warga.persen}%` }}></div>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{item.performa_warga.sudah} / {item.performa_warga.total} Jiwa</p>
                      </td>
                      <td className="p-6">
                        <p className="text-sm font-black text-orange-400">{item.performa_warga.belum} <span className="text-[10px] text-slate-500 uppercase">Orang</span></p>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => fetchUnpaidDetail(item.rt)}
                          className="bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[10px] font-black px-5 py-2.5 rounded-full transition-all border border-indigo-500/20 uppercase tracking-widest"
                        >
                          Audit Warga
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'warga' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex gap-4 mb-8">
                <div className="bg-slate-800/40 p-2 rounded-2xl border border-white/5 flex items-center gap-3">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 border-r border-white/10">Pilih RT</label>
                   <select 
                     className="bg-transparent text-white font-black text-xs px-4 py-2 outline-none"
                     value={filterRt}
                     onChange={e => setFilterRt(e.target.value)}
                   >
                     <option value="" className="bg-slate-900">-- Pilih Unit RT --</option>
                     {rekap.map(r => <option key={r.rt} value={r.rt} className="bg-slate-900">RT {r.rt}</option>)}
                   </select>
                </div>
             </div>

             {filterRt ? (
               <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                       <tr>
                         <th className="p-6">Nama Warga</th>
                         <th className="p-6">Jabatan</th>
                         <th className="p-6">Status Iuran</th>
                         <th className="p-6 text-right">Aksi</th>
                       </tr>
                    </thead>
                    <tbody className="text-sm">
                       {loadingWarga ? (
                         <tr><td colSpan={4} className="p-20 text-center animate-pulse">Menghubungkan ke RT {filterRt}...</td></tr>
                       ) : wargaList.length === 0 ? (
                         <tr><td colSpan={4} className="p-20 text-center text-slate-600 italic">Data warga tidak ditemukan.</td></tr>
                       ) : wargaList.map(w => (
                         <tr key={w.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="p-6">
                               <p className="font-bold text-white">{w.nama}</p>
                               <p className="text-[10px] text-slate-500">{w.nik}</p>
                            </td>
                            <td className="p-6">
                               <span className="text-[10px] font-bold text-slate-400 uppercase">{w.role}</span>
                            </td>
                            <td className="p-6">
                               <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${w.status === 'Lunas' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                 {w.status}
                               </span>
                            </td>
                            <td className="p-6 text-right">
                               <span className="text-[10px] font-bold text-slate-500 italic uppercase">Monitoring Only</span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
               </div>
             ) : (
               <div className="py-20 text-center bg-slate-800/20 rounded-[40px] border border-dashed border-white/10">
                  <p className="text-slate-500 font-bold italic">Silakan pilih unit RT untuk melihat data iuran warga di wilayah tersebut.</p>
               </div>
             )}
          </div>
        )}

        {activeTab === 'buku_kas' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Summary Cards Buku Kas RW */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[32px] backdrop-blur-md">
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Pemasukan RW</p>
                   <p className="text-2xl font-black text-white">Rp {sumPemasukan.toLocaleString()}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[32px] backdrop-blur-md">
                   <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Total Pengeluaran RW</p>
                   <p className="text-2xl font-black text-white">Rp {sumPengeluaran.toLocaleString()}</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-[32px] backdrop-blur-md">
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Saldo Kas RW</p>
                   <p className="text-2xl font-black text-white">Rp {(sumPemasukan - sumPengeluaran).toLocaleString()}</p>
                </div>
             </div>

             <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/5 flex flex-wrap justify-between items-center gap-4">
                   <div className="flex flex-wrap items-center gap-4">
                      <h2 className="font-black text-white uppercase text-xs tracking-widest mr-4">Buku Kas Umum RW</h2>
                      
                      <select 
                        className="bg-slate-800 text-white text-[10px] font-black px-3 py-2 rounded-xl border border-white/10 outline-none focus:border-blue-500"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <option value="all">Semua Tipe</option>
                        <option value="pemasukan">Pemasukan</option>
                        <option value="pengeluaran">Pengeluaran</option>
                        <option value="iuran">Iuran Warga</option>
                      </select>

                      <select 
                        className="bg-slate-800 text-white text-[10px] font-black px-3 py-2 rounded-xl border border-white/10 outline-none focus:border-blue-500"
                        value={filterKategori}
                        onChange={(e) => setFilterKategori(e.target.value)}
                      >
                        <option value="all">Semua Kategori</option>
                        {Array.from(new Set(transaksi.map(t => t.kategori))).filter(k => k).map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                   </div>

                   <div className="flex gap-2">
                     <button onClick={() => setShowReportModal(true)} className="bg-white text-slate-900 text-[10px] font-black px-4 py-2 rounded-xl uppercase transition hover:bg-blue-400 active:scale-95">Buat Laporan</button>
                     <ExportButton 
                       data={transaksi.filter(t => {
                         const matchType = filterType === 'all' || t.tipe === filterType;
                         const matchKat = filterKategori === 'all' || t.kategori === filterKategori;
                         return matchType && matchKat;
                       })}
                       filename={`Laporan_Kas_RW${user.rw}_${bulanTahun}`}
                       columns={[
                         { key: 'created_at', label: 'Tanggal' },
                         { key: 'tipe', label: 'Tipe' },
                         { key: 'kategori', label: 'Kategori' },
                         { key: 'nominal', label: 'Nominal' },
                         { key: 'keterangan', label: 'Keterangan' }
                       ]}
                     />
                   </div>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                    <tr>
                      <th className="p-6">Tanggal</th>
                      <th className="p-6">Jenis</th>
                      <th className="p-6">Kategori</th>
                      <th className="p-6">Nominal</th>
                      <th className="p-6">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {transaksi.filter(t => {
                      const matchType = filterType === 'all' || t.tipe === filterType;
                      const matchKat = filterKategori === 'all' || t.kategori === filterKategori;
                      return matchType && matchKat;
                    }).length === 0 ? (
                      <tr><td colSpan={5} className="p-20 text-center text-slate-600 italic font-bold">Tidak ada aktivitas kas yang sesuai filter.</td></tr>
                    ) : transaksi.filter(t => {
                      const matchType = filterType === 'all' || t.tipe === filterType;
                      const matchKat = filterKategori === 'all' || t.kategori === filterKategori;
                      return matchType && matchKat;
                    }).map(t => (
                      <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-6 text-slate-500 font-bold text-xs">{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="p-6">
                           <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${t.tipe === 'pengeluaran' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                             {t.tipe}
                           </span>
                        </td>
                        <td className="p-6 font-bold text-white uppercase text-[10px] tracking-widest">{t.kategori}</td>
                        <td className={`p-6 font-black ${t.tipe === 'pengeluaran' ? 'text-red-400' : 'text-emerald-400'}`}>
                           {t.tipe === 'pengeluaran' ? '- ' : '+ '} Rp {t.nominal.toLocaleString()}
                        </td>
                        <td className="p-6 text-slate-400 text-xs italic">{t.keterangan || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls Transaksi RW */}
                {transaksiTotal > limit && (
                  <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Halaman {transaksiPage} dari {Math.ceil(transaksiTotal / limit)}</p>
                    <div className="flex gap-2">
                       <button onClick={() => setTransaksiPage(p => Math.max(1, p - 1))} disabled={transaksiPage === 1} className="px-4 py-2 rounded-xl bg-slate-800 text-white disabled:opacity-30 font-black text-[10px] uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ">Prev</button>
                       <button onClick={() => setTransaksiPage(p => Math.min(Math.ceil(transaksiTotal/limit), p + 1))} disabled={transaksiPage === Math.ceil(transaksiTotal/limit)} className="px-4 py-2 rounded-xl bg-slate-800 text-white disabled:opacity-30 font-black text-[10px] uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ">Next</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'input' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
             <div className="bg-slate-800/40 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 shadow-2xl">
                <h2 className="text-2xl font-black text-white mb-8 italic tracking-tighter">Catat <span className="text-blue-400">Transaksi Baru</span></h2>
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Tipe Transaksi</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                          value={newTrans.tipe}
                          onChange={e => setNewTrans({...newTrans, tipe: e.target.value})}
                        >
                          <option value="pemasukan" className="bg-slate-900">Pemasukan (+)</option>
                          <option value="pengeluaran" className="bg-slate-900">Pengeluaran (-)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Kategori</label>
                        <input 
                          type="text" 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                          placeholder="Donatur / Listrik / Alat Tulis"
                          value={newTrans.kategori}
                          onChange={e => setNewTrans({...newTrans, kategori: e.target.value})}
                        />
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nominal (Rp)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white text-3xl font-black focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newTrans.nominal}
                        onChange={e => setNewTrans({...newTrans, nominal: Number(e.target.value)})}
                      />
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Keterangan / Catatan</label>
                      <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-blue-500 h-32"
                        placeholder="Detail peruntukan dana..."
                        value={newTrans.keterangan}
                        onChange={e => setNewTrans({...newTrans, keterangan: e.target.value})}
                      ></textarea>
                   </div>

                   <button 
                    onClick={handleCreateTransaksi}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 rounded-[32px] shadow-xl shadow-blue-900/40 transition-all active:scale-95 uppercase tracking-widest"
                   >
                     Simpan Transaksi
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Modal Detail Audit Warga */}
        {selectedRt && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-2xl p-10 shadow-2xl animate-in zoom-in duration-300">
               <div className="flex justify-between flex-wrap gap-y-4 items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter italic">Audit Tunggakan <span className="text-orange-400">RT {selectedRt}</span></h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Daftar warga yang belum menyelesaikan iuran berjalan</p>
                  </div>
                  <button onClick={() => setSelectedRt(null)} className="text-slate-500 hover:text-white text-2xl">✕</button>
               </div>

               <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {loadingDetail ? (
                    <div className="py-20 text-center animate-pulse text-slate-500 font-black uppercase">Menarik Data Warga...</div>
                  ) : unpaidWarga.length === 0 ? (
                    <div className="py-20 text-center bg-emerald-500/5 rounded-3xl border border-dashed border-emerald-500/20">
                       <p className="text-emerald-400 font-black italic">Hebat! Semua warga di RT ini sudah lunas iuran.</p>
                    </div>
                  ) : unpaidWarga.map(w => (
                    <div key={w.id} className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5">
                       <div>
                          <div className="flex items-center gap-2 mb-1">
                             <p className="font-black text-white">{w.nama}</p>
                             {w.role !== 'warga' && (
                               <span className="bg-amber-500/10 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-tighter">
                                 {w.role} {w.jabatan && `(${w.jabatan})`}
                               </span>
                             )}
                          </div>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">NIK: {w.nik}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-orange-500 uppercase bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 tracking-tighter">Belum Bayar</p>
                       </div>
                    </div>
                  ))}
               </div>

               <div className="mt-10 p-6 bg-blue-600/10 rounded-3xl border border-blue-500/20 flex items-center gap-4">
                  <div className="text-2xl">💡</div>
                  <p className="text-xs text-blue-300 leading-relaxed font-medium">Data ini dapat Anda gunakan sebagai bahan evaluasi saat rapat bulanan bersama Ketua RT {selectedRt} untuk meningkatkan efektivitas penagihan.</p>
               </div>
            </div>
          </div>
        )}

        {/* Modal Setting Iuran Kas RW */}
        {showSettingModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-sm p-10 shadow-2xl animate-in zoom-in">
               <h2 className="text-2xl font-black text-white mb-6 text-center italic tracking-tighter">Atur Iuran <span className="text-blue-400">Kas RW</span></h2>
               <div className="mb-8">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nominal Setoran RT (Rp)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-center text-2xl font-black focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={nominalSetting} 
                    onChange={e => setNominalSetting(Number(e.target.value))} 
                    placeholder="0" 
                  />
                  <p className="text-[9px] text-slate-600 mt-4 italic text-center font-bold">Nominal ini adalah jumlah yang wajib disetorkan oleh setiap RT ke kas pusat RW setiap bulannya.</p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setShowSettingModal(false)} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs">Batal</button>
                  <button onClick={handleUpdateSetting} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/40 transition-all">Simpan</button>
               </div>
            </div>
          </div>
        )}

        {/* Modal Laporan Resmi */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-[60]">
            <div className="bg-white text-slate-900 rounded-[40px] w-full max-w-4xl p-12 shadow-2xl overflow-y-auto max-h-[95vh] print:p-0 print:shadow-none print:rounded-none">
              <div className="flex justify-between flex-wrap gap-y-4 items-start border-b-2 border-slate-900 pb-8 mb-8">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-4xl font-black italic">K</div>
                    <div>
                       <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Laporan Pertanggungjawaban</h2>
                       <h3 className="text-xl font-bold text-slate-600">Keuangan Wilayah RW {user.rw}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Manajemen KICAU — {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Periode Laporan</p>
                    <p className="text-lg font-black">{new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-10">
                 <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Pemasukan</p>
                    <p className="text-2xl font-black text-emerald-700">Rp {totalPemasukan.toLocaleString()}</p>
                 </div>
                 <div className="p-6 bg-red-50 rounded-3xl border border-red-100">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Total Pengeluaran</p>
                    <p className="text-2xl font-black text-red-700">Rp {totalPengeluaran.toLocaleString()}</p>
                 </div>
                 <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Saldo Akhir Kas</p>
                    <p className="text-2xl font-black text-blue-700">Rp {saldo.toLocaleString()}</p>
                 </div>
              </div>

              <div className="mb-12">
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 border-b border-slate-100 pb-2">Rincian Mutasi Keuangan</h4>
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                       <tr>
                          <th className="p-4">Tanggal</th>
                          <th className="p-4">Kategori & Keterangan</th>
                          <th className="p-4 text-right">Debit (+)</th>
                          <th className="p-4 text-right">Kredit (-)</th>
                       </tr>
                    </thead>
                    <tbody className="text-sm">
                       {transaksi.map((t, idx) => (
                         <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                            <td className="p-4 font-bold text-slate-500">{new Date(t.created_at).toLocaleDateString('id-ID')}</td>
                            <td className="p-4">
                               <p className="font-black text-slate-900 uppercase text-[10px]">{t.kategori}</p>
                               <p className="text-xs text-slate-500 italic">{t.keterangan || '-'}</p>
                            </td>
                            <td className="p-4 text-right font-bold text-emerald-600">
                               {t.tipe !== 'pengeluaran' ? `Rp ${t.nominal.toLocaleString()}` : '-'}
                            </td>
                            <td className="p-4 text-right font-bold text-red-600">
                               {t.tipe === 'pengeluaran' ? `Rp ${t.nominal.toLocaleString()}` : '-'}
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              <div className="flex justify-between flex-wrap gap-y-4 items-end pt-10 border-t-2 border-slate-100">
                 <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-white p-2 border-2 border-slate-900 rounded-2xl shadow-sm mb-2">
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED_KICAU_RW${user.rw}_${new Date().getTime()}`} 
                         alt="Verification QR"
                         className="w-full h-full"
                       />
                    </div>
                    <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter text-center">Scan to Verify<br/>KICAU SECURE DOC</p>
                 </div>
                 <div className="text-center w-72 relative">
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 border-4 border-blue-600/20 rounded-full flex items-center justify-center -rotate-12 pointer-events-none">
                       <div className="text-[10px] font-black text-blue-600/30 text-center uppercase leading-tight">Original Document<br/>RW {user.rw}<br/>KICAU SYSTEM</div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mb-16 uppercase tracking-widest">Ketua RW {user.rw}</p>
                    
                    <div className="relative inline-block">
                       {user.tanda_tangan ? (
                         <img 
                           src={user.tanda_tangan} 
                           alt="Signature" 
                           className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-auto mix-blend-multiply pointer-events-none" 
                         />
                       ) : (
                         <button 
                           onClick={() => setShowSignatureModal(true)}
                           className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-3 py-1 rounded-full uppercase tracking-widest animate-pulse print:hidden"
                         >
                           Set Tanda Tangan
                         </button>
                       )}
                       <p className="text-xl font-black text-slate-900 border-b-2 border-slate-900 px-6 italic tracking-tight">{user.nama}</p>
                       <div className="absolute -top-10 -right-10 opacity-60 rotate-12 pointer-events-none">
                          <div className="border-2 border-blue-600 text-blue-600 font-black px-3 py-1.5 rounded-xl text-xs uppercase tracking-tighter bg-white shadow-xl shadow-blue-900/10">DIGITALLY SIGNED</div>
                       </div>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-3 italic uppercase">NIK: {user.nik} • {new Date().toLocaleTimeString()}</p>
                 </div>
              </div>

              <div className="mt-12 flex gap-4 print:hidden">
                 <button onClick={() => setShowReportModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs">Tutup</button>
                 {user.tanda_tangan && (
                    <>
                      <button 
                        onClick={() => setShowSignatureModal(true)} 
                        className="flex-1 py-4 bg-slate-800 text-white font-black rounded-2xl uppercase text-xs transition-all hover:bg-slate-700"
                      >
                        Ganti TTD
                      </button>
                      <button 
                        onClick={handleDeleteSignature} 
                        className="flex-1 py-4 bg-red-600/10 text-red-500 font-black rounded-2xl uppercase text-xs transition-all hover:bg-red-600 hover:text-white"
                      >
                        Hapus TTD
                      </button>
                    </>
                  )}
                 <button onClick={() => window.print()} className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase text-xs shadow-xl shadow-slate-900/40">Cetak Laporan</button>
              </div>
            </div>
          </div>
        )}

        <SignatureModal 
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          onSave={handleSaveSignature}
        />
      </main>
    </div>
  );
}


