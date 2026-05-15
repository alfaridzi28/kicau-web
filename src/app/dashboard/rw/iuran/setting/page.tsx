'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RWSettingIuranPage() {
  const { user, isLoading, logout } = useAuth();
  const [rts, setRts] = useState<string[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wargaRes, settingsData] = await Promise.all([
        apiFetch(`/warga?rw=${user?.rw}&limit=1000`),
        apiFetch(`/iuran-setting?rw=${user?.rw}`)
      ]);
      
      const wargaData = wargaRes.items || [];
      // Get unique RTs in this RW
      const uniqueRts = Array.from(new Set(wargaData.map((w: any) => w.rt))).filter(Boolean).sort() as string[];
      setRts(uniqueRts);
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleUpdateSetting = async (rt: string, nominal: number) => {
    setSubmitting(true);
    try {
      await apiFetch('/iuran-setting', {
        method: 'POST',
        body: JSON.stringify({ rt, rw: user?.rw, nominal })
      });
      alert(`Berhasil memperbarui iuran untuk RT ${rt}`);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui iuran");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-white">Konfigurasi <span className="text-indigo-500">Iuran</span></h1>
          <p className="text-slate-400 mt-1">Atur besaran iuran bulanan untuk setiap RT di wilayah RW {user.rw}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500">Memuat data wilayah...</div>
          ) : rts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 italic">Tidak ada data RT ditemukan di RW ini.</div>
          ) : rts.map((rt) => {
            const currentSetting = settings.find(s => s.rt === rt);
            const nominal = currentSetting?.nominal || 50000;
            
            return (
              <div key={rt} className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl">
                    {rt}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wilayah</p>
                    <p className="text-lg font-bold text-white">RT {rt}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Besaran Iuran (Rp)</label>
                    <input 
                      type="number" 
                      defaultValue={nominal}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value);
                        if (val !== nominal) handleUpdateSetting(rt, val);
                      }}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
                      placeholder="Contoh: 50000"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    * Perubahan akan langsung diterapkan untuk penagihan bulan berikutnya.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
