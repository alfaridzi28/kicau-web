'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RTPemberitahuanPage() {
  const { user, isLoading, logout } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ judul: '', isi: '', scope: 'rt', rt: '', rw: '' });

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/pemberitahuan?rt=${user?.rt}&rw=${user?.rw}`);
      setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, rt: user.rt, rw: user.rw }));
      fetchNews();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/pemberitahuan', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ judul: '', isi: '', scope: 'rt', rt: user?.rt || '', rw: user?.rw || '' });
      fetchNews();
    } catch (err) {
      alert('Gagal mengirim pengumuman');
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter">Warta <span className="text-cyan-400">RT {user.rt}</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Informasi & Komunikasi Internal Warga RT {user.rt}</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-cyan-900/20 transition-all active:scale-95 uppercase tracking-widest text-[10px]"
          >
            + Terbitkan Warta RT
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {loading ? (
             <div className="col-span-full py-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">MEMUAT WARTA...</div>
           ) : news.length === 0 ? (
             <div className="col-span-full py-20 text-center text-slate-600 font-bold border-2 border-dashed border-white/5 rounded-[40px]">
                Belum ada pengumuman internal RT {user.rt}.
             </div>
           ) : news.map((item) => (
             <div key={item.id} className="bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 hover:border-cyan-500/30 transition-all group shadow-xl">
                <div className="flex justify-between items-start mb-6">
                   <span className="bg-cyan-500/10 text-cyan-400 text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter border border-cyan-500/20">RT ONLY</span>
                   <span className="text-[9px] text-slate-600 font-mono italic">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors mb-4 leading-tight">{item.judul}</h3>
                <p className="text-slate-400 text-sm leading-relaxed line-clamp-4">{item.isi}</p>
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                   <button className="text-red-400/50 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors">Hapus</button>
                </div>
             </div>
           ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in duration-300">
               <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic">Broadcast Internal RT</h2>
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Judul Warta</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.judul}
                      onChange={(e) => setFormData({...formData, judul: e.target.value})}
                      placeholder="Judul berita RT..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Isi Warta</label>
                    <textarea 
                      required
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                      value={formData.isi}
                      onChange={(e) => setFormData({...formData, isi: e.target.value})}
                      placeholder="Detail pengumuman RT..."
                    />
                  </div>
                  <div className="flex gap-4">
                     <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]">Batal</button>
                     <button type="submit" className="flex-1 bg-cyan-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-[10px]">Terbitkan</button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
