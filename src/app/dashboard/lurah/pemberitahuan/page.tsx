'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function LurahPemberitahuanPage() {
  const { user, isLoading, logout } = useAuth();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'masuk' | 'siaran'>('siaran');
  const [formData, setFormData] = useState({ judul: '', isi: '', scope: 'global' });

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
        body: JSON.stringify(formData)
      });
      setShowModal(false);
      setFormData({ judul: '', isi: '', scope: 'global' });
      fetchNews();
      setActiveTab('siaran');
    } catch (err) {
      alert('Gagal mengirim siaran kelurahan');
    }
  };

  const deleteNews = async (id: number) => {
    if (!confirm('Hapus siaran kelurahan ini?')) return;
    try {
      await apiFetch(`/pemberitahuan/${id}`, { method: 'DELETE' });
      fetchNews();
    } catch (err) {
      alert('Gagal menghapus siaran');
    }
  };

  // Logic: Lurah sees Admin news in 'masuk', and their own in 'siaran'
  const inboundNews = news.filter(item => item.created_by !== user?.id && item.scope === 'global' && item.created_by !== null); // Assuming Admin has an ID
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
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-600/10 to-transparent -z-10"></div>
        
        <header className="mb-12 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 animate-in fade-in slide-in-from-top duration-1000">
          <div>
             <div className="flex items-center gap-4 mb-2">
                <h1 className="text-7xl font-black text-white tracking-tighter italic uppercase">Komando <span className="text-indigo-400">Pusat KICAU</span></h1>
                <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-4 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest shadow-lg">Lurah Access</span>
             </div>
             <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] ml-1">Pusat Diseminasi Informasi Strategis & Instruksi Resmi Kelurahan</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors text-xl">🔍</span>
                <input 
                  type="text"
                  placeholder="Cari dokumentasi informasi..."
                  className="bg-slate-800/40 border border-white/5 rounded-[32px] py-5 pl-16 pr-10 text-base text-white focus:outline-none focus:border-indigo-500/50 w-80 md:w-[450px] transition-all shadow-2xl backdrop-blur-md"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
             </div>
             {activeTab === 'siaran' && (
               <button 
                 onClick={() => setShowModal(true)}
                 className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-14 py-6 rounded-[32px] shadow-[0_0_50px_rgba(79,70,229,0.3)] transition-all active:scale-95 uppercase tracking-widest text-[12px] flex items-center gap-4 border border-indigo-400/30"
               >
                 <span className="text-3xl">📢</span> Siarkan Ke Seluruh Warga
               </button>
             )}
          </div>
        </header>

        {/* Dynamic Navigation Tabs */}
        <div className="flex gap-6 mb-20 bg-slate-800/40 p-3 rounded-[40px] border border-white/5 w-fit backdrop-blur-2xl animate-in fade-in duration-700 shadow-inner">
           <button 
             onClick={() => setActiveTab('masuk')}
             className={`flex items-center gap-6 px-12 py-6 rounded-[30px] text-[13px] font-black uppercase tracking-[0.1em] transition-all ${
               activeTab === 'masuk' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-900/50' : 'text-slate-500 hover:text-slate-300'
             }`}
           >
              <span className="text-2xl">📥</span>
              <span>Instruksi Pusat (Admin)</span>
              <span className={`px-3 py-1 rounded-xl text-[11px] ${activeTab === 'masuk' ? 'bg-white/20' : 'bg-slate-700'}`}>{inboundNews.length}</span>
           </button>
           <button 
             onClick={() => setActiveTab('siaran')}
             className={`flex items-center gap-6 px-12 py-6 rounded-[30px] text-[13px] font-black uppercase tracking-[0.1em] transition-all ${
               activeTab === 'siaran' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-900/50' : 'text-slate-500 hover:text-slate-300'
             }`}
           >
              <span className="text-2xl">📤</span>
              <span>Siaran Resmi Kelurahan</span>
              <span className={`px-3 py-1 rounded-xl text-[11px] ${activeTab === 'siaran' ? 'bg-white/20' : 'bg-slate-700'}`}>{outboundNews.length}</span>
           </button>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14">
           {loading ? (
             <div className="col-span-full py-40 text-center animate-pulse">
                <span className="text-4xl mb-6 block">🏛️</span>
                <span className="text-slate-500 font-black uppercase tracking-[0.4em] text-sm italic">Mengakses Pusat Data Komunikasi...</span>
             </div>
           ) : filteredNews.length === 0 ? (
             <div className="col-span-full py-40 text-center bg-slate-800/10 rounded-[80px] border-2 border-dashed border-white/5 flex flex-col items-center gap-8">
                <span className="text-8xl opacity-10">🛡️</span>
                <p className="text-slate-600 font-black uppercase tracking-widest text-base max-w-lg">
                   {activeTab === 'masuk' ? 'Belum ada warta masuk dari administrator pusat.' : 'Belum ada siaran resmi kelurahan yang diterbitkan hari ini.'}
                </p>
                {activeTab === 'siaran' && (
                  <button onClick={() => setShowModal(true)} className="text-indigo-400 font-black text-xs uppercase tracking-widest hover:underline transition-all underline-offset-[12px] decoration-2">Terbitkan Maklumat Kelurahan</button>
                )}
             </div>
           ) : filteredNews.map((item) => (
             <div key={item.id} className="bg-slate-800/40 backdrop-blur-3xl p-14 rounded-[64px] border border-white/5 hover:border-indigo-500/40 transition-all group relative flex flex-col h-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-bottom duration-1000">
                <div className="mb-10 flex justify-between items-center">
                   <span className="text-[11px] font-black px-6 py-2.5 rounded-2xl uppercase tracking-widest border shadow-xl bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                      🏛️ RESMI KELURAHAN
                   </span>
                   <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                </div>
                
                <h3 className="text-5xl font-black text-white group-hover:text-indigo-400 transition-colors mb-10 leading-[1] uppercase tracking-tighter line-clamp-2 italic">{item.judul}</h3>
                <p className="text-slate-300 text-lg leading-relaxed mb-12 line-clamp-4 font-medium opacity-80 italic">"{item.isi}"</p>
                
                <button 
                  onClick={() => { setSelectedNews(item); setShowDetailModal(true); }}
                  className="w-fit text-[12px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors flex items-center gap-4 mb-12 group/btn"
                >
                   Baca Maklumat Selengkapnya <span className="group-hover:translate-x-3 transition-transform text-xl">→</span>
                </button>

                <div className="mt-auto pt-12 border-t border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[24px] flex items-center justify-center text-2xl bg-slate-900 border border-white/5 shadow-2xl">
                         🖋️
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Arsip Tanggal</span>
                        <span className="text-base text-white font-bold tracking-tight">{new Date(item.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      </div>
                   </div>
                   {item.created_by === user?.id && (
                     <button 
                       onClick={() => deleteNews(item.id)}
                       className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-500/30 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-xl shadow-lg shadow-red-900/20"
                       title="Hapus Maklumat"
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
          <div className="fixed inset-0 bg-[#020617]/99 backdrop-blur-[40px] flex items-center justify-center p-6 z-[3000]">
             <div className="bg-[#0f172a] border border-white/10 rounded-[80px] w-full max-w-5xl overflow-hidden shadow-[0_0_200px_rgba(79,70,229,0.25)] animate-in zoom-in duration-700 flex flex-col max-h-[90vh]">
                <div className="p-20 overflow-y-auto custom-scrollbar">
                   <div className="mb-16 flex justify-between items-start">
                      <div className="flex gap-6">
                        <span className="text-[12px] font-black px-8 py-3 rounded-2xl uppercase tracking-widest border bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-xl">
                           🏛️ MAKLUMAT KELURAHAN
                        </span>
                        <span className="text-[12px] font-black px-8 py-3 rounded-2xl uppercase tracking-widest border bg-white/5 text-slate-500 border-white/5">
                           DOKUMEN NEGARA
                        </span>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} className="text-slate-500 hover:text-white text-7xl transition-colors font-thin">×</button>
                   </div>
                   <h2 className="text-7xl font-black text-white tracking-tighter italic mb-12 leading-[0.9] uppercase">{selectedNews.judul}</h2>
                   <div className="w-48 h-3 bg-indigo-600 rounded-full mb-16 shadow-[0_0_30px_rgba(79,70,229,0.5)]"></div>
                   <div className="text-slate-200 text-3xl leading-[1.6] whitespace-pre-wrap font-medium opacity-90 first-letter:text-8xl first-letter:font-black first-letter:text-indigo-500 first-letter:mr-4 first-letter:float-left">
                      {selectedNews.isi}
                   </div>
                </div>
                <div className="p-16 bg-slate-950/90 border-t border-white/10 flex justify-between items-center mt-auto backdrop-blur-2xl">
                   <div className="flex items-center gap-8">
                      <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-4xl shadow-2xl">🛡️</div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em]">Otoritas Penerbit</span>
                        <span className="text-xl font-mono text-white tracking-widest">KANTOR KELURAHAN KICAU</span>
                      </div>
                   </div>
                   <button onClick={() => setShowDetailModal(false)} className="bg-indigo-600 text-white font-black px-24 py-7 rounded-[32px] uppercase tracking-[0.2em] text-sm hover:bg-indigo-500 transition-all shadow-[0_0_80px_rgba(79,70,229,0.4)] active:scale-95 border border-indigo-400/30">Tutup Maklumat</button>
                </div>
             </div>
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-[#020617]/99 backdrop-blur-[30px] flex items-center justify-center p-6 z-[2500]">
            <div className="bg-[#0f172a] border border-white/10 rounded-[72px] w-full max-w-4xl p-20 shadow-[0_0_150px_rgba(79,70,229,0.2)] animate-in zoom-in duration-700">
               <div className="flex justify-between items-start mb-16">
                  <div>
                     <h2 className="text-6xl font-black text-white tracking-tighter italic uppercase">Maklumat <span className="text-indigo-400">Baru</span></h2>
                     <p className="text-slate-500 text-[12px] font-bold uppercase tracking-[0.4em] mt-3 ml-2">Diseminasi Informasi Strategis Kelurahan</p>
                  </div>
                  <button onClick={() => { setShowModal(false); setFormData({ judul: '', isi: '', scope: 'global' }); }} className="text-slate-500 hover:text-white text-5xl transition-colors font-thin">×</button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-12">
                  <div className="space-y-6">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-[0.3em] block ml-4">Judul Maklumat Kelurahan</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-950/60 border border-white/10 rounded-[36px] px-12 py-8 text-white outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all placeholder:text-slate-800 text-2xl shadow-inner font-bold"
                      value={formData.judul}
                      onChange={(e) => setFormData({...formData, judul: e.target.value})}
                      placeholder="Contoh: Pengumuman Hari Libur Pelayanan"
                    />
                  </div>
                  <div className="space-y-6">
                    <label className="text-[14px] font-black text-slate-400 uppercase tracking-[0.3em] block ml-4">Detail Isi Maklumat</label>
                    <textarea 
                      required
                      rows={6}
                      className="w-full bg-slate-950/60 border border-white/10 rounded-[36px] px-12 py-8 text-white outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all placeholder:text-slate-800 resize-none text-2xl shadow-inner font-medium"
                      value={formData.isi}
                      onChange={(e) => setFormData({...formData, isi: e.target.value})}
                      placeholder="Sampaikan pesan resmi kepada seluruh RW, RT, dan Warga..."
                    />
                  </div>
                  <div className="flex gap-10 pt-10">
                     <button type="button" onClick={() => { setShowModal(false); setFormData({ judul: '', isi: '', scope: 'global' }); }} className="flex-1 bg-white/5 text-white font-black py-8 rounded-[36px] uppercase tracking-[0.2em] text-[12px] hover:bg-white/10 transition active:scale-95 border border-white/5">Batalkan</button>
                     <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-8 rounded-[36px] uppercase tracking-[0.2em] text-[12px] hover:bg-indigo-500 transition shadow-[0_0_100px_rgba(79,70,229,0.5)] active:scale-95 border border-indigo-400/30">Siarkan Ke Seluruh Kelurahan</button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
