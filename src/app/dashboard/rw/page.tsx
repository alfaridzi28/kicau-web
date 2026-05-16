'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';

export default function RWDashboard() {
  const { user, isLoading, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      apiFetch('/stats/dashboard')
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (isLoading || !user || loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white">
      <div className="relative w-24 h-24">
         <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
         <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-8 text-emerald-400 font-black tracking-widest uppercase text-xs animate-pulse">Menghimpun Data Wilayah RW...</p>
    </div>
  );

  // RT Data for charts (Safe access)
  const rtData = stats?.warga_per_rt || {};
  const rtLabels = Object.keys(rtData);
  const rtValues = Object.values(rtData) as number[];
  const maxWarga = rtValues.length > 0 ? Math.max(...rtValues, 1) : 1;

  // Iuran Progress
  const totalWarga = stats?.total_warga || 0;
  const sudahBayar = stats?.iuran_stats?.sudah_bayar || 0;
  const compliancePercent = totalWarga > 0 ? Math.round((sudahBayar / totalWarga) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative min-w-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] -z-10 rounded-full"></div>
        
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top duration-1000">
          <div>
            <div className="flex items-center gap-2 mb-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Administrator Wilayah RW {user.rw}</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">Command Center <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 italic">RW {user.rw}</span></h1>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/5 flex gap-10 items-center shadow-2xl">
             <div className="text-right">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Total RT Terpantau</p>
                <p className="text-2xl font-black text-white">{rtLabels.length}</p>
             </div>
             <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-900/40 flex items-center justify-center text-3xl">🏘️</div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-in fade-in slide-in-from-bottom duration-700">
           <StatCard title="Total Penduduk" value={totalWarga} icon="👥" color="emerald" subtitle="Jiwa Terdaftar" />
           <StatCard title="Aduan Aktif" value={stats?.total_aduan || 0} icon="📢" color="orange" subtitle="Membutuhkan Tindakan" />
           <StatCard title="Kas Wilayah" value={`Rp ${(stats?.total_iuran_bulan_ini || 0).toLocaleString()}`} icon="💰" color="blue" subtitle="Bulan Berjalan" />
           <StatCard title="Penerima Bansos" value={stats?.total_bansos_penerima || 0} icon="🤝" color="purple" subtitle="Manajemen Sosial" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
             {/* Distribution Chart */}
             <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl">
                <div className="flex justify-between items-center mb-12">
                   <h2 className="text-2xl font-black text-white flex items-center gap-4">
                     <span className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-xl shadow-inner">📊</span>
                     Distribusi Penduduk per RT
                   </h2>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-2 bg-white/5 rounded-full italic">Update Real-Time</span>
                </div>
                
                <div className="flex items-end justify-between h-64 gap-6 px-4">
                   {rtLabels.length === 0 ? (
                     <div className="w-full flex items-center justify-center text-slate-600 font-bold uppercase text-xs italic">Belum ada data RT terdaftar.</div>
                   ) : rtLabels.map((label) => (
                     <div key={label} className="flex-1 flex flex-col items-center group">
                        <div className="relative w-full flex flex-col items-center">
                           <div className="absolute -top-8 text-[10px] font-black text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">{(rtData as any)[label] || 0} Jiwa</div>
                           <div 
                             className="w-full max-w-[40px] bg-gradient-to-t from-emerald-600/80 to-emerald-400 rounded-t-xl transition-all duration-1000 group-hover:from-emerald-500 group-hover:to-cyan-400 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.3)]" 
                             style={{ height: `${(((rtData as any)[label] || 0) / maxWarga) * 100}%` }}
                           ></div>
                        </div>
                        <span className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-tighter">RT {label}</span>
                     </div>
                   ))}
                </div>
             </div>

             {/* Financial Overview Card */}
             <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                   <span className="text-9xl">💰</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-10 flex items-center gap-4">
                   <span className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-xl shadow-inner">💳</span>
                   Rekapitulasi Keuangan RW
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] border border-white/5 shadow-inner">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Terkumpul Bulan Ini</p>
                         <p className="text-4xl font-black text-white leading-none">Rp {(stats?.total_iuran_bulan_ini || 0).toLocaleString()}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/10">
                            <p className="text-[9px] font-black text-emerald-500 uppercase mb-1">Sudah Bayar</p>
                            <p className="text-sm font-black text-white">{sudahBayar} Jiwa</p>
                         </div>
                         <div className="p-6 bg-red-500/10 rounded-3xl border border-red-500/10">
                            <p className="text-[9px] font-black text-red-500 uppercase mb-1">Belum Bayar</p>
                            <p className="text-sm font-black text-white">{stats?.iuran_stats?.belum_bayar || 0} Jiwa</p>
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col justify-center gap-4">
                      <p className="text-sm text-slate-400 leading-relaxed font-medium">Monitoring dana iuran dari seluruh RT di wilayah RW {user.rw}. Sistem mencatat pembayaran secara otomatis berdasarkan input pengurus RT.</p>
                      <a href="/dashboard/rw/iuran" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-center uppercase tracking-widest text-[10px] shadow-lg shadow-blue-900/40 transition-all hover:scale-[1.02]">Laporan Keuangan Wilayah →</a>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-10">
             {/* Action Hub */}
             <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 text-white opacity-10 group-hover:scale-125 transition-transform duration-700">
                   <span className="text-[180px]">🛡️</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-8 tracking-tighter uppercase">RW Control Hub</h3>
                <div className="grid gap-4 relative z-10">
                   <a href="/dashboard/rw/aduan" className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl border border-white/10 flex items-center gap-5 transition group/btn">
                      <span className="text-2xl group-hover/btn:rotate-12 transition-transform">📍</span>
                      <span className="font-bold text-white uppercase tracking-widest text-[11px]">Monitoring Aduan</span>
                   </a>
                   <a href="/dashboard/rw/aset" className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl border border-white/10 flex items-center gap-5 transition group/btn">
                      <span className="text-2xl group-hover/btn:rotate-12 transition-transform">🏪</span>
                      <span className="font-bold text-white uppercase tracking-widest text-[11px]">Inventaris Wilayah</span>
                   </a>
                   <a href="/dashboard/rw/surat" className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl border border-white/10 flex items-center gap-5 transition group/btn">
                      <span className="text-2xl group-hover/btn:rotate-12 transition-transform">📄</span>
                      <span className="font-bold text-white uppercase tracking-widest text-[11px]">Approval Surat</span>
                   </a>
                </div>
             </div>

             {/* Region Status */}
             <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl">
                <h3 className="text-xl font-black text-white mb-8">Otoritas Wilayah</h3>
                <div className="space-y-8">
                   <div className="relative">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                         <span>Kepatuhan Iuran</span>
                         <span className="text-emerald-400">{compliancePercent}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                         <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${compliancePercent}%` }}></div>
                      </div>
                   </div>
                   
                   <div className="pt-6 border-t border-white/5 space-y-4">
                      <div className="flex justify-between items-center text-[10px]">
                         <span className="text-slate-500 font-bold uppercase">Kelurahan</span>
                         <span className="text-white font-black">{stats?.kelurahan || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                         <span className="text-slate-500 font-bold uppercase">Kecamatan</span>
                         <span className="text-white font-black">{stats?.kecamatan || '-'}</span>
                      </div>
                   </div>

                   <div className="pt-4">
                      <div className="flex items-center gap-4 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                         <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Sistem Sinkronisasi Aktif</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
