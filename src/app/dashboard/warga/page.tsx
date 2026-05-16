'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';

export default function WargaDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [iuran, setIuran] = useState<any[]>([]);
  const [aduan, setAduan] = useState<any[]>([]);
  const [pemberitahuan, setPemberitahuan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rtChair, setRtChair] = useState<any>(null);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    if (user && !isLoading) {
      // Redirect if not warga
      const currentRole = user.effective_role || user.role;
      if (currentRole !== 'warga') {
        const routes: Record<string, string> = {
          superadmin: '/dashboard/superadmin',
          lurah: '/dashboard/lurah',
          rw: '/dashboard/rw',
          rt: '/dashboard/rt',
          staff: '/dashboard/lurah' // Staff goes to lurah dashboard
        };
        const target = routes[currentRole] || '/dashboard/warga';
        if (target !== '/dashboard/warga') {
           router.push(target);
           return;
        }
      }

      const fetchData = async () => {
        try {
          const [iuranData, aduanData, beritaData, staffData] = await Promise.all([
            apiFetch(`/iuran?user_id=${user.id}`),
            apiFetch(`/aduan?user_id=${user.id}`), 
            apiFetch(`/pemberitahuan/publik?rt=${user.rt}&rw=${user.rw}`),
            apiFetch(`/warga?rw=${user.rw}&limit=200`) // Fetch all in RW to see RW & RT staff
          ]);
          setIuran(iuranData);
          setAduan(aduanData);
          setPemberitahuan(beritaData.pemberitahuan || []);
          
          // Organize officials using jabatan to distinguish scope
          const allStaff = staffData.items || [];
          const clean = (s: any) => String(s || '').replace(/^0+/, '') || '0';
          
          const rw_chair = allStaff.find((w: any) => w.role === 'rw' && w.jabatan?.toLowerCase().includes('ketua'));
          const rw_staff = allStaff.find((w: any) => w.role === 'rw' && !w.jabatan?.toLowerCase().includes('ketua'));
          
          const rt_chair = allStaff.find((w: any) => w.role === 'rt' && clean(w.rt) === clean(user.rt) && w.jabatan?.toLowerCase().includes('ketua'));
          const rt_staff = allStaff.find((w: any) => w.role === 'rt' && clean(w.rt) === clean(user.rt) && !w.jabatan?.toLowerCase().includes('ketua'));

          setRtChair({
             rw: rw_chair,
             rw_staff: rw_staff,
             rt: rt_chair,
             rt_staff: rt_staff
          });
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
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="mt-6 font-bold tracking-widest text-indigo-400 uppercase animate-pulse">Menyiapkan Pengalaman KICAU...</p>
    </div>
  );

  const lastIuran = iuran[0];
  const pendingAduan = aduan.filter(a => a.status !== 'selesai').length;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200 selection:bg-indigo-500/30">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative min-w-0">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 blur-[120px] -z-10 rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 blur-[120px] -z-10 rounded-full"></div>

        <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-in fade-in slide-in-from-top duration-700">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase rounded-full border border-indigo-500/20">Warga Terverifikasi</span>
               <span className="text-slate-600 text-xs font-mono">ID: {user?.id?.slice(0,8) || '...'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
               Selamat Datang, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">{(user?.nama || 'Warga').split(' ')[0]}</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/5 shadow-2xl">
             <button 
               onClick={() => setShowContact(true)}
               className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-indigo-500/40 active:scale-95"
             >
               <span>📞</span> Hubungi RT
             </button>
             <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-xl border border-white/5">🏠</div>
          </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-in fade-in zoom-in duration-1000">
          <StatCard title="Iuran Terakhir" value={lastIuran ? lastIuran.bulan_tahun : 'N/A'} icon="💰" color="blue" subtitle={lastIuran ? `Rp ${lastIuran.nominal.toLocaleString()}` : 'Belum Ada Record'} />
          <StatCard title="Laporan Anda" value={pendingAduan} icon="📢" color="orange" subtitle="Status Diproses/Pending" />
          <StatCard title="Inventaris RT" value="Tersedia" icon="📦" color="emerald" subtitle="Katalog Aset Pinjam" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* dynamic info area */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-10 border border-white/5 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <span className="text-9xl">🔔</span>
               </div>
               <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-white flex items-center gap-4">
                    <span className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-xl shadow-inner">📰</span>
                    Warta Lingkungan
                  </h2>
               </div>
               <div className="grid gap-6">
                 {pemberitahuan.length === 0 ? (
                   <div className="p-20 text-center text-slate-500 font-medium border-2 border-dashed border-white/5 rounded-[32px]">
                      Belum ada kabar terbaru untuk wilayah Anda.
                   </div>
                 ) : pemberitahuan.map(p => (
                   <div key={p.id} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-[32px] p-8 transition-all hover:translate-x-2">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-white leading-tight">{p.judul}</h3>
                        <span className="bg-indigo-500/20 text-indigo-400 text-[9px] font-bold px-2 py-1 rounded uppercase">{new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">{p.isi}</p>
                      <button className="text-indigo-400 font-bold text-xs hover:underline">Baca Selengkapnya →</button>
                   </div>
                 ))}
               </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { label: 'Aduan', icon: '📢', href: '/dashboard/warga/aduan', color: 'bg-orange-500' },
                 { label: 'Surat', icon: '📄', href: '/dashboard/warga/surat', color: 'bg-indigo-500' },
                 { label: 'Aset', icon: '🏪', href: '/dashboard/warga/aset', color: 'bg-emerald-500' },
                 { label: 'Iuran', icon: '💰', href: '/dashboard/warga/iuran', color: 'bg-blue-500' },
               ].map(act => (
                 <a key={act.label} href={act.href} className="group bg-slate-800/40 hover:bg-white/5 p-6 rounded-[32px] border border-white/5 flex flex-col items-center gap-4 transition-all hover:-translate-y-2">
                    <div className={`w-14 h-14 ${act.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>{act.icon}</div>
                    <span className="font-bold text-white text-xs uppercase tracking-widest">{act.label}</span>
                 </a>
               ))}
            </div>
          </div>

          <div className="space-y-10">
            {/* Info Struktur Pengurus Card */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-6 -bottom-6 text-white opacity-5 group-hover:rotate-12 transition-transform duration-700">
                  <span className="text-[150px]">🏛️</span>
               </div>
               <div className="relative z-10">
                 <h3 className="text-xl font-black text-white mb-6 uppercase tracking-tighter italic">Struktur <span className="text-indigo-400">Pengurus</span></h3>
                 
                 <div className="space-y-6">
                    {/* RW Level */}
                    <div className="space-y-4">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Tingkat RW {user.rw}</p>
                       <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-lg shadow-lg shadow-indigo-900/40">👑</div>
                          <div>
                             <p className="text-white font-bold text-sm">{rtChair?.rw?.nama || 'Ketua RW Belum Terdata'}</p>
                             <p className="text-[9px] text-indigo-400 font-bold uppercase">Ketua RW</p>
                          </div>
                       </div>
                       {rtChair?.rw_staff && (
                          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 ml-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-lg">📋</div>
                             <div>
                                <p className="text-white font-bold text-sm">{rtChair.rw_staff.nama}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">{rtChair.rw_staff.jabatan || 'Staff RW'}</p>
                             </div>
                          </div>
                       )}
                    </div>

                    {/* RT Level */}
                    <div className="space-y-4 mt-8">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Tingkat RT {user.rt}</p>
                       <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-lg shadow-lg shadow-purple-900/40">👤</div>
                          <div>
                             <p className="text-white font-bold text-sm">{rtChair?.rt?.nama || 'Ketua RT Belum Terdata'}</p>
                             <p className="text-[9px] text-purple-400 font-bold uppercase">Ketua RT</p>
                          </div>
                       </div>
                       {rtChair?.rt_staff && (
                          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 ml-4">
                             <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-lg">🔧</div>
                             <div>
                                <p className="text-white font-bold text-sm">{rtChair.rt_staff.nama}</p>
                                <p className="text-[9px] text-slate-500 font-bold uppercase">{rtChair.rt_staff.jabatan || 'Staff RT'}</p>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>

                 <button 
                  onClick={() => setShowContact(true)}
                  className="w-full mt-10 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-500 transition active:scale-95 uppercase tracking-widest text-[10px]"
                 >
                   Lihat Detail Kontak
                 </button>
               </div>
            </div>

            {/* Status Tracking Mini */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-[40px] p-8 border border-white/5 shadow-2xl">
               <h3 className="text-lg font-black text-white mb-8">Lacak Laporan</h3>
               <div className="space-y-8">
                  {aduan.length === 0 ? (
                    <div className="text-center py-6">
                       <p className="text-slate-600 text-xs">Belum ada aktivitas laporan.</p>
                    </div>
                  ) : aduan.slice(0, 3).map(a => (
                    <div key={a.id} className="relative pl-8">
                       <div className={`absolute left-0 top-1 w-2 h-2 rounded-full ${a.status === 'selesai' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-orange-500 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.4)]'}`}></div>
                       <div className="absolute left-[3px] top-4 w-px h-full bg-white/5"></div>
                       <p className="text-xs font-black text-white mb-1">{a.judul}</p>
                       <p className="text-[10px] text-slate-500 font-bold uppercase">{a.status.replace('_', ' ')}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        {showContact && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-sm p-10 shadow-2xl text-center transform animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] mx-auto mb-8 flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/40">
                👤
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Hubungi Ketua RT</h3>
              <p className="text-indigo-400 font-bold mb-8 uppercase tracking-widest text-[10px]">RT {user?.rt || '-'} / RW {user?.rw || '-'}</p>
              
              <div className="p-6 bg-white/5 rounded-3xl border border-white/5 mb-8 text-left space-y-4">
                <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Ketua RT {user.rt}</p>
                  <p className="text-white font-bold">{rtChair?.rt?.nama || 'N/A'}</p>
                  <p className="text-[10px] text-indigo-400 font-mono">{rtChair?.rt?.no_telp}</p>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Ketua RW {user.rw}</p>
                  <p className="text-white font-bold">{rtChair?.rw?.nama || 'N/A'}</p>
                  <p className="text-[10px] text-indigo-400 font-mono">{rtChair?.rw?.no_telp}</p>
                </div>
              </div>

              <div className="space-y-4">
                 <a 
                    href={`https://wa.me/${rtChair?.no_telp?.replace(/[^0-9]/g, '') || '628123456789'}`} 
                    target="_blank"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-emerald-500/40 active:scale-95"
                 >
                   <span className="text-xl">📱</span> WHATSAPP RT
                 </a>
                 <button 
                    onClick={() => setShowContact(false)}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-5 rounded-2xl transition active:scale-95 uppercase tracking-widest text-xs"
                 >
                   Tutup Jendela
                 </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
