'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RWBaganPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'rt_chair' | 'rw_staff' | 'rt_staff'>('rt_chair');
  const [selectedRt, setSelectedRt] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualRtInput, setManualRtInput] = useState('');
  const [showAddRtModal, setShowAddRtModal] = useState(false);

  const fetchWarga = async () => {
    setLoading(true);
    try {
      // Fetch with large limit to ensure we see all staff/chairs for the bagan
      const data = await apiFetch(`/warga?rw=${user?.rw}&limit=1000`);
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

  const rtNumbers = Array.from(
    new Set(warga.filter(w => w.role === 'rt').map(w => w.rt).filter(Boolean))
  ).sort((a, b) => parseInt(a) - parseInt(b));

  const handleAppoint = async (wargaId: string) => {
    let payload: any = {};
    if (modalType === 'rt_chair') {
      payload = { role: 'rt', jabatan: 'Ketua', rt: selectedRt };
    } else if (modalType === 'rw_staff') {
      // Tunjuk Staff RW: Beri role 'rw' agar dapat menu yang sama, jabatan custom
      const title = prompt("Masukkan Jabatan Staff (Sekretaris / Bendahara / Staff):", "Sekretaris");
      if (!title) return;
      payload = { role: 'rw', jabatan: title };
    }
    
    try {
      await apiFetch(`/warga/${wargaId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      setShowModal(false);
      fetchWarga();
      alert("Berhasil memperbarui struktur organisasi");
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui struktur");
    }
  };

  const handleRemove = async (wargaId: string) => {
    if (!confirm("Copot jabatan ini?")) return;
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

  const rwStaff = warga.filter(w => w.role === 'rw' && w.jabatan !== 'Ketua' && w.id !== user.id);
  const getRtChair = (rtNum: string) => {
    const rts = warga.filter(w => w.role === 'rt' && w.rt === rtNum);
    return rts.find(w => w.jabatan?.toLowerCase().includes('ketua')) || rts[0];
  };
  const getRtStaff = (rtNum: string) => {
    const chair = getRtChair(rtNum);
    return warga.filter(w => w.role === 'rt' && w.rt === rtNum && w.id !== chair?.id);
  };

  // Filter Warga untuk pencarian:
  // 1. Jika menunjuk Ketua RT, tampilkan warga yang belum punya role admin di RW tersebut
  // 2. Jika menunjuk Staff RW, tampilkan seluruh warga di RW tersebut
  const filteredWarga = warga.filter(w => {
    const matchName = w.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      w.nik.includes(searchTerm);
    
    if (modalType === 'rt_chair') {
       // Hanya tampilkan warga yang alamat RT-nya sesuai dengan yang akan ditunjuk
       return matchName && w.rt === selectedRt && w.role === 'warga';
    }
    
    return matchName && w.role === 'warga';
  });

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter italic">Struktur <span className="text-emerald-400">Organisasi RW</span></h1>
            <p className="text-slate-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Manajemen Kepengurusan Wilayah Terpadu</p>
          </div>
          <button 
            onClick={() => setShowAddRtModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-emerald-900/40 transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            + Tambah Unit RT
          </button>
        </header>

        <div className="flex flex-col items-center gap-16 py-10">
          {/* RW LEVEL: KETUA & STAFF */}
          <div className="flex flex-col items-center gap-10">
             {/* Ketua RW */}
             <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative bg-slate-800/60 backdrop-blur-xl p-8 rounded-[40px] border border-emerald-500/30 text-center w-full max-w-xs shadow-2xl">
                  <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl border-2 border-emerald-400/30">👑</div>
                  <h3 className="text-xl font-black text-white">Ketua RW {user.rw}</h3>
                  <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mt-2">{user.nama}</p>
                </div>
                <div className="absolute left-1/2 -bottom-10 w-px h-10 bg-white/10"></div>
             </div>

             {/* Staff RW */}
             <div className="flex gap-6">
                {rwStaff.map(s => (
                  <div key={s.id} className="bg-slate-800/40 border border-white/5 p-4 rounded-3xl text-center w-48 relative group">
                     <div className="w-10 h-10 bg-slate-700 rounded-xl mx-auto mb-2 flex items-center justify-center text-xl">📋</div>
                     <p className="text-[10px] font-black text-slate-500 uppercase">{s.jabatan}</p>
                     <p className="text-xs font-bold text-white truncate">{s.nama}</p>
                     <button onClick={() => handleRemove(s.id)} className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">✕</button>
                  </div>
                ))}
                <button 
                  onClick={() => { setModalType('rw_staff'); setShowModal(true); }}
                  className="border-2 border-dashed border-white/10 p-4 rounded-3xl text-center w-48 text-slate-500 hover:text-white hover:border-emerald-500/30 transition-all flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-xl">+</span>
                  <span className="text-[9px] font-black uppercase tracking-widest">Tambah Staff RW</span>
                </button>
             </div>
             <div className="w-px h-16 bg-gradient-to-b from-white/10 to-transparent"></div>
          </div>

          {/* RT LEVEL GRID */}
          <div className="w-full max-w-7xl">
            <h3 className="text-center text-slate-500 font-black uppercase tracking-[0.4em] text-xs mb-12 italic">Kepengurusan Unit RT</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {rtNumbers.map((num) => {
                const chair = getRtChair(num);
                const staffs = getRtStaff(num);
                return (
                  <div key={num} className="flex flex-col items-center gap-6">
                    {/* Ketua RT Box */}
                    <div className={`w-full p-6 rounded-[32px] border transition-all relative ${
                      chair ? 'bg-slate-800/60 border-indigo-500/30' : 'bg-white/5 border-dashed border-white/10'
                    }`}>
                      <div className="flex justify-between flex-wrap gap-y-4 items-start mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${chair ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-500'}`}>{num}</div>
                        {chair && (
                          <button onClick={() => handleRemove(chair.id)} className="text-slate-600 hover:text-red-400 text-xs">🗑️</button>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-slate-500 uppercase mb-1">Ketua RT {num}</h4>
                      {chair ? (
                         <p className="text-sm font-black text-white truncate">{chair.nama}</p>
                      ) : (
                         <button onClick={() => { setSelectedRt(num); setModalType('rt_chair'); setShowModal(true); }} className="text-[10px] font-black text-emerald-400 uppercase hover:underline">+ Tunjuk Ketua</button>
                      )}
                    </div>

                    {/* Staff RT Area (View Only for RW, managed by RT) */}
                    <div className="flex flex-col gap-2 w-full px-4">
                       {staffs.map(s => (
                         <div key={s.id} className="bg-white/5 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
                            <div className="w-6 h-6 bg-slate-700 rounded-lg flex items-center justify-center text-[10px]">📋</div>
                            <div className="overflow-hidden">
                               <p className="text-[8px] font-black text-slate-500 uppercase">Staff RT</p>
                               <p className="text-[10px] text-white font-bold truncate">{s.nama}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal: Appoint RW Staff or RT Chair */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-[48px] w-full max-w-xl p-10 shadow-2xl animate-in zoom-in duration-300">
               <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic">
                 {modalType === 'rw_staff' ? 'Tunjuk Staff RW' : `Pilih Ketua RT ${selectedRt}`}
               </h2>
               <div className="mb-8">
                  <input 
                    type="text" 
                    placeholder="Cari nama warga..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {filteredWarga.length === 0 ? (
                    <div className="py-12 text-center">
                       <p className="text-slate-500 font-bold italic text-sm">Warga tidak ditemukan.</p>
                       <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-widest font-black">Pastikan warga tersebut terdaftar di RT {selectedRt}</p>
                    </div>
                  ) : filteredWarga.map(w => (
                    <button key={w.id} onClick={() => handleAppoint(w.id)} className="w-full flex items-center justify-between p-5 bg-white/5 hover:bg-emerald-600 rounded-3xl transition-all">
                      <div className="text-left">
                         <p className="font-black text-white">{w.nama}</p>
                         <p className="text-[9px] text-slate-500 uppercase font-bold">NIK: {w.nik}</p>
                      </div>
                      <span className="text-xs font-black text-white uppercase tracking-widest">Pilih →</span>
                    </button>
                  ))}
               </div>
               <button onClick={() => setShowModal(false)} className="mt-8 w-full py-4 text-slate-500 font-bold uppercase text-xs">Tutup</button>
            </div>
          </div>
        )}

        {/* Add RT Unit Modal */}
        {showAddRtModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
             <div className="bg-slate-900 border border-white/10 rounded-[40px] w-full max-w-sm p-10 shadow-2xl animate-in zoom-in">
                <h2 className="text-2xl font-black text-white mb-6 text-center">Unit RT Baru</h2>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-center text-xl font-black mb-6" value={manualRtInput} onChange={e => setManualRtInput(e.target.value)} placeholder="00" />
                <div className="flex gap-4">
                   <button onClick={() => setShowAddRtModal(false)} className="flex-1 py-4 text-slate-500 font-bold uppercase text-xs">Batal</button>
                   <button onClick={() => { setSelectedRt(manualRtInput); setModalType('rt_chair'); setShowAddRtModal(false); setShowModal(true); setManualRtInput(''); }} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase">Lanjut</button>
                </div>
             </div>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center">
             <div className="text-center">
                <div className="w-16 h-16 border-t-4 border-emerald-500 rounded-full animate-spin mx-auto mb-8"></div>
                <p className="text-slate-500 font-black uppercase tracking-[0.5em] text-xs">Menyusun Struktur...</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}


