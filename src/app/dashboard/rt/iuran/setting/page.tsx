'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function RTSettingIuranPage() {
  const { user, isLoading, logout } = useAuth();
  const [nominal, setNominal] = useState(50000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      apiFetch(`/iuran-setting?rt=${user.rt}&rw=${user.rw}`)
        .then(data => {
          if (data.length > 0) setNominal(data[0].nominal);
          setLoading(false);
        }).catch(() => setLoading(false));
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await apiFetch('/iuran-setting', {
        method: 'POST',
        body: JSON.stringify({ rt: user?.rt, rw: user?.rw, nominal })
      });
      alert("Besaran iuran berhasil diperbarui");
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui iuran");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">Pengaturan Iuran RT {user.rt}</h1>
        <div className="bg-slate-800/40 p-8 rounded-3xl border border-white/5 max-w-md">
          <label className="text-xs font-bold text-slate-500 uppercase block mb-4">Besaran Iuran Bulanan (Rp)</label>
          <input 
            type="number" 
            className="w-full bg-slate-900 border border-white/10 rounded-2xl px-6 py-4 text-2xl font-bold text-white mb-6 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={nominal}
            onChange={(e) => setNominal(parseInt(e.target.value))}
          />
          <button 
            onClick={handleSave}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl transition"
          >
            Simpan Perubahan
          </button>
        </div>
      </main>
    </div>
  );
}
