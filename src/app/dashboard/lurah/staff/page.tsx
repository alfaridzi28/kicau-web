'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';

export default function LurahStaffPage() {
  const { user, isLoading, logout } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchWarga, setSearchWarga] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [jabatan, setJabatan] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      // Fetch users with role 'staff' who don't have RT/RW (meaning Kelurahan Staff)
      const data = await apiFetch('/warga?limit=1000');
      const kelurahanStaff = data.items.filter((u: any) => u.role === 'staff' && !u.rt && !u.rw);
      setStaff(kelurahanStaff);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarga = async () => {
    if (searchWarga.length < 3) {
      setWarga([]);
      return;
    }
    try {
      const data = await apiFetch(`/warga?search=${searchWarga}&limit=5`);
      setWarga(data.items.filter((u: any) => u.role === 'warga'));
    } catch (err) {
      console.error(err);
    }
  };

  const promoteToStaff = async (u: any) => {
    const job = prompt("Masukkan Jabatan untuk " + u.nama + " (Contoh: Sekretaris, Bendahara, Staff Umum):");
    if (!job) return;

    try {
      await apiFetch(`/warga/${u.id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: 'staff', jabatan: job })
      });
      alert(u.nama + " berhasil diangkat menjadi Staff Kelurahan!");
      setSearchWarga('');
      setWarga([]);
      fetchStaff();
    } catch (err) {
      alert("Gagal mengangkat staff");
    }
  };

  const updateStaffJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/warga/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ jabatan: jabatan })
      });
      setShowEditModal(false);
      fetchStaff();
    } catch (err) {
      alert("Gagal memperbarui jabatan");
    }
  };

  const demoteStaff = async (u: any) => {
    if (!confirm(`Berhentikan ${u.nama} dari Staff Kelurahan? Statusnya akan kembali menjadi Warga Biasa.`)) return;
    try {
      await apiFetch(`/warga/${u.id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: 'warga', jabatan: 'Warga' })
      });
      fetchStaff();
    } catch (err) {
      alert("Gagal menonaktifkan staff");
    }
  };

  useEffect(() => {
    if (user) fetchStaff();
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchWarga) fetchWarga();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchWarga]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-600/5 to-transparent -z-10"></div>
        
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 animate-in fade-in slide-in-from-left duration-700">
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">Manajemen <span className="text-indigo-400">Staff</span></h1>
            <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Struktur Organisasi & Otoritas Kantor Kelurahan</p>
          </div>

          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-4 rounded-[20px] shadow-2xl shadow-indigo-900/40 transition-all uppercase tracking-widest text-[11px] flex items-center gap-3"
          >
             <span className="text-xl">🤝</span> Angkat Staff Baru
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-in fade-in slide-in-from-bottom duration-500">
           <StatCard title="Total Staff" value={staff.length} icon="📋" color="indigo" subtitle="Aktif Bekerja" />
           <StatCard 
             title="Varian Jabatan" 
             value={new Set(staff.map(s => s.jabatan)).size} 
             icon="🏗️" 
             color="emerald" 
             subtitle="Jenis Peran Terisi" 
           />
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-[48px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="p-8">Profil Staff</th>
                <th className="p-8">Jabatan Resmi</th>
                <th className="p-8">Status</th>
                <th className="p-8 text-right">Kelola</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">Mengambil Struktur...</td></tr>
              ) : staff.length === 0 ? (
                <tr><td colSpan={4} className="p-20 text-center text-slate-600 italic font-bold uppercase">Belum ada warga yang diangkat menjadi staff kantor.</td></tr>
              ) : staff.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl">👤</div>
                       <div>
                          <p className="font-black text-white group-hover:text-indigo-400 transition-colors text-lg tracking-tight uppercase">{s.nama}</p>
                          <p className="text-[10px] text-slate-500 font-mono">NIK: {s.nik}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border border-emerald-500/20">{s.jabatan}</span>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktif</span>
                    </div>
                  </td>
                  <td className="p-8 text-right space-x-4">
                    <button 
                      onClick={() => { setSelectedUser(s); setJabatan(s.jabatan); setShowEditModal(true); }}
                      className="text-indigo-400 hover:text-indigo-300 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                       Ubah Jabatan
                    </button>
                    <button 
                      onClick={() => demoteStaff(s)}
                      className="text-red-500/50 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                       Berhentikan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 z-[2000]">
            <div className="bg-[#0f172a] border border-white/10 rounded-[60px] w-full max-w-2xl p-12 shadow-[0_0_100px_rgba(79,70,229,0.1)] animate-in zoom-in duration-300">
               <div className="flex justify-between items-start mb-10">
                  <div>
                     <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase">Angkat Staff Baru</h2>
                     <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Cari warga untuk dijadikan bagian dari tim kelurahan</p>
                  </div>
                  <button onClick={() => { setShowAddModal(false); setSearchWarga(''); setWarga([]); }} className="text-slate-500 hover:text-white text-3xl transition-colors">×</button>
               </div>
               
               <div className="space-y-8">
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full bg-slate-950/50 border border-white/10 rounded-[24px] px-8 py-5 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-700"
                      value={searchWarga}
                      onChange={(e) => setSearchWarga(e.target.value)}
                      placeholder="Ketik Nama atau NIK Warga..."
                    />
                    {searchWarga.length > 0 && searchWarga.length < 3 && <p className="text-[9px] text-orange-400 mt-2 ml-2 uppercase font-black tracking-widest animate-pulse">Ketik minimal 3 karakter...</p>}
                  </div>

                  <div className="space-y-4">
                     {warga.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-6 bg-white/5 rounded-[24px] border border-white/5 hover:border-indigo-500/30 transition-all">
                           <div>
                              <p className="font-black text-white uppercase">{u.nama}</p>
                              <p className="text-[10px] text-slate-500 font-mono">NIK: {u.nik} • RT {u.rt}/RW {u.rw}</p>
                           </div>
                           <button 
                             onClick={() => promoteToStaff(u)}
                             className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black px-6 py-3 rounded-xl uppercase tracking-widest transition-all"
                           >
                              Pilih & Angkat
                           </button>
                        </div>
                     ))}
                     {searchWarga.length >= 3 && warga.length === 0 && (
                        <p className="text-center py-10 text-slate-600 font-bold uppercase text-xs italic">Warga tidak ditemukan atau sudah memiliki jabatan.</p>
                     )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Edit Jabatan Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 z-[2000]">
            <div className="bg-[#0f172a] border border-white/10 rounded-[60px] w-full max-w-md p-12 shadow-2xl animate-in zoom-in duration-300">
               <h2 className="text-3xl font-black text-white mb-8 tracking-tighter italic uppercase text-center">Ubah Jabatan</h2>
               <form onSubmit={updateStaffJob} className="space-y-8">
                  <div className="text-center mb-8">
                     <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">{selectedUser.nama}</p>
                     <p className="text-indigo-400 text-[10px] font-black">STAF AKTIF KELURAHAN</p>
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">Jabatan Baru</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-950/50 border border-white/10 rounded-[24px] px-8 py-5 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      placeholder="Misal: Sekretaris Kelurahan"
                    />
                  </div>
                  <div className="flex gap-4">
                     <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-white/5 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-[11px] hover:bg-white/10">Batal</button>
                     <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-[11px] hover:bg-indigo-500 shadow-2xl shadow-indigo-900/40">Simpan</button>
                  </div>
               </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
