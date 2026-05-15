'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import dynamic from 'next/dynamic';

const PetaWarga = dynamic(() => import('@/components/PetaWarga'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500 font-black uppercase tracking-widest text-[10px]">Sinkronisasi Global Map...</div>
});

export default function SuperadminDashboard() {
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
      <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-8 font-black tracking-widest text-purple-400 uppercase text-[10px] animate-pulse">Menghubungkan ke Core KICAU...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative min-w-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] -z-10 rounded-full animate-pulse"></div>
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 animate-in fade-in slide-in-from-top duration-1000">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
               <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Master Control Panel</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tighter">KICAU <span className="text-purple-500 italic">Central</span></h1>
            <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">Otoritas Tertinggi & Manajemen Sistem Global</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="bg-slate-800/40 backdrop-blur-2xl p-6 rounded-[32px] border border-white/5 flex items-center gap-8 shadow-2xl">
              <div className="text-right">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Server Latency</p>
                <p className="text-xl font-black text-emerald-400 font-mono">14ms</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-600 shadow-xl shadow-purple-900/40 flex items-center justify-center text-3xl">⚡</div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-in fade-in zoom-in duration-700">
          <StatCard title="Total Pengguna" value={stats?.total_warga || 0} icon="👥" color="purple" subtitle="Lurah to Warga" />
          <StatCard title="Unit Wilayah" value={stats?.total_rt || 0} icon="🏠" color="blue" subtitle="RT Terdaftar" />
          <StatCard title="Kesejahteraan" value={stats?.total_bansos_penerima || 0} icon="🤝" color="cyan" subtitle="Data Bansos" />
          <StatCard title="Arus Finansial" value={`Rp ${(stats?.total_iuran_bulan_ini || 0).toLocaleString()}`} icon="💰" color="orange" subtitle="Volume Transaksi" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
             {/* Regional Load Visualization */}
             <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl">
                <div className="flex justify-between items-center mb-12">
                   <h2 className="text-2xl font-black text-white flex items-center gap-4">
                     <span className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-xl shadow-inner">📈</span>
                     Beban Wilayah Terpadu
                   </h2>
                   <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-time Data</span>
                   </div>
                </div>
                <div className="flex items-end justify-between h-56 gap-4 px-4">
                  {Object.entries(stats?.warga_per_rt || {}).map(([rt, count]: [any, any]) => (
                    <div key={rt} className="flex-1 flex flex-col items-center gap-4 group cursor-help">
                       <div className="relative w-full flex flex-col items-center">
                          <div className="absolute -top-10 bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                             {count} Jiwa
                          </div>
                          <div 
                            className="w-full max-w-[40px] bg-gradient-to-t from-purple-800 to-purple-500 rounded-t-2xl transition-all duration-700 group-hover:scale-x-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                            style={{ height: `${Math.max((count / (stats?.total_warga || 1)) * 400, 5)}%` }}
                          ></div>
                       </div>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">RT {rt}</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* Global Map Control */}
             <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] border border-white/5 shadow-2xl h-[600px] relative overflow-hidden group">
                <div className="bg-slate-900/40 p-8 border-b border-white/5 flex items-center justify-between">
                   <h2 className="text-2xl font-black text-white flex items-center gap-4">
                     <span className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center text-xl shadow-inner">🗺️</span>
                     Global Population Heatmap
                   </h2>
                </div>
                <div className="h-full w-full rounded-[36px] overflow-hidden grayscale-[0.2] contrast-[1.1] hover:grayscale-0 transition-all duration-1000">
                  <PetaWarga token={localStorage.getItem('token') || ""} /> 
                </div>
             </div>
          </div>

          <div className="space-y-10">
             {/* System Health Center */}
             <div className="bg-gradient-to-br from-purple-700 to-indigo-900 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 text-white opacity-5 group-hover:scale-125 transition-transform duration-1000">
                   <span className="text-[200px]">⚙️</span>
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white mb-8 tracking-tighter">Core Resources</h3>
                  <div className="space-y-4 mb-10">
                    <div className="p-6 bg-white/5 hover:bg-white/10 rounded-[32px] border border-white/10 transition">
                       <p className="text-[10px] text-purple-200 font-black uppercase mb-1 tracking-widest">Database Node</p>
                       <p className="text-sm text-white font-black">Supabase (PostgreSQL 15)</p>
                    </div>
                    <div className="p-6 bg-white/5 hover:bg-white/10 rounded-[32px] border border-white/10 transition">
                       <p className="text-[10px] text-purple-200 font-black uppercase mb-1 tracking-widest">Spatial Engine</p>
                       <p className="text-sm text-white font-black">PostGIS 3.3.2</p>
                    </div>
                  </div>
                  <button className="w-full bg-white text-purple-800 font-black py-5 rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition uppercase tracking-widest text-xs">
                    System Maintenance
                  </button>
                </div>
             </div>

             {/* Live Audit Log */}
             <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl">
                <h3 className="text-xl font-black text-white mb-10 border-b border-white/5 pb-6">Global Audit Log</h3>
                <div className="space-y-10">
                  {[
                    { msg: 'System Geo-filter Optimized', time: 'Just now', color: 'bg-emerald-500' },
                    { msg: 'Automatic Backup Secured', time: '12m ago', color: 'bg-blue-500' },
                    { msg: 'New Area RT 05 Initialized', time: '1h ago', color: 'bg-purple-500' },
                    { msg: 'API Load Balancer Reset', time: '4h ago', color: 'bg-orange-500' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-6 group">
                      <div className="relative">
                         <div className={`w-3 h-3 rounded-full ${log.color} shadow-lg shadow-current/40 group-hover:scale-125 transition-transform`}></div>
                         <div className="absolute top-4 left-1.5 w-px h-10 bg-white/5"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-white mb-1 uppercase tracking-tighter">{log.msg}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">{log.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
