'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import dynamic from 'next/dynamic';

const PetaWarga = dynamic(() => import('@/components/PetaWarga'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">Menyiapkan Citra Satelit...</div>
});

export default function LurahDashboard() {
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
      <div className="w-20 h-20 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
      <p className="mt-8 font-black tracking-[0.3em] text-indigo-400 uppercase text-[10px]">Inisialisasi Data Kelurahan...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative min-w-0">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10"></div>

        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-left duration-1000">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic decoration-indigo-500">Pusat Kendali <span className="text-indigo-400">Kelurahan</span></h1>
            <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-xs">Monitoring Layanan Publik & Tata Kelola Wilayah</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-slate-800/40 backdrop-blur-xl p-5 rounded-[32px] border border-white/5 flex items-center gap-6 shadow-2xl">
                <div className="text-right">
                   <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Populasi Total</p>
                   <p className="text-3xl font-black text-white leading-none">{stats?.total_warga || 0}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-900/40">🏢</div>
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-in fade-in slide-in-from-bottom duration-700">
           <StatCard title="Jiwa Terdaftar" value={stats?.total_warga || 0} icon="👥" color="indigo" subtitle="Basis Data Kicau" />
           <StatCard title="Total Aduan" value={stats?.total_aduan || 0} icon="📢" color="orange" subtitle="Laporan Masuk" />
           <StatCard title="Penerima Bansos" value={stats?.total_bansos_penerima || 0} icon="🤝" color="purple" subtitle="Keluarga Terdata" />
           <StatCard title="Surat Diproses" value={stats?.total_surat || 0} icon="📄" color="cyan" subtitle="Bulan Berjalan" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 space-y-10">
              {/* Spatial Intelligence Section */}
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-2 border border-white/5 shadow-2xl overflow-hidden h-[500px] relative">
                <div className="bg-slate-900/40 p-6 border-b border-white/5 flex items-center justify-between">
                   <h2 className="text-xl font-black text-white flex items-center gap-3">
                     <span className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-lg">🗺️</span>
                     Visualisasi Spasial Wilayah
                   </h2>
                </div>
                 <PetaWarga token={localStorage.getItem('token') || ""} />
              </div>

              {/* Data Monitoring Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl">
                    <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
                       <span className="text-xl">📊</span> Sebaran RW
                    </h3>
                    <div className="space-y-6">
                       {Object.keys(stats?.sebaran_rw || {}).length > 0 ? Object.keys(stats.sebaran_rw).map(rw => (
                         <div key={rw} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                               <span>RW {rw}</span>
                               <span className="text-indigo-400">{stats.sebaran_rw[rw]} Jiwa</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                               <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(stats.sebaran_rw[rw] / stats.total_warga) * 100}%` }}></div>
                            </div>
                         </div>
                       )) : (
                         <p className="text-xs text-slate-600 italic py-4">Data sebaran wilayah belum tersedia.</p>
                       )}
                    </div>
                 </div>
                 <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl">
                    <h3 className="text-lg font-black text-white mb-8 flex items-center gap-3">
                       <span className="text-xl">🤝</span> Efektivitas Sosial
                    </h3>
                    <div className="flex flex-col items-center justify-center h-full pb-8">
                       <div className="w-32 h-32 rounded-full border-8 border-indigo-500/20 flex items-center justify-center relative">
                          <div className="absolute inset-0 border-8 border-indigo-500 border-t-transparent rounded-full" style={{ transform: `rotate(${stats?.efektivitas_sosial * 3.6}deg)`, transition: 'transform 1.5s ease-out' }}></div>
                          <span className="text-3xl font-black text-white">{stats?.efektivitas_sosial}%</span>
                       </div>
                       <p className="text-[10px] font-black text-slate-500 uppercase mt-6 tracking-[0.2em]">Rasio Warga Terdata Bansos</p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="space-y-10">
              {/* Quick Access Menu */}
              <div className="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
                 <div className="absolute -right-8 -bottom-8 text-white opacity-5 group-hover:scale-125 transition-transform duration-1000">
                    <span className="text-[200px]">💼</span>
                 </div>
                 <h3 className="text-2xl font-black text-white mb-8 tracking-tighter">Akses Cepat Lurah</h3>
                 <div className="grid gap-4 relative z-10">
                    {[
                      { label: 'Monitor Bansos', icon: '🤝', href: '/dashboard/lurah/bansos' },
                      { label: 'Data Penduduk', icon: '👥', href: '/dashboard/lurah/warga' },
                      { label: 'Layanan Surat', icon: '📄', href: '/dashboard/lurah/surat' },
                      { label: 'Pengumuman', icon: '🔔', href: '/dashboard/lurah/pemberitahuan' },
                    ].map(item => (
                      <a key={item.label} href={item.href} className="bg-white/10 hover:bg-white/20 p-6 rounded-2xl border border-white/10 flex items-center gap-5 transition hover:translate-x-2">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-bold text-white uppercase tracking-widest text-[10px]">{item.label}</span>
                      </a>
                    ))}
                 </div>
              </div>

              {/* Security & System Info */}
              <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl">
                 <h3 className="text-xl font-black text-white mb-8">Informasi Sistem</h3>
                 <div className="space-y-6">
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                       <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Waktu Server</p>
                       <p className="text-sm font-bold text-indigo-300 font-mono">{stats?.server_time || 'Synchronizing...'}</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                       <p className="text-[9px] font-black text-slate-500 uppercase mb-2 tracking-widest">Konektivitas</p>
                       <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                          <p className="text-xs font-black text-white uppercase tracking-tighter">Database Terkoneksi</p>
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
