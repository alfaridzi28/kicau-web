'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function SuperadminPemberitahuanPage() {
  const { user, isLoading, logout } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ judul: '', isi: '', scope: 'global', rt: '', rw: '' });

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/pemberitahuan');
      setNews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNews();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/pemberitahuan', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      fetchNews();
    } catch (err) {
      alert('Gagal mengirim pengumuman');
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">Pusat Informasi Kelurahan</h1>
            <p className="text-slate-400 mt-1 font-bold uppercase tracking-widest text-xs">Broadcast Pengumuman & Berita ke Seluruh Warga</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-purple-900/40 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            + Buat Pengumuman Baru
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {loading ? (
             <div className="col-span-full py-20 text-center animate-pulse text-slate-500 font-black uppercase">Mensinkronisasi Basis Data Berita...</div>
           ) : news.length === 0 ? (
             <div className="col-span-full py-20 text-center text-slate-600 font-bold border-2 border-dashed border-white/5 rounded-[40px]">
                Belum ada pengumuman yang dibuat.
             </div>
           ) : news.map((item) => (
             <div key={item.id} className="bg-slate-800/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                   <span className="bg-white/5 text-slate-500 text-[9px] font-bold px-2 py-1 rounded uppercase tracking-tighter">{item.scope}</span>
                </div>
                <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors mb-4 pr-10">{item.judul}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-4">{item.isi}</p>
                <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/5">
                   <span className="text-[10px] text-slate-500 font-mono italic">{new Date(item.created_at).toLocaleDateString()}</span>
                   <button className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-widest">Hapus</button>
                </div>
             </div>
           ))}
        </div>

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in duration-300">
               <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic">Buat Pengumuman Global</h2>
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Judul Berita</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-purple-500"
                      value={formData.judul}
                      onChange={(e) => setFormData({...formData, judul: e.target.value})}
                      placeholder="Masukkan judul pengumuman..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Isi Pengumuman</label>
                    <textarea 
                      required
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-purple-500"
                      value={formData.isi}
                      onChange={(e) => setFormData({...formData, isi: e.target.value})}
                      placeholder="Detail informasi yang ingin disampaikan..."
                    />
                  </div>
                  <div className="flex gap-4">
                     <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition">Batal</button>
                     <button type="submit" className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-purple-500 transition shadow-lg shadow-purple-900/40">Siarkan Sekarang</button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
