'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';

export default function RTDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [aduan, setAduan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !isLoading) {
      const currentRole = user.effective_role || user.role;
      if (currentRole !== 'rt' && currentRole !== 'superadmin' && currentRole !== 'lurah') {
        router.push('/dashboard/warga');
        return;
      }

      const fetchData = async () => {
        try {
          const [statsData, aduanData] = await Promise.all([
            apiFetch('/stats/dashboard'),
            apiFetch(`/aduan?rt=${user.rt}&rw=${user.rw}&limit=5`)
          ]);
          setStats(statsData);
          setAduan(aduanData || []);
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
      <p className="mt-8 text-cyan-400 tracking-widest uppercase text-xs animate-pulse">Sinkronisasi Data Wilayah...</p>
    </div>
  );

  const totalWarga = stats?.total_warga || 0;
  // Dynamic Target based on stats or default
  const iuranNominal = stats?.iuran_setting?.nominal || 50000;
  const totalCollectedTarget = totalWarga * iuranNominal;
  const collectedNow = stats?.total_iuran_bulan_ini || 0;
  const progressPercent = totalCollectedTarget > 0 ? Math.round((collectedNow / totalCollectedTarget) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative min-w-0">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-600/10 to-transparent -z-10"></div>
        
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-top duration-700">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">Panel <span className="text-cyan-400">RT {user?.rt || '-'}</span></h1>
            <p className="text-slate-500 mt-2 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">Pusat Administrasi & Monitoring Wilayah RW {user?.rw}</p>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-2xl p-4 rounded-[32px] border border-white/5 flex gap-8 items-center shadow-2xl">
             <div className="text-right">
                <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Status Sistem</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Connect</p>
                </div>
             </div>
             <div className="w-14 h-14 rounded-2xl bg-cyan-600 shadow-xl shadow-cyan-900/40 flex items-center justify-center text-3xl border border-cyan-400/20">🏛️</div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 animate-in fade-in zoom-in duration-1000">
          <StatCard title="Total Warga" value={totalWarga} icon="👥" color="cyan" subtitle="Jiwa Terdaftar" />
          <StatCard title="Aduan Baru" value={aduan.filter(a => a.status === 'belum_dibaca').length} icon="📢" color="orange" subtitle="Perlu Respon" />
          <StatCard title="Dana Iuran" value={`Rp ${collectedNow.toLocaleString()}`} icon="💰" color="blue" subtitle="Bulan Berjalan" />
          <StatCard title="Penerima Bansos" value={stats?.total_bansos_penerima || 0} icon="🤝" color="purple" subtitle="Target Manfaat" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
             <div className="bg-slate-800/30 backdrop-blur-3xl rounded-[56px] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] rounded-full"></div>
                <div className="flex justify-between items-center mb-12 relative z-10">
                   <h2 className="text-3xl font-black text-white flex items-center gap-5 italic tracking-tighter uppercase">
                     <span className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-2xl shadow-inner border border-cyan-500/20">📊</span>
                     Statistik Iuran
                   </h2>
                   <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] px-6 py-3 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                     PERIODE: {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase()}
                   </span>
                </div>
                
                <div className="space-y-10 relative z-10">
                   <div className="relative">
                      <div className="flex justify-between items-end mb-4">
                         <div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Capaian Koleksi</span>
                            <span className="text-5xl font-black text-white italic tracking-tighter">{progressPercent}%</span>
                         </div>
                         <div className="text-right">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Terkumpul</span>
                            <span className="text-2xl font-black text-cyan-400">Rp {collectedNow.toLocaleString()}</span>
                         </div>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-6 overflow-hidden border border-white/5 p-1.5 shadow-inner">
                         <div 
                           className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-[2000ms] ease-out" 
                           style={{ width: `${progressPercent}%` }}
                         ></div>
                      </div>
                      <div className="flex justify-between mt-4 text-[11px] font-black text-slate-600 uppercase tracking-widest">
                         <span>Target: Rp {totalCollectedTarget.toLocaleString()}</span>
                         <span>Selisih: Rp {(totalCollectedTarget - collectedNow).toLocaleString()}</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 shadow-inner group hover:bg-emerald-500/5 transition-all">
                         <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Lunas Terbayar</p>
                         <p className="text-4xl font-black text-white italic">{stats?.iuran_stats?.sudah_bayar || 0} <span className="text-xs text-slate-500 not-italic uppercase tracking-widest ml-2">Warga</span></p>
                      </div>
                      <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 shadow-inner group hover:bg-red-500/5 transition-all">
                         <p className="text-[10px] font-black text-slate-500 uppercase mb-3 tracking-widest">Tunggakan</p>
                         <p className="text-4xl font-black text-red-400 italic">{stats?.iuran_stats?.belum_bayar || 0} <span className="text-xs text-slate-500 not-italic uppercase tracking-widest ml-2">Warga</span></p>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-slate-800/30 backdrop-blur-3xl rounded-[56px] p-12 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-12">
                   <h2 className="text-3xl font-black text-white flex items-center gap-5 italic tracking-tighter uppercase">
                     <span className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-2xl shadow-inner border border-orange-500/20">📢</span>
                     Aduan Warga
                   </h2>
                   <button onClick={() => router.push('/dashboard/rt/aduan')} className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-[0.3em] transition-all">Arsip Aduan →</button>
                </div>
                
                <div className="space-y-6">
                   {aduan.length === 0 ? (
                     <div className="py-16 text-center bg-slate-950/50 rounded-[40px] border border-white/5">
                        <p className="text-slate-600 font-black uppercase text-[10px] tracking-widest italic">Wilayah dalam kondisi kondusif (Tidak ada aduan).</p>
                     </div>
                   ) : aduan.map(a => (
                     <div key={a.id} className="p-8 bg-white/5 hover:bg-white/10 rounded-[40px] border border-white/5 transition-all group flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-6">
                           <div className={`w-3 h-3 rounded-full ${a.status === 'selesai' ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`}></div>
                           <div>
                              <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{a.judul}</h3>
                              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest italic">{new Date(a.created_at).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})} · OLEH: {a.user?.nama || 'Warga'}</p>
                           </div>
                        </div>
                        <span className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border ${
                           a.status === 'selesai' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                           {a.status.replace('_', ' ')}
                        </span>
                     </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="space-y-12">
             <div className="bg-gradient-to-br from-cyan-800 to-blue-900 rounded-[56px] p-12 shadow-2xl relative overflow-hidden group border border-cyan-500/20">
                <div className="absolute -right-12 -bottom-12 text-white opacity-5 group-hover:scale-150 transition-transform duration-1000 rotate-12">
                   <span className="text-[250px]">🏢</span>
                </div>
                <h3 className="text-3xl font-black text-white mb-10 italic uppercase tracking-tighter relative z-10">Pusat Layanan</h3>
                <div className="grid grid-cols-1 gap-5 relative z-10">
                   {[
                     { label: 'Approval Surat', icon: '📄', link: '/dashboard/rt/surat' },
                     { label: 'Manajemen Iuran', icon: '💰', link: '/dashboard/rt/iuran' },
                     { label: 'Inventaris RT', icon: '📦', link: '/dashboard/rt/aset' },
                     { label: 'Siaran Warta', icon: '🔔', link: '/dashboard/rt/pemberitahuan' }
                   ].map(item => (
                     <button 
                       key={item.label}
                       onClick={() => router.push(item.link)}
                       className="bg-white/10 hover:bg-white/20 p-6 rounded-[28px] border border-white/10 flex items-center gap-5 transition-all group/btn active:scale-95 text-left"
                     >
                        <span className="text-3xl group-hover/btn:scale-125 transition-transform">{item.icon}</span>
                        <span className="font-black text-white uppercase tracking-widest text-[11px] leading-none">{item.label}</span>
                     </button>
                   ))}
                </div>
             </div>

             <div className="bg-slate-800/30 backdrop-blur-3xl rounded-[56px] p-10 border border-white/5 shadow-2xl relative">
                <h3 className="text-xl font-black text-white mb-8 italic uppercase tracking-tighter">Lokasi Administrasi</h3>
                <div className="space-y-6">
                   {[
                     { label: 'Kecamatan', value: user?.kecamatan || stats?.kecamatan },
                     { label: 'Kelurahan', value: user?.desa_kelurahan || stats?.kelurahan },
                     { label: 'Wilayah RW', value: `RW ${user?.rw}` },
                     { label: 'Wilayah RT', value: `RT ${user?.rt}` }
                   ].map(info => (
                     <div key={info.label} className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-500 font-black uppercase tracking-widest">{info.label}</span>
                        <span className="text-white font-black uppercase tracking-tight text-right">{info.value || '-'}</span>
                     </div>
                   ))}
                </div>
                <div className="mt-12 p-8 bg-slate-950/50 rounded-[40px] border border-white/5 text-center shadow-inner">
                   <p className="text-[9px] text-slate-600 font-black uppercase mb-3 tracking-widest italic">Waktu Server KICAU</p>
                   <p className="text-sm text-cyan-400 font-mono font-bold tracking-widest">{stats?.server_time || new Date().toLocaleTimeString()}</p>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
