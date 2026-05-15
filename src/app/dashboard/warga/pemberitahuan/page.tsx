'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function WargaPemberitahuanPage() {
  const { user, isLoading, logout } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/pemberitahuan/publik?rt=${user?.rt}&rw=${user?.rw}`);
      setNews(data.pemberitahuan || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNews();
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-black text-white italic tracking-tighter">Warta <span className="text-indigo-400">Lingkungan</span></h1>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Informasi Terkini Wilayah RT {user.rt} / RW {user.rw}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {loading ? (
             <div className="col-span-full py-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">Memindai Berita Wilayah...</div>
           ) : news.length === 0 ? (
             <div className="col-span-full py-20 text-center text-slate-600 font-bold border-2 border-dashed border-white/5 rounded-[40px]">
                Belum ada pengumuman terbaru untuk wilayah Anda.
             </div>
           ) : news.map((item) => (
             <div key={item.id} className="bg-slate-800/40 backdrop-blur-xl p-8 rounded-[40px] border border-white/5 hover:border-indigo-500/30 transition-all group shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-700">
                   <span className="text-6xl">📢</span>
                </div>
                
                <div className="flex justify-between items-start mb-6">
                   <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter border border-indigo-500/20">INFO RESMI</span>
                   <span className="text-[10px] text-slate-600 font-mono italic">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                
                <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors mb-4 leading-tight">{item.judul}</h3>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-5 mb-8">{item.isi}</p>
                
                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-[10px]">🏛️</div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pengurus Wilayah</span>
                   </div>
                   <button className="text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:underline transition-all">Detail →</button>
                </div>
             </div>
           ))}
        </div>
        
        <footer className="mt-20 text-center">
           <p className="text-slate-700 text-[9px] font-black uppercase tracking-[0.4em]">Sistem Informasi Terintegrasi KICAU</p>
        </footer>
      </main>
    </div>
  );
}
