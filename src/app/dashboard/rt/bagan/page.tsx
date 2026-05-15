'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RTBaganPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchWarga = async () => {
    setLoading(true);
    try {
      // Fetch all citizens in this RT - use large limit for bagan mapping
      const data = await apiFetch(`/warga?rt=${user?.rt}&rw=${user?.rw}&limit=1000`);
      setWarga(data.items || []);
    } catch (err) {
      console.error(err);
      setWarga([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchWarga();
  }, [user]);

  const handleAppointStaff = async (wargaId: string) => {
    const title = prompt("Masukkan Jabatan Staff (Sekretaris / Bendahara / Staff):", "Sekretaris");
    if (!title) return;
    try {
      await apiFetch(`/warga/${wargaId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: 'rt', jabatan: title })
      });
      setShowModal(false);
      fetchWarga();
      alert("Berhasil menunjuk Staff RT");
    } catch (err: any) {
      alert(err.message || "Gagal menunjuk Staff");
    }
  };

  const handleRemoveStaff = async (wargaId: string) => {
    if (!confirm("Copot jabatan staff ini?")) return;
    try {
      await apiFetch(`/warga/${wargaId}`, {
        method: 'PUT',
        body: JSON.stringify({ role: 'warga', jabatan: 'Warga' })
      });
      fetchWarga();
    } catch (err: any) {
      alert(err.message || "Gagal mencopot jabatan");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  const staffRt = warga.filter(w => w.role === 'rt' && w.jabatan !== 'Ketua' && w.id !== user.id);
  const filteredWarga = warga.filter(w => 
    w.nama.toLowerCase().includes(searchTerm.toLowerCase()) && w.role === 'warga'
  );

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-12">
           <h1 className="text-4xl font-black text-white tracking-tighter italic">Struktur <span className="text-cyan-400">Organisasi RT {user.rt}</span></h1>
           <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Manajemen Tim Kerja Wilayah RT {user.rt} / RW {user.rw}</p>
        </header>

        <div className="flex flex-col items-center gap-16 py-10">
           {/* Ketua RT */}
           <div className="relative group">
              <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-slate-800/60 backdrop-blur-xl p-10 rounded-[40px] border border-cyan-500/30 text-center w-80 shadow-2xl">
                <div className="w-16 h-16 bg-cyan-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">🏠</div>
                <h3 className="text-xl font-black text-white">Ketua RT {user.rt}</h3>
                <p className="text-cyan-400 text-xs font-black uppercase tracking-widest mt-2">{user.nama}</p>
              </div>
              <div className="absolute left-1/2 -bottom-16 w-px h-16 bg-gradient-to-b from-white/10 to-transparent"></div>
           </div>

           {/* Staff RT Grid */}
           <div className="w-full max-w-4xl text-center">
              <h4 className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] mb-8 italic">Tim Pengurus RT (Sekretaris / Bendahara / Staff)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                 {staffRt.map(s => (
                   <div key={s.id} className="bg-slate-800/40 border border-white/5 p-6 rounded-[32px] relative group hover:border-cyan-500/30 transition-all">
                      <div className="w-10 h-10 bg-slate-700 rounded-xl mx-auto mb-4 flex items-center justify-center text-xl">📋</div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.jabatan}</p>
                      <p className="text-sm font-bold text-white truncate">{s.nama}</p>
                      <button onClick={() => handleRemoveStaff(s.id)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-all shadow-lg">✕</button>
                   </div>
                 ))}
                 <button 
                   onClick={() => setShowModal(true)}
                   className="border-2 border-dashed border-white/10 p-6 rounded-[32px] text-slate-500 hover:text-white hover:border-cyan-500/30 transition-all flex flex-col items-center justify-center gap-2"
                 >
                    <span className="text-2xl font-light">+</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Tambah Tim Baru</span>
                 </button>
              </div>
           </div>
        </div>

        {/* Modal: Select Staff */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in duration-300">
               <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic">Tunjuk <span className="text-cyan-400">Staff RT</span></h2>
               <div className="mb-8">
                  <input 
                    type="text" 
                    placeholder="Cari nama warga di RT ini..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="max-h-60 overflow-y-auto space-y-3">
                  {filteredWarga.map(w => (
                    <button key={w.id} onClick={() => handleAppointStaff(w.id)} className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-cyan-600 rounded-3xl transition-all">
                       <div className="text-left">
                          <p className="font-black text-white">{w.nama}</p>
                          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">NIK: {w.nik}</p>
                       </div>
                       <span className="text-xs font-black text-white uppercase tracking-widest">Pilih →</span>
                    </button>
                  ))}
               </div>
               <button onClick={() => setShowModal(false)} className="mt-8 w-full py-4 text-slate-500 font-bold uppercase text-xs">Batal</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
