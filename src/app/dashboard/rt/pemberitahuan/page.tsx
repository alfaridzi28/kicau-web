'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RTPemberitahuanPage() {
  const { user, isLoading, logout } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'masuk' | 'siaran'>('masuk');
  const [formData, setFormData] = useState({ judul: '', isi: '', scope: 'rt' });

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/pemberitahuan');
      setNews(data || []);
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
        body: JSON.stringify({ ...formData, rt: user?.rt, rw: user?.rw })
      });
      setShowModal(false);
      setFormData({ judul: '', isi: '', scope: 'rt' });
      fetchNews();
      setActiveTab('siaran');
    } catch (err) {
      alert('Gagal mengirim warta RT');
    }
  };

  const deleteNews = async (id: number) => {
    if (!confirm('Hapus warta ini?')) return;
    try {
      await apiFetch(`/pemberitahuan/${id}`, { method: 'DELETE' });
      fetchNews();
    } catch (err) {
      alert('Gagal menghapus warta');
    }
  };

  // Logic: RT sees Lurah/RW news in 'masuk', and their own in 'siaran'
  const inboundNews = news.filter(item => item.created_by !== user?.id);
  const outboundNews = news.filter(item => item.created_by === user?.id);

  const displayList = activeTab === 'masuk' ? inboundNews : outboundNews;

  const filteredNews = displayList.filter(item => 
    item.judul.toLowerCase().includes(search.toLowerCase()) || 
    item.isi.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative">
        {/* Background Aura */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-cyan-600/10 to-transparent -z-10"></div>
        
        <header className="mb-12 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 animate-in fade-in slide-in-from-top duration-1000">
          <div>
             <div className="flex items-center gap-4 mb-2">
                <h1 className="text-6xl font-black text-white tracking-tighter italic uppercase">Warta <span className="text-cyan-400">RT {user.rt}</span></h1>
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-black px-3 py-1 rounded-full border border-cyan-500/30 uppercase tracking-widest">Digital Board</span>
             </div>
             <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] ml-1">Pusat Informasi Komunikasi Warga & Instruksi Pimpinan</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             <div className="relative group">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">🔍</span>
                <input 
                  type="text"
                  placeholder="Cari arsip informasi..."
                  className="bg-slate-800/40 border border-white/5 rounded-[24px] py-4 pl-14 pr-8 text-sm text-white focus:outline-none focus:border-cyan-500/50 w-72 md:w-96 transition-all shadow-inner backdrop-blur-md"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
             {activeTab === 'siaran' && (
               <button 
                 onClick={() => setShowModal(true)}
                 className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-12 py-5 rounded-[24px] shadow-2xl shadow-cyan-900/40 transition-all active:scale-95 uppercase tracking-widest text-[11px] flex items-center gap-3 border border-cyan-500/50"
               >
                 <span className="text-2xl">📢</span> Buat Warta RT
               </button>
             )}
          </div>
        </header>

        {/* Dynamic Navigation Tabs */}
        <div className="flex gap-4 mb-16 bg-slate-800/40 p-2 rounded-[32px] border border-white/5 w-fit backdrop-blur-xl animate-in fade-in duration-700">
           <button 
             onClick={() => setActiveTab('masuk')}
             className={`flex items-center gap-5 px-10 py-5 rounded-[26px] text-[12px] font-black uppercase tracking-[0.1em] transition-all ${
               activeTab === 'masuk' ? 'bg-cyan-600 text-white shadow-2xl shadow-cyan-900/40' : 'text-slate-500 hover:text-slate-300'
             }`}
           >
              <span className="text-lg">📥</span>
              <span>Instruksi Kelurahan & RW</span>
              <span className={`px-2.5 py-1 rounded-xl text-[10px] ${activeTab === 'masuk' ? 'bg-white/20' : 'bg-slate-700'}`}>{inboundNews.length}</span>
           </button>
           <button 
             onClick={() => setActiveTab('siaran')}
             className={`flex items-center gap-5 px-10 py-5 rounded-[26px] text-[12px] font-black uppercase tracking-[0.1em] transition-all ${
               activeTab === 'siaran' ? 'bg-cyan-600 text-white shadow-2xl shadow-cyan-900/40' : 'text-slate-500 hover:text-slate-300'
             }`}
           >
              <span className="text-lg">📤</span>
              <span>Warta Internal RT {user.rt}</span>
              <span className={`px-2.5 py-1 rounded-xl text-[10px] ${activeTab === 'siaran' ? 'bg-white/20' : 'bg-slate-700'}`}>{outboundNews.length}</span>
           </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
           {loading ? (
             <div className="col-span-full py-40 text-center animate-pulse">
                <span className="text-2xl mb-4 block">📡</span>
                <span className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Menghubungkan ke Pusat Informasi...</span>
             </div>
           ) : filteredNews.length === 0 ? (
             <div className="col-span-full py-32 text-center bg-slate-800/20 rounded-[60px] border-2 border-dashed border-white/5 flex flex-col items-center gap-6">
                <span className="text-6xl opacity-20">📭</span>
                <p className="text-slate-600 font-black uppercase tracking-widest text-sm max-w-md">
                   {activeTab === 'masuk' ? 'Belum ada instruksi masuk dari Kelurahan atau RW.' : 'Anda belum menerbitkan warta apapun untuk warga RT ini.'}
                </p>
                {activeTab === 'siaran' && (
                  <button onClick={() => setShowModal(true)} className="text-cyan-400 font-black text-[10px] uppercase tracking-widest hover:underline transition-all underline-offset-8">Buat Warta Pertama Anda</button>
                )}
             </div>
           ) : filteredNews.map((item) => (
             <div key={item.id} className="bg-slate-800/30 backdrop-blur-2xl p-12 rounded-[56px] border border-white/5 hover:border-cyan-500/30 transition-all group relative flex flex-col h-full shadow-2xl animate-in fade-in slide-in-from-bottom duration-700">
                <div className="mb-8 flex justify-between items-center">
                   <span className={`text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-widest border shadow-lg ${
                     item.scope === 'global' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                     item.scope === 'rw' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                     'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                   }`}>
                      {item.scope === 'global' ? '🏛️ Kelurahan' : item.scope === 'rw' ? '🛡️ Wilayah RW' : '📢 Internal RT'}
                   </span>
                   <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                </div>
                
                <h3 className="text-4xl font-black text-white group-hover:text-cyan-400 transition-colors mb-8 leading-[1.1] uppercase tracking-tighter line-clamp-2">{item.judul}</h3>
                <p className="text-slate-400 text-base leading-relaxed mb-10 line-clamp-4 font-medium opacity-70 italic">"{item.isi}"</p>
                
                <button 
                  onClick={() => { setSelectedNews(item); setShowDetailModal(true); }}
                  className="w-fit text-[11px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-3 mb-10 group/btn"
                >
                   Baca Detail Warta <span className="group-hover:translate-x-2 transition-transform">→</span>
                </button>

                <div className="mt-auto pt-10 border-t border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl bg-slate-900 border border-white/5 shadow-inner">
                         🗓️
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">Diterbitkan</span>
                        <span className="text-[12px] text-white font-bold tracking-tight">{new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      </div>
                   </div>
                   {item.created_by === user?.id && (
                     <button 
                       onClick={() => deleteNews(item.id)}
                       className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500/50 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                       title="Hapus Warta"
                     >
                       🗑️
                     </button>
                   )}
                </div>
             </div>
           ))}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedNews && (
          <div className="fixed inset-0 bg-[#020617]/98 backdrop-blur-3xl flex items-center justify-center p-6 z-[2500]">
             <div className="bg-[#0f172a] border border-white/10 rounded-[64px] w-full max-w-4xl overflow-hidden shadow-[0_0_150px_rgba(34,211,238,0.2)] animate-in zoom-in duration-500 flex flex-col max-h-[85vh]">
                <div className="p-16 overflow-y-auto">
                   <div className="mb-12 flex justify-between items-start">
                      <div className="flex gap-4">
                        <span className="text-[11px] font-black px-6 py-2.5 rounded-2xl uppercase tracking-widest border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                           📢 Warta Digital RT {user.rt}
                        </span>
                        <span className="text-[11px] font-black px-6 py-2.5 rounded-2xl uppercase tracking-widest border bg-white/5 text-slate-500 border-white/5">
                           RESMI
                        </span>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} className="text-slate-500 hover:text-white text-5xl transition-colors font-light">×</button>
                   </div>
                   <h2 className="text-6xl font-black text-white tracking-tighter italic mb-10 leading-[1] uppercase">{selectedNews.judul}</h2>
                   <div className="w-32 h-2 bg-cyan-600 rounded-full mb-12 shadow-lg shadow-cyan-900/50"></div>
                   <div className="text-slate-200 text-2xl leading-relaxed whitespace-pre-wrap font-medium opacity-90 first-letter:text-5xl first-letter:font-black first-letter:text-cyan-500">
                      {selectedNews.isi}
                   </div>
                </div>
                <div className="p-12 bg-slate-950/80 border-t border-white/5 flex justify-between items-center mt-auto backdrop-blur-md">
                   <div className="flex items-center gap-6">
                      <div className="w-14 h-14 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-2xl">🏛️</div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Waktu Publikasi</span>
                        <span className="text-sm font-mono text-white">{new Date(selectedNews.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                   </div>
                   <button onClick={() => setShowDetailModal(false)} className="bg-cyan-600 text-white font-black px-16 py-5 rounded-[24px] uppercase tracking-widest text-xs hover:bg-cyan-500 transition-all shadow-2xl shadow-cyan-900/50 active:scale-95">Tutup Warta</button>
                </div>
             </div>
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-[#020617]/98 backdrop-blur-2xl flex items-center justify-center p-6 z-[2000]">
            <div className="bg-[#0f172a] border border-white/10 rounded-[56px] w-full max-w-3xl p-16 shadow-[0_0_120px_rgba(34,211,238,0.15)] animate-in zoom-in duration-500">
               <div className="flex justify-between items-start mb-12">
                  <div>
                     <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">Siaran Baru <span className="text-cyan-400">RT {user.rt}</span></h2>
                     <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.3em] mt-2 ml-1">Publikasi Informasi Internal Warga</p>
                  </div>
                  <button onClick={() => { setShowModal(false); setFormData({ judul: '', isi: '', scope: 'rt' }); }} className="text-slate-500 hover:text-white text-4xl transition-colors font-light">×</button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-10">
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block ml-2">Judul Warta RT</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-950/50 border border-white/10 rounded-[28px] px-10 py-6 text-white outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-800 text-lg shadow-inner"
                      value={formData.judul}
                      onChange={(e) => setFormData({...formData, judul: e.target.value})}
                      placeholder="Masukkan subjek pengumuman..."
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest block ml-2">Isi Pesan Informasi</label>
                    <textarea 
                      required
                      rows={6}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-[28px] px-10 py-6 text-white outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-slate-800 resize-none text-lg shadow-inner"
                      value={formData.isi}
                      onChange={(e) => setFormData({...formData, isi: e.target.value})}
                      placeholder="Sampaikan detail informasi kepada warga RT..."
                    />
                  </div>
                  <div className="flex gap-8 pt-6">
                     <button type="button" onClick={() => { setShowModal(false); setFormData({ judul: '', isi: '', scope: 'rt' }); }} className="flex-1 bg-white/5 text-white font-black py-6 rounded-[28px] uppercase tracking-widest text-[11px] hover:bg-white/10 transition active:scale-95">Batal</button>
                     <button type="submit" className="flex-1 bg-cyan-600 text-white font-black py-6 rounded-[28px] uppercase tracking-widest text-[11px] hover:bg-cyan-500 transition shadow-2xl shadow-cyan-900/50 active:scale-95 border border-cyan-400/20">Siarkan Ke Warga RT</button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
