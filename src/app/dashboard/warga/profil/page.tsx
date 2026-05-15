'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function WargaProfilPage() {
  const { user, isLoading, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ no_telp: '', alamat: '', foto: '' });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/warga/${user.id}`);
      setProfile(data);
      setFormData({ 
        no_telp: data.no_telp || '', 
        alamat: data.alamat || '',
        foto: data.foto || ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/warga/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      setIsEditing(false);
      fetchProfile();
      alert('Profil berhasil diperbarui');
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui profil');
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto flex justify-center items-start">
        <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom duration-700">
          <header className="mb-12 text-center">
            <h1 className="text-5xl font-black text-white tracking-tighter italic">Profil <span className="text-indigo-400">Warga</span></h1>
            <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Identitas Digital & Informasi Terverifikasi KICAU</p>
          </header>

          <div className="bg-slate-800/40 backdrop-blur-xl rounded-[48px] border border-white/5 shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-600 to-purple-600 -z-10"></div>
            
            <div className="p-12">
               <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-12">
                  <div className="relative group/avatar">
                    <div className="w-32 h-32 rounded-[32px] bg-slate-900 border-4 border-[#0f172a] flex items-center justify-center text-5xl shadow-2xl overflow-hidden">
                       {formData.foto ? (
                         <img src={formData.foto} className="w-full h-full object-cover" />
                       ) : (
                         '👤'
                       )}
                    </div>
                    {isEditing && (
                      <label className="absolute inset-0 bg-black/60 rounded-[32px] flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                         <span className="text-xs font-black text-white uppercase tracking-tighter">Ganti Foto</span>
                         <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                    )}
                  </div>
                  <div className="flex-1 text-center md:text-left pb-4">
                     <h2 className="text-3xl font-black text-white leading-tight">{profile?.nama}</h2>
                     <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs mt-1">Status: {profile?.role}</p>
                  </div>
                  <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="bg-white/5 hover:bg-white/10 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mb-4 border border-white/5"
                  >
                    {isEditing ? 'Batal Edit' : 'Edit Profil'}
                  </button>
               </div>

               {loading ? (
                 <div className="py-20 text-center animate-pulse text-slate-500 font-black uppercase tracking-widest">Sinkronisasi Data Profil...</div>
               ) : (
                 <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="space-y-10">
                       <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">NIK (Identitas Nasional)</label>
                          <div className="bg-slate-950/50 p-5 rounded-[24px] border border-white/5 text-slate-300 font-mono text-sm tracking-wider">
                             {profile?.nik}
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Nomor KK</label>
                          <div className="bg-slate-950/50 p-5 rounded-[24px] border border-white/5 text-slate-300 font-mono text-sm tracking-wider">
                             {profile?.nomor_kk || '-'}
                          </div>
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Wilayah Domisili</label>
                          <div className="bg-indigo-600/10 p-5 rounded-[24px] border border-indigo-500/20 text-indigo-400 font-black text-sm">
                             RT {profile?.rt} / RW {profile?.rw}
                          </div>
                       </div>
                    </div>

                    <div className="space-y-10">
                       <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Alamat Lengkap</label>
                          {isEditing ? (
                            <textarea 
                              className="w-full bg-slate-900 border border-white/10 rounded-[24px] p-5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                              rows={3}
                              value={formData.alamat}
                              onChange={e => setFormData({...formData, alamat: e.target.value})}
                            />
                          ) : (
                            <div className="bg-slate-950/50 p-5 rounded-[24px] border border-white/5 text-slate-300 text-sm leading-relaxed min-h-[100px]">
                               {profile?.alamat || 'Alamat belum dilengkapi.'}
                            </div>
                          )}
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block ml-2">Nomor Telepon / WA</label>
                          {isEditing ? (
                            <input 
                              type="text"
                              className="w-full bg-slate-900 border border-white/10 rounded-[24px] p-5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              value={formData.no_telp}
                              onChange={e => setFormData({...formData, no_telp: e.target.value})}
                              placeholder="Contoh: 08123456789"
                            />
                          ) : (
                            <div className="bg-emerald-500/10 p-5 rounded-[24px] border border-emerald-500/20 text-emerald-400 font-black text-sm">
                               {profile?.no_telp || '-'}
                            </div>
                          )}
                       </div>
                    </div>

                    {isEditing && (
                      <div className="col-span-full pt-6">
                         <button 
                           type="submit"
                           className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[24px] uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-900/40 transition-all active:scale-95"
                         >
                           Simpan Perubahan Profil
                         </button>
                      </div>
                    )}
                 </form>
               )}
            </div>
          </div>
          
          <div className="mt-12 text-center text-slate-600 text-[9px] font-bold uppercase tracking-[0.3em]">
             Data Terverifikasi Secara Digital Oleh Sistem KICAU
          </div>
        </div>
      </main>
    </div>
  );
}
