'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function SuperadminIuranPage() {
  const { user, isLoading, logout } = useAuth();
  const [rekap, setRekap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulanTahun, setBulanTahun] = useState(new Date().toISOString().slice(0, 7));

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/iuran/rekap-rw?bulan_tahun=${bulanTahun}`);
      setRekap(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, bulanTahun]);

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white">Konsolidasi Keuangan Global</h1>
            <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-xs">Monitoring Iuran Seluruh Wilayah Kelurahan</p>
          </div>
          
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 bg-slate-800/60 p-2 rounded-xl border border-white/5">
                <label className="text-[10px] font-black text-slate-500 uppercase px-2">Periode:</label>
                <input 
                   type="month" 
                   className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                   value={bulanTahun}
                   onChange={(e) => setBulanTahun(e.target.value)}
                />
             </div>
             <ExportButton 
               data={rekap}
               filename={`Konsolidasi_Iuran_${bulanTahun}`}
               columns={[
                 { key: 'rw', label: 'RW' },
                 { key: 'total_warga', label: 'Total Warga' },
                 { key: 'sudah_bayar', label: 'Sudah Bayar' },
                 { key: 'belum_bayar', label: 'Belum Bayar' },
                 { key: 'total_nominal', label: 'Total Nominal (Rp)' }
               ]}
               label="Export Konsolidasi"
             />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
           <div className="bg-slate-800/40 p-8 rounded-[32px] border border-white/5 shadow-xl">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Total Koleksi Global</p>
              <p className="text-3xl font-black text-white">Rp {Array.isArray(rekap) ? rekap.reduce((acc, curr) => acc + curr.total_nominal, 0).toLocaleString() : '0'}</p>
           </div>
           <div className="bg-slate-800/40 p-8 rounded-[32px] border border-white/5 shadow-xl">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Kepatuhan Rata-rata</p>
              <p className="text-3xl font-black text-emerald-400">
                {Array.isArray(rekap) && rekap.length > 0 ? Math.round((rekap.reduce((acc, curr) => acc + curr.sudah_bayar, 0) / rekap.reduce((acc, curr) => acc + curr.total_warga, 0)) * 100) : 0}%
              </p>
           </div>
           <div className="bg-slate-800/40 p-8 rounded-[32px] border border-white/5 shadow-xl">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Wilayah Terdata</p>
              <p className="text-3xl font-black text-purple-400">{Array.isArray(rekap) ? rekap.length : 0} RW</p>
           </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-[0.2em]">
              <tr>
                <th className="p-6">Wilayah RW</th>
                <th className="p-6 text-center">Warga</th>
                <th className="p-6 text-center">Sudah Bayar</th>
                <th className="p-6 text-center">Belum Bayar</th>
                <th className="p-6 text-right">Total Koleksi</th>
                <th className="p-6 text-center">Persentase</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center font-black text-slate-500 animate-pulse">Sinkronisasi Data Keuangan...</td></tr>
              ) : !Array.isArray(rekap) || rekap.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center text-slate-600 italic">Data tidak ditemukan untuk periode ini.</td></tr>
              ) : rekap.map((row) => {
                const percent = Math.round((row.sudah_bayar / row.total_warga) * 100);
                return (
                  <tr key={row.rw} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                    <td className="p-6 font-black text-white group-hover:text-purple-400 transition-colors">RW {row.rw}</td>
                    <td className="p-6 text-center font-bold">{row.total_warga}</td>
                    <td className="p-6 text-center text-emerald-400 font-bold">{row.sudah_bayar}</td>
                    <td className="p-6 text-center text-red-400 font-bold">{row.belum_bayar}</td>
                    <td className="p-6 text-right font-black">Rp {row.total_nominal.toLocaleString()}</td>
                    <td className="p-6 text-center">
                       <div className="w-24 bg-slate-900 rounded-full h-2 mx-auto overflow-hidden">
                          <div className={`h-full ${percent > 80 ? 'bg-emerald-500' : percent > 50 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${percent}%` }}></div>
                       </div>
                       <span className="text-[9px] font-black mt-1 block uppercase tracking-tighter">{percent}% Lunas</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
