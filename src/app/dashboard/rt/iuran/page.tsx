'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';
import SignatureModal from '@/components/SignatureModal';

export default function RTIuranPage() {
  const { user, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'monitoring' | 'buku_kas' | 'input'>('monitoring');
  const [warga, setWarga] = useState<any[]>([]);
  const [unpaid, setUnpaid] = useState<any[]>([]);
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [transaksiTotal, setTransaksiTotal] = useState(0);
  const [sumPemasukan, setSumPemasukan] = useState(0);
  const [sumPengeluaran, setSumPengeluaran] = useState(0);
  const [transaksiPage, setTransaksiPage] = useState(1);
  const [wargaTotal, setWargaTotal] = useState(0);
  const [wargaPage, setWargaPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const limit = 10;
  const [nominalSetting, setNominalSetting] = useState<number>(50000);
  const [showSettingModal, setShowSettingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [bulanTahun, setBulanTahun] = useState(new Date().toISOString().slice(0, 7));
  const [selectedWarga, setSelectedWarga] = useState<any>(null);

  // Form State for new transaction
  const [newTrans, setNewTrans] = useState({
    tipe: 'pemasukan',
    kategori: 'Lain-lain',
    nominal: 0,
    keterangan: '',
    bulan_tahun: new Date().toISOString().slice(0, 7)
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const cleanRT = String(user?.rt || '').trim();
      const cleanRW = String(user?.rw || '').trim();
      const wSkip = (wargaPage - 1) * limit;
      const tSkip = (transaksiPage - 1) * limit;
      
      const [wargaData, unpaidData, settingData, transData] = await Promise.all([
        apiFetch(`/warga?rt=${cleanRT}&rw=${cleanRW}&skip=${wSkip}&limit=${limit}`),
        apiFetch(`/iuran/unpaid?rt=${cleanRT}&rw=${cleanRW}&bulan_tahun=${bulanTahun}`),
        apiFetch(`/iuran-setting?rt=${cleanRT}&rw=${cleanRW}`),
        apiFetch(`/iuran/transaksi?bulan_tahun=${bulanTahun}&skip=${tSkip}&limit=${limit}`)
      ]);
      
      setWarga(wargaData.items || []);
      setWargaTotal(wargaData.total || 0);
      setUnpaid(unpaidData || []);
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
  }, [user, activeTab, bulanTahun, wargaPage, transaksiPage]);

  const handlePayment = async () => {
    if (!selectedWarga) return;
    try {
      await apiFetch('/iuran', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedWarga.id,
          nominal: nominalSetting,
          tipe: 'iuran',
          kategori: 'Iuran Warga',
          keterangan: `Iuran Bulanan - ${new Date(bulanTahun).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}`,
          bulan_tahun: bulanTahun
        })
      });
      alert(`Pembayaran untuk ${selectedWarga.nama} berhasil dicatat.`);
      setSelectedWarga(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat pembayaran");
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

  const handleUpdateSetting = async () => {
    try {
      await apiFetch('/iuran-setting', {
        method: 'POST',
        body: JSON.stringify({
          rt: user?.rt,
          rw: user?.rw,
          nominal: nominalSetting,
          keterangan: `Iuran Wajib Warga RT ${user?.rt}`
        })
      });
      alert("Nominal Iuran Warga berhasil diperbarui");
      setShowSettingModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui setting");
    }
  };

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

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const saldo = transaksi.reduce((acc, curr) => {
    return curr.tipe === 'pengeluaran' ? acc - curr.nominal : acc + curr.nominal;
  }, 0);

  const totalPemasukan = transaksi.filter(t => t.tipe !== 'pengeluaran').reduce((acc, t) => acc + t.nominal, 0);
  const totalPengeluaran = transaksi.filter(t => t.tipe === 'pengeluaran').reduce((acc, t) => acc + t.nominal, 0);

  const lunasCount = warga.length - unpaid.length;
  const targetIuran = warga.length * nominalSetting;
  const realisasiIuran = lunasCount * nominalSetting;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">Manajemen <span className="text-cyan-400">Kas RT {user.rt}</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Pusat Kendali Keuangan & Transparansi Iuran Warga</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-800/40 px-6 py-3 rounded-2xl border border-cyan-500/20 shadow-lg text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo Kas RT</p>
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

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2 bg-slate-800/40 p-2 rounded-2xl border border-white/5 w-fit">
             {[
               { id: 'monitoring', label: 'Monitor Iuran', icon: '📊' },
               { id: 'buku_kas', label: 'Buku Kas Umum', icon: '📖' },
               { id: 'input', label: 'Transaksi Baru', icon: '➕' },
             ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 uppercase tracking-widest ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/40' : 'text-slate-500 hover:text-slate-300'}`}
               >
                  <span>{tab.icon}</span> {tab.label}
               </button>
             ))}
          </div>

          <div className="bg-slate-800/40 p-2 rounded-2xl border border-white/5 flex items-center gap-3">
             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 border-r border-white/10 whitespace-nowrap">Periode Laporan</label>
             <input 
               type="month" 
               className="bg-transparent text-white font-black text-xs px-4 py-2 outline-none focus:text-cyan-400 transition-colors"
               value={bulanTahun}
               onChange={(e) => setBulanTahun(e.target.value)}
             />
          </div>
        </div>

        {activeTab === 'monitoring' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-end items-center mb-6">
                <div className="bg-cyan-600/10 border border-cyan-500/20 px-6 py-2 rounded-xl">
                   <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Iuran Wajib: Rp {nominalSetting.toLocaleString()} / KK</p>
                </div>
             </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
              <StatCard title="Total Warga" value={warga.length} icon="👥" color="cyan" />
              <StatCard title="Lunas Iuran" value={lunasCount} icon="✅" color="emerald" />
              <StatCard title="Tunggakan" value={unpaid.length} icon="⚠️" color="orange" />
            </div>

            <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                {/* ... existing table code ... */}
                <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">
                  <tr>
                    <th className="p-6">Data Penduduk</th>
                    <th className="p-6">Status Iuran</th>
                    <th className="p-6">Nominal</th>
                    <th className="p-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr><td colSpan={4} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase">Sinkronisasi Data Iuran...</td></tr>
                  ) : warga.length === 0 ? (
                    <tr><td colSpan={4} className="p-20 text-center text-slate-600 italic">Belum ada warga terdaftar di RT ini.</td></tr>
                  ) : warga.map((w) => {
                    const isUnpaid = unpaid.some(u => u.id === w.id);
                    return (
                      <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                        <td className="p-6">
                           <p className="font-bold text-white">{w.nama}</p>
                           <p className="text-[10px] text-slate-500 font-mono">{w.nik}</p>
                        </td>
                        <td className="p-6">
                           <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${
                             !isUnpaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                           }`}>
                             {!isUnpaid ? 'Lunas' : 'Belum Bayar'}
                           </span>
                        </td>
                        <td className="p-6">
                           <p className="text-sm font-black text-slate-300">Rp {nominalSetting.toLocaleString()}</p>
                        </td>
                        <td className="p-6 text-right">
                          {isUnpaid ? (
                            <button 
                              onClick={() => setSelectedWarga(w)}
                              className="bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-black px-5 py-2.5 rounded-full transition-all shadow-lg shadow-cyan-900/20 uppercase tracking-widest"
                            >
                              Terima Bayar
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-500 italic">Terverifikasi ✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls Warga */}
              {wargaTotal > limit && (
                <div className="p-6 border-t border-white/5 flex items-center justify-between bg-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Halaman {wargaPage} dari {Math.ceil(wargaTotal / limit)}</p>
                  <div className="flex gap-2">
                     <button onClick={() => setWargaPage(p => Math.max(1, p - 1))} disabled={wargaPage === 1} className="px-4 py-2 rounded-xl bg-slate-800 text-white disabled:opacity-30 font-black text-[10px] uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ">Prev</button>
                     <button onClick={() => setWargaPage(p => Math.min(Math.ceil(wargaTotal/limit), p + 1))} disabled={wargaPage === Math.ceil(wargaTotal/limit)} className="px-4 py-2 rounded-xl bg-slate-800 text-white disabled:opacity-30 font-black text-[10px] uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'buku_kas' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Summary Cards Buku Kas */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[32px] backdrop-blur-md">
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Pemasukan</p>
                   <p className="text-2xl font-black text-white">Rp {sumPemasukan.toLocaleString()}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[32px] backdrop-blur-md">
                   <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Total Pengeluaran</p>
                   <p className="text-2xl font-black text-white">Rp {sumPengeluaran.toLocaleString()}</p>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-6 rounded-[32px] backdrop-blur-md">
                   <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Saldo Periode Ini</p>
                   <p className="text-2xl font-black text-white">Rp {(sumPemasukan - sumPengeluaran).toLocaleString()}</p>
                </div>
             </div>

             <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/5 flex flex-wrap justify-between items-center gap-4">
                   <div className="flex flex-wrap items-center gap-4">
                      <h2 className="font-black text-white uppercase text-xs tracking-widest mr-4">Buku Kas Umum RT {user.rt}</h2>
                      
                      <select 
                        className="bg-slate-800 text-white text-[10px] font-black px-3 py-2 rounded-xl border border-white/10 outline-none"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <option value="all">Semua Tipe</option>
                        <option value="pemasukan">Pemasukan</option>
                        <option value="pengeluaran">Pengeluaran</option>
                        <option value="iuran">Iuran Warga</option>
                      </select>

                      <select 
                        className="bg-slate-800 text-white text-[10px] font-black px-3 py-2 rounded-xl border border-white/10 outline-none"
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
                     <button onClick={() => setShowReportModal(true)} className="bg-white text-slate-900 text-[10px] font-black px-4 py-2 rounded-xl uppercase transition hover:bg-cyan-400">Buat Laporan</button>
                     <ExportButton 
                       data={transaksi.filter(t => {
                         const matchType = filterType === 'all' || t.tipe === filterType;
                         const matchKat = filterKategori === 'all' || t.kategori === filterKategori;
                         return matchType && matchKat;
                       })}
                       filename={`Laporan_Kas_RT${user.rt}_${bulanTahun}`}
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
                    {transaksi.length === 0 ? (
                      <tr><td colSpan={5} className="p-20 text-center text-slate-600 italic font-bold">Belum ada aktivitas kas yang dicatat.</td></tr>
                    ) : transaksi.map(t => (
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

                {/* Pagination Controls Transaksi */}
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
                <h2 className="text-2xl font-black text-white mb-8 italic tracking-tighter">Catat <span className="text-cyan-400">Transaksi RT</span></h2>
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Tipe Transaksi</label>
                        <select 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
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
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-cyan-500 font-bold"
                          placeholder="Donatur / Iuran / Alat Tulis"
                          value={newTrans.kategori}
                          onChange={e => setNewTrans({...newTrans, kategori: e.target.value})}
                        />
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nominal (Rp)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white text-3xl font-black focus:ring-2 focus:ring-cyan-500 outline-none"
                        value={newTrans.nominal}
                        onChange={e => setNewTrans({...newTrans, nominal: Number(e.target.value)})}
                      />
                   </div>

                   <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Keterangan / Catatan</label>
                      <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-cyan-500 h-32"
                        placeholder="Detail peruntukan dana..."
                        value={newTrans.keterangan}
                        onChange={e => setNewTrans({...newTrans, keterangan: e.target.value})}
                      ></textarea>
                   </div>

                   <button 
                    onClick={handleCreateTransaksi}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-6 rounded-[32px] shadow-xl shadow-cyan-900/40 transition-all active:scale-95 uppercase tracking-widest"
                   >
                     Simpan Transaksi
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Modal: Terima Pembayaran */}
        {selectedWarga && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
              <h2 className="text-3xl font-black text-white mb-2 italic tracking-tighter text-center">Terima <span className="text-cyan-400">Iuran</span></h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8 text-center">Warga: <span className="text-white">{selectedWarga.nama}</span></p>
              
              <div className="space-y-8">
                <div className="text-center">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nominal Iuran Bulanan</p>
                   <p className="text-4xl font-black text-white">Rp {nominalSetting.toLocaleString()}</p>
                </div>
                
                <div className="flex gap-4">
                  <button onClick={() => setSelectedWarga(null)} className="flex-1 py-4 text-slate-500 font-black uppercase text-xs">Batal</button>
                  <button onClick={handlePayment} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-900/40 transition-all uppercase tracking-widest text-[10px]">Catat Lunas</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Setting Iuran RT */}
        {showSettingModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-sm p-10 shadow-2xl animate-in zoom-in">
               <h2 className="text-2xl font-black text-white mb-6 text-center italic tracking-tighter">Atur Iuran <span className="text-cyan-400">Wajib RT</span></h2>
               <div className="mb-8">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block text-center">Nominal Per KK (Rp)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-center text-2xl font-black focus:ring-2 focus:ring-cyan-500 outline-none" 
                    value={nominalSetting} 
                    onChange={e => setNominalSetting(Number(e.target.value))} 
                    placeholder="0" 
                  />
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setShowSettingModal(false)} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs">Batal</button>
                  <button onClick={handleUpdateSetting} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-900/40 transition-all">Simpan</button>
               </div>
            </div>
          </div>
        )}

        {/* Modal Laporan Resmi RT */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 z-[60]">
            <div className="bg-white text-slate-900 rounded-[40px] w-full max-w-4xl p-12 shadow-2xl overflow-y-auto max-h-[95vh] print:p-0 print:shadow-none print:rounded-none">
              <div className="flex justify-between flex-wrap gap-y-4 items-start border-b-2 border-slate-900 pb-8 mb-8">
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-4xl font-black italic">K</div>
                    <div>
                       <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Laporan Kas Bulanan</h2>
                       <h3 className="text-xl font-bold text-slate-600">Wilayah RT {user.rt} / RW {user.rw}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem KICAU — Terbit: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Periode</p>
                    <p className="text-lg font-black">{new Date(bulanTahun).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-10">
                 <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Pemasukan</p>
                    <p className="text-2xl font-black text-emerald-700">Rp {totalPemasukan.toLocaleString()}</p>
                 </div>
                 <div className="p-6 bg-red-50 rounded-3xl border border-red-100 text-center">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">Pengeluaran</p>
                    <p className="text-2xl font-black text-red-700">Rp {totalPengeluaran.toLocaleString()}</p>
                 </div>
                 <div className="p-6 bg-cyan-50 rounded-3xl border border-cyan-100 text-center">
                    <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Saldo Kas RT</p>
                    <p className="text-2xl font-black text-cyan-700">Rp {saldo.toLocaleString()}</p>
                 </div>
              </div>

              <div className="mb-12">
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6 border-b border-slate-100 pb-2">Rincian Transaksi Kas</h4>
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                       <tr>
                          <th className="p-4">Tanggal</th>
                          <th className="p-4">Kategori</th>
                          <th className="p-4 text-right">Masuk (+)</th>
                          <th className="p-4 text-right">Keluar (-)</th>
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
                    <div className="w-24 h-24 bg-white p-2 border-2 border-slate-900 rounded-2xl mb-2">
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VERIFIED_KICAU_RT${user.rt}_${new Date().getTime()}`} 
                         alt="Verification QR"
                         className="w-full h-full"
                       />
                    </div>
                    <p className="text-[7px] font-black text-slate-400 uppercase text-center">Dokumen Sah Digital<br/>RT {user.rt} KICAU</p>
                 </div>
                 <div className="text-center w-72 relative">
                    <p className="text-xs font-bold text-slate-500 mb-16 uppercase tracking-widest">Ketua RT {user.rt}</p>
                    
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
                           className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-3 py-1 rounded-full uppercase tracking-widest print:hidden"
                         >
                           Set TTD
                         </button>
                       )}
                       <p className="text-xl font-black text-slate-900 border-b-2 border-slate-900 px-6 italic">{user.nama}</p>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 mt-3 italic uppercase">NIK: {user.nik}</p>
                 </div>
              </div>

              <div className="mt-12 flex gap-4 print:hidden">
                 <button onClick={() => setShowReportModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-xs">Tutup</button>
                 {user.tanda_tangan && (
                    <>
                      <button 
                        onClick={() => setShowSignatureModal(true)} 
                        className="flex-1 py-4 bg-slate-800 text-white font-black rounded-2xl uppercase text-xs transition hover:bg-slate-700"
                      >
                        Ganti TTD
                      </button>
                      <button 
                        onClick={handleDeleteSignature} 
                        className="flex-1 py-4 bg-red-600/10 text-red-500 font-black rounded-2xl uppercase text-xs transition hover:bg-red-600 hover:text-white"
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


