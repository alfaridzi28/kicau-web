'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function RTIuranPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [unpaid, setUnpaid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWarga, setSelectedWarga] = useState<any>(null);
  const [nominal, setNominal] = useState(50000);
  const [bulanTahun, setBulanTahun] = useState(new Date().toISOString().slice(0, 7));

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allWarga, unpaidData, setting] = await Promise.all([
        apiFetch(`/warga?rt=${user?.rt}&rw=${user?.rw}`),
        apiFetch(`/iuran/unpaid?rt=${user?.rt}&rw=${user?.rw}&bulan_tahun=${bulanTahun}`),
        apiFetch(`/iuran-setting?rt=${user?.rt}&rw=${user?.rw}`)
      ]);
      setWarga(allWarga.filter((w: any) => w.role === 'warga'));
      setUnpaid(unpaidData);
      if (setting.length > 0) setNominal(setting[0].nominal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, bulanTahun]);

  const handlePayment = async () => {
    if (!selectedWarga) return;
    try {
      await apiFetch('/iuran', {
        method: 'POST',
        body: JSON.stringify({
          user_id: selectedWarga.id,
          nominal: nominal,
          keterangan: 'Iuran Bulanan',
          bulan_tahun: new Date().toISOString().slice(0, 7)
        })
      });
      alert(`Pembayaran untuk ${selectedWarga.nama} berhasil dicatat.`);
      setSelectedWarga(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat pembayaran");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Iuran RT {user.rt}</h1>
            <p className="text-slate-400">Monitoring dan pencatatan iuran warga</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-slate-800/40 p-2 rounded-xl border border-white/5 shadow-lg">
                <label className="text-[10px] font-bold text-slate-500 uppercase px-2">Periode:</label>
                <input 
                   type="month" 
                   className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
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
                { key: 'nominal', label: 'Nominal (Rp)' },
                { key: 'periode', label: 'Periode' }
              ]}
              label="Export Rekap"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List Warga & Status */}
          <div className="lg:col-span-2 bg-slate-800/40 rounded-3xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="font-bold">Daftar Warga & Status Bulan Ini</h2>
              <span className="text-xs text-slate-500 font-mono">{new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="p-4">Nama</th>
                    <th className="p-4">NIK</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr><td colSpan={4} className="p-10 text-center">Memuat data...</td></tr>
                  ) : warga.map(w => {
                    const isUnpaid = unpaid.some(u => u.id === w.id);
                    return (
                      <tr key={w.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-4 font-bold text-white">{w.nama}</td>
                        <td className="p-4 text-xs text-slate-500 font-mono">{w.nik}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isUnpaid ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {isUnpaid ? 'Belum Bayar' : 'Lunas'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {isUnpaid && (
                            <button 
                              onClick={() => setSelectedWarga(w)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"
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
          </div>

          {/* Quick Info */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 shadow-xl">
              <h3 className="text-white font-bold mb-1">Total Terkumpul</h3>
              <p className="text-3xl font-black text-white">Rp {((warga.length - unpaid.length) * nominal).toLocaleString()}</p>
              <p className="text-xs text-indigo-100/70 mt-2">Dari target Rp {(warga.length * nominal).toLocaleString()}</p>
            </div>

            <div className="bg-slate-800/40 rounded-3xl p-6 border border-white/5">
              <h3 className="font-bold text-white mb-4">Ringkasan</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Warga</span>
                  <span className="text-white font-bold">{warga.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sudah Bayar</span>
                  <span className="text-emerald-400 font-bold">{warga.length - unpaid.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Belum Bayar</span>
                  <span className="text-red-400 font-bold">{unpaid.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Payment */}
        {selectedWarga && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-2">Input Pembayaran</h2>
              <p className="text-slate-400 text-sm mb-6">Mencatat iuran untuk <b>{selectedWarga.nama}</b></p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Nominal Iuran (Rp)</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={nominal}
                    onChange={(e) => setNominal(parseInt(e.target.value))}
                  />
                </div>
                
                <div className="flex gap-4">
                  <button onClick={() => setSelectedWarga(null)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-2xl">Batal</button>
                  <button onClick={handlePayment} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-2xl shadow-lg">Konfirmasi</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
