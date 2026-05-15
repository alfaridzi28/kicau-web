'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';

export default function RTDashboard() {
  const { user, isLoading, logout } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [aduan, setAduan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const [statsData, aduanData] = await Promise.all([
            apiFetch('/stats/dashboard'),
            apiFetch(`/aduan?rt=${user.rt}&rw=${user.rw}&limit=5`)
          ]);
          setStats(statsData);
          setAduan(aduanData);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  if (isLoading || !user || loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white font-bold">
      <div className="relative w-20 h-20">
         <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
         <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-8 text-cyan-400 tracking-widest uppercase text-xs animate-pulse">Menyiapkan Panel Lingkungan...</p>
    </div>
  );

  const totalCollected = (stats.warga_per_rt[user.rt] || 0) * 50000; // Placeholder nominal
  const collectedNow = stats.total_iuran_bulan_ini; // This is global, should be RT specific in production

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative min-w-0">
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-cyan-600/10 to-transparent -z-10"></div>
        
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight italic">Panel RT <span className="text-cyan-500 underline decoration-cyan-500/30">{user.rt}</span></h1>
            <p className="text-slate-400 mt-2 font-medium">Monitoring Wilayah Terpadu & Pelayanan Warga</p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-xl p-4 rounded-3xl border border-white/5 flex gap-8 items-center shadow-2xl">
             <div className="text-right">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Status Wilayah</p>
                <p className="text-sm font-black text-emerald-400">KONDUSIF</p>
             </div>
             <div className="w-12 h-12 rounded-2xl bg-cyan-600 shadow-lg shadow-cyan-900/40 flex items-center justify-center text-2xl">🏠</div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-in fade-in zoom-in duration-1000">
          <StatCard title="Warga RT" value={stats?.warga_per_rt?.[user.rt] || 0} icon="👥" color="cyan" subtitle="Jiwa Terdaftar" />
          <StatCard title="Aduan Baru" value={aduan.filter(a => a.status === 'belum_dibaca').length} icon="📢" color="orange" subtitle="Perlu Respon" />
          <StatCard title="Dana Kas" value={`Rp ${(stats?.total_iuran_bulan_ini || 0).toLocaleString()}`} icon="💰" color="blue" subtitle="Bulan Berjalan" />
          <StatCard title="Bansos" value={stats?.total_bansos_penerima || 0} icon="🤝" color="purple" subtitle="Penerima Manfaat" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
             {/* Progress Chart Container */}
             <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl">
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-2xl font-black text-white flex items-center gap-4">
                     <span className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-xl shadow-inner">📊</span>
                     Statistik Iuran Bulanan
                   </h2>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-2 bg-white/5 rounded-full">Periode: {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</span>
                </div>
                
                <div className="space-y-8">
                   <div className="relative pt-2">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-sm font-bold text-slate-300 uppercase tracking-tighter">Progress Koleksi</span>
                         <span className="text-xl font-black text-cyan-400">84%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-white/10 p-1 shadow-inner">
                         <div className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-1000" style={{ width: '84%' }}></div>
                      </div>
                      <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-500 uppercase">
                         <span>Target: Rp 2.500.000</span>
                         <span>Terkumpul: Rp 2.100.000</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 pt-4">
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                         <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Tepat Waktu</p>
                         <p className="text-2xl font-black text-white">42 <span className="text-xs text-slate-500">Warga</span></p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                         <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Terlambat</p>
                         <p className="text-2xl font-black text-red-400">8 <span className="text-xs text-slate-500">Warga</span></p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Recent Complaints */}
             <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl overflow-hidden relative">
                <div className="flex justify-between items-center mb-10">
                   <h2 className="text-2xl font-black text-white flex items-center gap-4">
                     <span className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center text-xl shadow-inner">📢</span>
                     Aduan Warga Terbaru
                   </h2>
                   <a href="/dashboard/rt/aduan" className="text-xs font-black text-cyan-400 hover:underline uppercase tracking-widest">Lihat Semua →</a>
                </div>
                
                <div className="space-y-4">
                   {aduan.map(a => (
                     <div key={a.id} className="p-6 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/5 transition-all group flex justify-between items-center">
                        <div>
                           <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{a.judul}</h3>
                           <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">{new Date(a.created_at).toLocaleDateString()} · DARI: {a.user?.nama}</p>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-xl ${
                           a.status === 'selesai' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
                        }`}>
                           {a.status.replace('_', ' ')}
                        </span>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="space-y-10">
             {/* Quick Actions Panel */}
             <div className="bg-gradient-to-br from-cyan-700 to-blue-800 rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 text-white opacity-10 group-hover:scale-125 transition-transform duration-700">
                   <span className="text-[180px]">⚡</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-8">Quick Actions</h3>
                <div className="grid grid-cols-1 gap-4 relative z-10">
                   <a href="/dashboard/rt/surat" className="bg-white/10 hover:bg-white/20 p-5 rounded-2xl border border-white/10 flex items-center gap-4 transition group/btn">
                      <span className="text-2xl group-hover/btn:scale-125 transition-transform">📄</span>
                      <span className="font-bold text-white uppercase tracking-widest text-xs">Approval Surat</span>
                   </a>
                   <a href="/dashboard/rt/iuran" className="bg-white/10 hover:bg-white/20 p-5 rounded-2xl border border-white/10 flex items-center gap-4 transition group/btn">
                      <span className="text-2xl group-hover/btn:scale-125 transition-transform">💰</span>
                      <span className="font-bold text-white uppercase tracking-widest text-xs">Catat Iuran</span>
                   </a>
                   <a href="/dashboard/rt/aset" className="bg-white/10 hover:bg-white/20 p-5 rounded-2xl border border-white/10 flex items-center gap-4 transition group/btn">
                      <span className="text-2xl group-hover/btn:scale-125 transition-transform">📦</span>
                      <span className="font-bold text-white uppercase tracking-widest text-xs">Inventaris RT</span>
                   </a>
                   <a href="/dashboard/rt/pemberitahuan" className="bg-white/10 hover:bg-white/20 p-5 rounded-2xl border border-white/10 flex items-center gap-4 transition group/btn">
                      <span className="text-2xl group-hover/btn:scale-125 transition-transform">🔔</span>
                      <span className="font-bold text-white uppercase tracking-widest text-xs">Kirim Info</span>
                   </a>
                </div>
             </div>

             {/* System Status Mini */}
             <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-8 border border-white/5 shadow-2xl">
                <h3 className="text-lg font-black text-white mb-8">Info Wilayah RT {user.rt}</h3>
                <div className="space-y-6">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-widest">Ketua RW</span>
                      <span className="text-white font-black uppercase tracking-tighter">Bapak Ahmad (RW {user.rw})</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-widest">Total Bansos</span>
                      <span className="text-cyan-400 font-black">12 KK</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-widest">Wilayah</span>
                      <span className="text-white font-black uppercase tracking-tighter">Kec. Sambikerep</span>
                   </div>
                </div>
                <div className="mt-10 p-6 bg-white/5 rounded-3xl border border-white/5 text-center">
                   <p className="text-[10px] text-slate-600 font-bold uppercase mb-2 tracking-widest">Update Terakhir</p>
                   <p className="text-xs text-slate-400 font-mono">15 Mei 2026 - 21:40</p>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
