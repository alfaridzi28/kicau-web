'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function LurahPemberitahuanPage() {
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
      setFormData({ judul: '', isi: '', scope: 'global', rt: '', rw: '' });
      fetchNews();
    } catch (err) {
      alert('Gagal mengirim pengumuman');
    }
  };

  const deleteNews = async (id: number) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await apiFetch(`/pemberitahuan/${id}`, { method: 'DELETE' });
      fetchNews();
    } catch (err) {
      alert('Gagal menghapus pengumuman');
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic">Broadcasting <span className="text-indigo-400">Pusat</span></h1>
            <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Otoritas Komunikasi Kelurahan & Manajemen Informasi</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-10 py-5 rounded-[24px] shadow-2xl shadow-indigo-900/40 transition-all active:scale-95 uppercase tracking-widest text-[11px] flex items-center gap-3"
          >
            <span className="text-xl">📢</span> Siarkan Informasi Baru
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {loading ? (
             <div className="col-span-full py-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-[0.2em]">Mengakses Data Informasi...</div>
           ) : news.length === 0 ? (
             <div className="col-span-full py-20 text-center bg-slate-800/40 rounded-[40px] border-2 border-dashed border-white/5 text-slate-600 font-bold uppercase tracking-widest text-xs">
                Belum ada pengumuman yang aktif di wilayah ini.
             </div>
           ) : news.map((item) => (
             <div key={item.id} className="bg-slate-800/40 backdrop-blur-xl p-10 rounded-[48px] border border-white/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col h-full shadow-2xl">
                <div className="absolute top-0 right-0 p-6">
                   <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border border-indigo-500/20">{item.scope}</span>
                </div>
                <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors mb-4 pr-12 leading-tight">{item.judul}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-10 line-clamp-4">{item.isi}</p>
                <div className="mt-auto pt-8 border-t border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs">👤</div>
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter italic">{new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                   </div>
                   <button 
                     onClick={() => deleteNews(item.id)}
                     className="text-red-500/50 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors"
                   >
                     Hapus
                   </button>
                </div>
             </div>
           ))}
        </div>

        {/* Broadcast Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-xl flex items-center justify-center p-6 z-[2000]">
            <div className="bg-[#0f172a] border border-white/10 rounded-[48px] w-full max-w-2xl p-12 shadow-[0_0_100px_rgba(79,70,229,0.1)] animate-in zoom-in duration-300">
               <div className="flex justify-between items-start mb-10">
                  <div>
                     <h2 className="text-4xl font-black text-white tracking-tighter italic">Siaran Kelurahan</h2>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Gunakan bahasa yang formal & informatif</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white text-3xl transition-colors">×</button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-8">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">Judul Pengumuman</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-950/50 border border-white/10 rounded-[24px] px-8 py-5 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                      value={formData.judul}
                      onChange={(e) => setFormData({...formData, judul: e.target.value})}
                      placeholder="Contoh: Pemberitahuan Kerja Bakti Massal"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">Detail Informasi</label>
                    <textarea 
                      required
                      rows={5}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-[24px] px-8 py-5 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700 resize-none"
                      value={formData.isi}
                      onChange={(e) => setFormData({...formData, isi: e.target.value})}
                      placeholder="Sampaikan detail waktu, tempat, dan instruksi kepada warga..."
                    />
                  </div>
                  <div className="flex gap-6 pt-4">
                     <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-white/5 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-[11px] hover:bg-white/10 transition active:scale-95">Batal</button>
                     <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-[11px] hover:bg-indigo-500 transition shadow-2xl shadow-indigo-900/40 active:scale-95">Siarkan Sekarang</button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
