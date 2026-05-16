'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import ExportButton from '@/components/ExportButton';

export default function RWBansosPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWarga = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/warga?rw=${user?.rw}&limit=10000`);
      // Filter for warga only who receive any kind of bansos
      setWarga(data.items ? data.items.filter((w: any) => (w.is_fakir || w.is_miskin || w.is_ibu_hamil || w.is_balita)) : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchWarga();
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const stats = {
    fakir: warga.filter(w => w.is_fakir).length,
    miskin: warga.filter(w => w.is_miskin).length,
    ibu_hamil: warga.filter(w => w.is_ibu_hamil).length,
    balita: warga.filter(w => w.is_balita).length,
  };

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">Rekap <span className="text-pink-400">Sosial RW {user.rw}</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Monitoring Kesejahteraan Wilayah • {warga.length} Jiwa Terdata</p>
          </div>
          <ExportButton 
            data={warga}
            filename={`Bansos_RW${user.rw}`}
            columns={[
              { key: 'nama', label: 'Nama Warga' },
              { key: 'nik', label: 'NIK' },
              { key: 'rt', label: 'RT' },
              { key: 'is_fakir', label: 'Fakir' },
              { key: 'is_miskin', label: 'Miskin' },
              { key: 'is_ibu_hamil', label: 'Ibu Hamil' },
              { key: 'is_balita', label: 'Balita' },
              { key: 'alamat', label: 'Alamat' }
            ]}
          />
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <div className="bg-slate-800/40 p-6 rounded-[32px] border border-white/5 shadow-xl">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Penerima</p>
             <p className="text-3xl font-black text-white leading-none">{warga.length}</p>
             <p className="text-[9px] text-slate-600 font-bold mt-2 uppercase">Seluruh Kategori</p>
          </div>
          <StatCard title="Fakir" value={stats.fakir} icon="🔴" color="red" />
          <StatCard title="Miskin" value={stats.miskin} icon="🟠" color="orange" />
          <StatCard title="Ibu Hamil" value={stats.ibu_hamil} icon="💗" color="purple" />
          <StatCard title="Balita" value={stats.balita} icon="👶" color="cyan" />
        </div>

        <div className="bg-slate-800/40 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex justify-between flex-wrap gap-y-4 items-center">
            <h2 className="font-bold text-white">Daftar Penerima Bantuan</h2>
            <span className="text-xs text-slate-500 font-bold uppercase">{warga.length} Warga Terdeteksi</span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Nama</th>
                <th className="p-4">Alamat / RT</th>
                <th className="p-4">Kategori Bansos</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center">Memuat data...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-500 italic">Tidak ada data warga penerima bansos.</td></tr>
              ) : warga.map(w => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <p className="font-bold text-white">{w.nama}</p>
                    <p className="text-xs text-slate-500">{w.nik}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-xs">{w.alamat || '-'}</p>
                    <p className="text-[10px] font-bold text-indigo-400">RT {w.rt}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {w.is_fakir && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 uppercase">Fakir</span>}
                      {w.is_miskin && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 uppercase">Miskin</span>}
                      {w.is_ibu_hamil && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 uppercase">Ibu Hamil</span>}
                      {w.is_balita && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase">Balita</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-indigo-400 hover:text-indigo-300 text-xs font-bold transition">Detail</button>
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




