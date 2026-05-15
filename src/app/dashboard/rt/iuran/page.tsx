'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function RTIuranPage() {
  const { user, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'iuran' | 'buku_kas' | 'input'>('iuran');
  const [warga, setWarga] = useState<any[]>([]);
  const [unpaid, setUnpaid] = useState<any[]>([]);
  const [transaksi, setTransaksi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarga, setSelectedWarga] = useState<any>(null);
  const [nominal, setNominal] = useState(50000);
  const [bulanTahun, setBulanTahun] = useState(new Date().toISOString().slice(0, 7));

  // Form State for new transaction
  const [newTrans, setNewTrans] = useState({
    tipe: 'pemasukan',
    kategori: 'Iuran Warga',
    nominal: 0,
    keterangan: '',
    bulan_tahun: new Date().toISOString().slice(0, 7)
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allWarga, unpaidData, setting, transData] = await Promise.all([
        apiFetch(`/warga?rt=${user?.rt}&rw=${user?.rw}`),
        apiFetch(`/iuran/unpaid?rt=${user?.rt}&rw=${user?.rw}&bulan_tahun=${bulanTahun}`),
        apiFetch(`/iuran-setting?rt=${user?.rt}&rw=${user?.rw}`),
        apiFetch('/iuran/transaksi')
      ]);
      setWarga(allWarga.items || []);
      setUnpaid(unpaidData);
      setTransaksi(transData);
      if (setting.length > 0) setNominal(setting[0].nominal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, bulanTahun, activeTab]);

  const handlePayment = async () => {
    if (!selectedWarga) return;
    try {
      await apiFetch('/iuran', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedWarga.id,
          nominal: nominal,
          tipe: 'iuran',
          kategori: 'Iuran Warga',
          keterangan: 'Iuran Bulanan',
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

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const saldo = transaksi.reduce((acc, curr) => {
    return curr.tipe === 'pengeluaran' ? acc - curr.nominal : acc + curr.nominal;
  }, 0);

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter leading-none">Keuangan <span className="text-cyan-400">RT {user.rt}</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Pencatatan Iuran & Buku Kas Umum Wilayah</p>
          </div>
          <div className="bg-slate-800/40 px-6 py-3 rounded-2xl border border-cyan-500/20 shadow-lg">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Saldo Kas RT</p>
             <p className="text-2xl font-black text-white leading-none">Rp {saldo.toLocaleString()}</p>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-slate-800/40 p-2 rounded-2xl border border-white/5 w-fit">
           {[
             { id: 'iuran', label: 'Iuran Warga', icon: '👥' },
             { id: 'buku_kas', label: 'Buku Kas RT', icon: '📖' },
             { id: 'input', label: 'Transaksi Baru', icon: '➕' },
           ].map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
             >
                <span>{tab.icon}</span> {tab.label}
             </button>
           ))}
        </div>

        {activeTab === 'iuran' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2 bg-slate-800/40 p-2 rounded-xl border border-white/5">
                  <label className="text-[10px] font-black text-slate-500 uppercase px-4 border-r border-white/10">Periode</label>
                  <input 
                    type="month" 
                    className="bg-transparent border-none px-4 py-1 text-xs text-white outline-none font-bold"
                    value={bulanTahun}
                    onChange={(e) => setBulanTahun(e.target.value)}
                  />
               </div>
               <ExportButton 
                 data={warga.map(w => ({
                   ...w,
                   status: unpaid.some(u => u.id === w.id) ? 'Belum Bayar' : 'Lunas',
                   nominal: nominal,
                   periode: bulanTahun
                 }))}
                 filename={`Iuran_RT${user.rt}_${bulanTahun}`}
                 columns={[
                   { key: 'nama', label: 'Nama Warga' },
                   { key: 'nik', label: 'NIK' },
                   { key: 'status', label: 'Status' },
                   { key: 'nominal', label: 'Nominal' },
                   { key: 'periode', label: 'Periode' }
                 ]}
                 label="Export Rekap"
               />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-slate-800/40 rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                    <tr>
                      <th className="p-6">Nama Warga</th>
                      <th className="p-6">Status</th>
                      <th className="p-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr><td colSpan={3} className="p-20 text-center animate-pulse uppercase font-black text-slate-500">Memuat Data...</td></tr>
                    ) : warga.map(w => {
                      const isUnpaid = unpaid.some(u => u.id === w.id);
                      return (
                        <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-6">
                             <p className="font-bold text-white">{w.nama}</p>
                             <p className="text-[10px] text-slate-500 font-mono">{w.nik}</p>
                          </td>
                          <td className="p-6">
                            <span className={`px-2 py-1 rounded-xl text-[9px] font-black uppercase border ${isUnpaid ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                              {isUnpaid ? 'Belum Bayar' : 'Lunas'}
                            </span>
                          </td>
                          <td className="p-6 text-right">
                            {isUnpaid && (
                              <button 
                                onClick={() => setSelectedWarga(w)}
                                className="bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black px-4 py-2 rounded-xl transition shadow-lg shadow-cyan-900/40 uppercase tracking-widest"
                              >
                                Bayar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-[40px] p-8 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-6xl opacity-10">💰</div>
                  <h3 className="text-white font-black uppercase text-[10px] tracking-widest mb-1">Target Iuran RT</h3>
                  <p className="text-3xl font-black text-white leading-none mb-4">Rp {((warga.length - unpaid.length) * nominal).toLocaleString()}</p>
                  <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden">
                     <div className="bg-white h-full transition-all" style={{ width: `${(warga.length - unpaid.length) / warga.length * 100}%` }}></div>
                  </div>
                  <p className="text-[10px] text-white/60 mt-4 font-bold italic">Bulan {new Date(bulanTahun).toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'buku_kas' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
                   <h2 className="font-black text-white uppercase text-xs tracking-widest">Buku Kas Umum RT {user.rt}</h2>
                   <ExportButton 
                     data={transaksi}
                     filename={`Laporan_Kas_RT${user.rt}`}
                     columns={[
                       { key: 'created_at', label: 'Tanggal' },
                       { key: 'tipe', label: 'Tipe' },
                       { key: 'kategori', label: 'Kategori' },
                       { key: 'nominal', label: 'Nominal' },
                       { key: 'keterangan', label: 'Keterangan' }
                     ]}
                   />
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
             </div>
          </div>
        )}

        {activeTab === 'input' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto lg:mx-0">
             <div className="bg-slate-800/40 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 shadow-2xl">
                <h2 className="text-2xl font-black text-white mb-8 italic tracking-tighter">Catat <span className="text-cyan-400">Kas RT</span></h2>
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Tipe</label>
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
                          placeholder="Listrik / ATK / Sosial"
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
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Keterangan</label>
                      <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-cyan-500 h-32"
                        placeholder="Detail transaksi..."
                        value={newTrans.keterangan}
                        onChange={e => setNewTrans({...newTrans, keterangan: e.target.value})}
                      ></textarea>
                   </div>

                   <button 
                    onClick={handleCreateTransaksi}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-6 rounded-[32px] shadow-xl shadow-cyan-900/40 transition-all active:scale-95 uppercase tracking-widest"
                   >
                     Simpan Catatan Kas
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* Modal Payment */}
        {selectedWarga && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300">
              <h2 className="text-3xl font-black text-white mb-2 italic tracking-tighter">Input <span className="text-cyan-400">Pembayaran</span></h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Mencatat iuran bulanan untuk: <span className="text-white">{selectedWarga.nama}</span></p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nominal Iuran (Rp)</label>
                  <input 
                    type="number" 
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-white font-black text-3xl outline-none focus:ring-2 focus:ring-cyan-500"
                    value={nominal}
                    onChange={(e) => setNominal(parseInt(e.target.value))}
                  />
                </div>
                
                <div className="flex gap-4">
                  <button onClick={() => setSelectedWarga(null)} className="flex-1 py-4 text-slate-500 font-black uppercase text-xs">Batal</button>
                  <button onClick={handlePayment} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-900/40 transition-all uppercase tracking-widest text-[10px]">Konfirmasi</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
