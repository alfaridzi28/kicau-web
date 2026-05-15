'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function LurahWargaPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRT, setFilterRT] = useState('');
  const [filterRW, setFilterRW] = useState('');

  useEffect(() => {
    if (user) {
      setLoading(true);
      apiFetch('/warga').then(data => {
        setWarga(data);
      }).catch(err => {
        console.error(err);
      }).finally(() => setLoading(false));
    }
  }, [user]);

  const filteredWarga = warga.filter(w => {
    return (!filterRT || w.rt === filterRT) && (!filterRW || w.rw === filterRW);
  });

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Database Kependudukan</h1>
            <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-[10px]">Monitoring Data Warga & Verifikasi Identitas Wilayah</p>
          </div>
          <div className="flex gap-4">
             <ExportButton 
               data={filteredWarga}
               filename={`Data_Warga_Kelurahan_${new Date().toISOString().slice(0, 10)}`}
               columns={[
                 { key: 'nama', label: 'Nama Lengkap' },
                 { key: 'nik', label: 'NIK' },
                 { key: 'rt', label: 'RT' },
                 { key: 'rw', label: 'RW' },
                 { key: 'alamat', label: 'Alamat' }
               ]}
               label="Export Data Warga"
             />
          </div>
        </header>

        <div className="flex gap-4 mb-8 bg-slate-800/40 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
           <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-slate-500 uppercase px-2">Filter RW:</label>
              <select className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={filterRW} onChange={e => setFilterRW(e.target.value)}>
                 <option value="">Semua RW</option>
                 {['01', '02', '03', '04', '05'].map(r => <option key={r} value={r}>RW {r}</option>)}
              </select>
           </div>
           <div className="flex items-center gap-3">
              <label className="text-[10px] font-black text-slate-500 uppercase px-2">Filter RT:</label>
              <select className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white" value={filterRT} onChange={e => setFilterRT(e.target.value)}>
                 <option value="">Semua RT</option>
                 {['01', '02', '03', '04', '05'].map(r => <option key={r} value={r}>RT {r}</option>)}
              </select>
           </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-md rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="p-6">Nama Lengkap</th>
                <th className="p-6">Identitas NIK</th>
                <th className="p-6">Wilayah</th>
                <th className="p-6">Kontak</th>
                <th className="p-6">Akses Role</th>
                <th className="p-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-500 font-black">MENGAMBIL DATA WARGA...</td></tr>
              ) : filteredWarga.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-600 italic">Tidak ada data warga ditemukan.</td></tr>
              ) : filteredWarga.map((w) => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-6">
                    <p className="font-black text-white group-hover:text-indigo-400 transition-colors">{w.nama}</p>
                    <p className="text-[9px] text-slate-500 font-mono tracking-tighter italic">UID: {w.id.slice(0,8)}</p>
                  </td>
                  <td className="p-6 text-slate-400 font-mono text-xs">{w.nik}</td>
                  <td className="p-6 font-bold">RT {w.rt || '-'} / RW {w.rw || '-'}</td>
                  <td className="p-6 text-slate-400 font-mono text-xs">{w.no_telp || '-'}</td>
                  <td className="p-6">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
                      w.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                      w.role === 'rt' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {w.role}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                     <button className="text-indigo-400 hover:text-indigo-300 font-black text-[10px] uppercase tracking-widest border border-indigo-500/30 px-4 py-1.5 rounded-full hover:bg-indigo-500/10 transition">Detail Profile</button>
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
