'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';

export default function LurahBansosPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRW, setFilterRW] = useState('');

  const fetchWarga = async () => {
    setLoading(true);
    try {
      let url = '/warga?';
      if (filterRW) url += `rw=${filterRW}&`;
      const data = await apiFetch(url);
      // Filter for recipients only
      setWarga(data.filter((w: any) => (w.is_fakir || w.is_miskin || w.is_ibu_hamil || w.is_balita)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchWarga();
  }, [user, filterRW]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-white tracking-tight italic decoration-indigo-500">Layanan Sosial Kelurahan</h1>
            <p className="text-slate-400 mt-1">Data Terpadu Kesejahteraan Sosial (DTKS) Tingkat Kelurahan</p>
          </div>
          
          <div className="flex items-center gap-3">
             <ExportButton 
               data={warga}
               filename="Bansos_Kelurahan"
               columns={[
                 { key: 'nama', label: 'Nama Warga' },
                 { key: 'nik', label: 'NIK' },
                 { key: 'rt', label: 'RT' },
                 { key: 'rw', label: 'RW' },
                 { key: 'is_fakir', label: 'Bantuan Khusus (Fakir)' },
                 { key: 'is_miskin', label: 'Bantuan Sosial (Miskin)' },
                 { key: 'is_ibu_hamil', label: 'Bantuan Logistik (Hamil)' },
                 { key: 'is_balita', label: 'Bantuan Logistik (Balita)' },
                 { key: 'alamat', label: 'Alamat' }
               ]}
               label="Export Global"
             />
             <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5 shadow-lg">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Filter:</label>
                <select 
                   className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                   value={filterRW}
                   onChange={(e) => setFilterRW(e.target.value)}
                >
                   <option value="">Semua RW</option>
                   {['01', '02', '03', '04', '05'].map(rw => <option key={rw} value={rw}>RW {rw}</option>)}
                </select>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Fakir Global" value={warga.filter(w => w.is_fakir).length} icon="🔴" color="red" />
          <StatCard title="Miskin Global" value={warga.filter(w => w.is_miskin).length} icon="🟠" color="orange" />
          <StatCard title="Ibu Hamil" value={warga.filter(w => w.is_ibu_hamil).length} icon="💗" color="purple" />
          <StatCard title="Anak Balita" value={warga.filter(w => w.is_balita).length} icon="👶" color="cyan" />
        </div>

        <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Warga</th>
                <th className="p-4">RT / RW</th>
                <th className="p-4">Kategori Bansos</th>
                <th className="p-4 text-right">Alamat</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center">Memuat data strategis...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-500 italic">Data tidak ditemukan.</td></tr>
              ) : warga.map(w => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <p className="font-bold text-white">{w.nama}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{w.nik}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-indigo-400">RT {w.rt} / RW {w.rw}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {w.is_fakir && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 uppercase">Fakir</span>}
                      {w.is_miskin && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 uppercase">Miskin</span>}
                      {w.is_ibu_hamil && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 uppercase">Hamil</span>}
                      {w.is_balita && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase">Balita</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right max-w-xs truncate text-xs text-slate-500">
                    {w.alamat || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
