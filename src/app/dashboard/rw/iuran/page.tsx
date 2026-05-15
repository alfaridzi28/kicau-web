'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function RWIuranPage() {
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
      setRekap([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user, bulanTahun]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const totalKoleksi = Array.isArray(rekap) ? rekap.reduce((acc, curr) => acc + (curr.total_nominal || 0), 0) : 0;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight italic">Monitoring Iuran <span className="text-emerald-400">RW {user.rw}</span></h1>
            <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-[10px]">Rekapitulasi iuran seluruh unit RT di wilayah Anda</p>
          </div>
          <div className="flex gap-4 items-center">
             <div className="flex items-center gap-2 bg-slate-800/40 p-2 rounded-xl border border-white/5 shadow-lg">
                <label className="text-[10px] font-bold text-slate-500 uppercase px-2">Periode:</label>
                <input 
                   type="month" 
                   className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-500"
                   value={bulanTahun}
                   onChange={(e) => setBulanTahun(e.target.value)}
                />
             </div>
             <ExportButton 
               data={rekap}
               filename={`Laporan_Iuran_RW${user.rw}_${bulanTahun}`}
               columns={[
                 { key: 'rt', label: 'RT' },
                 { key: 'total_warga', label: 'Total Warga' },
                 { key: 'sudah_bayar', label: 'Sudah Bayar' },
                 { key: 'belum_bayar', label: 'Belum Bayar' },
                 { key: 'total_nominal', label: 'Total Koleksi (Rp)' }
               ]}
               label="Export Laporan"
             />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <div className="bg-slate-800/40 p-6 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Total Koleksi RW</p>
              <p className="text-2xl font-black text-white">Rp {totalKoleksi.toLocaleString()}</p>
           </div>
           <div className="bg-slate-800/40 p-6 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">RT Terdata</p>
              <p className="text-2xl font-black text-emerald-400">{Array.isArray(rekap) ? rekap.length : 0} Unit</p>
           </div>
           <div className="bg-slate-800/40 p-6 rounded-3xl border border-white/5">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">Periode Aktif</p>
              <p className="text-2xl font-black text-blue-400">{bulanTahun}</p>
           </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
                <tr>
                  <th className="p-6">Unit RT</th>
                  <th className="p-6 text-center">Warga</th>
                  <th className="p-6 text-center">Sudah Bayar</th>
                  <th className="p-6 text-center">Belum Bayar</th>
                  <th className="p-6 text-right">Koleksi RT</th>
                  <th className="p-6 text-center">Progress</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={6} className="p-20 text-center animate-pulse text-slate-500 font-black">MENGAMBIL DATA...</td></tr>
                ) : !Array.isArray(rekap) || rekap.length === 0 ? (
                  <tr><td colSpan={6} className="p-20 text-center text-slate-500 italic">Tidak ada data iuran untuk periode ini.</td></tr>
                ) : rekap.map((row: any) => {
                  const percent = row.total_warga > 0 ? Math.round((row.sudah_bayar / row.total_warga) * 100) : 0;
                  return (
                    <tr key={row.rt} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-6 font-black text-white">RT {row.rt}</td>
                      <td className="p-6 text-center font-bold text-slate-400">{row.total_warga}</td>
                      <td className="p-6 text-center text-emerald-400 font-bold">{row.sudah_bayar}</td>
                      <td className="p-6 text-center text-red-400 font-bold">{row.belum_bayar}</td>
                      <td className="p-6 text-right font-black">Rp {(row.total_nominal || 0).toLocaleString()}</td>
                      <td className="p-6">
                         <div className="flex items-center gap-3 justify-center">
                            <div className="w-24 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                              <div 
                                className={`h-full transition-all duration-1000 ${percent >= 80 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400">{percent}%</span>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
