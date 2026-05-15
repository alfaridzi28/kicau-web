'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function RTBansosPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchWarga = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/warga?rt=${user?.rt}&rw=${user?.rw}`);
      // Filter for warga only (exclude staff/rt/rw)
      setWarga(data.filter((w: any) => w.role === 'warga'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchWarga();
  }, [user]);

  const toggleBansos = async (wargaId: string, field: string, currentValue: boolean) => {
    setUpdatingId(wargaId);
    try {
      await apiFetch(`/warga/${wargaId}`, {
        method: 'PUT',
        body: JSON.stringify({ [field]: !currentValue })
      });
      // Update local state
      setWarga(prev => prev.map(w => w.id === wargaId ? { ...w, [field]: !currentValue } : w));
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui status");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Manajemen Data Sosial (Bansos)</h1>
            <p className="text-slate-400">Identifikasi warga yang berhak menerima bantuan sosial di RT {user.rt}</p>
          </div>
          <ExportButton 
            data={warga.filter(w => w.is_fakir || w.is_miskin || w.is_ibu_hamil || w.is_balita)}
            filename={`Bansos_RT${user.rt}`}
            columns={[
              { key: 'nama', label: 'Nama Warga' },
              { key: 'nik', label: 'NIK' },
              { key: 'is_fakir', label: 'Bantuan Khusus (Fakir)' },
              { key: 'is_miskin', label: 'Bantuan Sosial (Miskin)' },
              { key: 'is_ibu_hamil', label: 'Bantuan Logistik (Hamil)' },
              { key: 'is_balita', label: 'Bantuan Logistik (Balita)' },
              { key: 'alamat', label: 'Alamat' }
            ]}
            label="Export Data Penerima"
          />
        </header>

        <div className="bg-slate-800/40 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-4">Nama Warga</th>
                <th className="p-4 text-center">Fakir</th>
                <th className="p-4 text-center">Miskin</th>
                <th className="p-4 text-center">Ibu Hamil</th>
                <th className="p-4 text-center">Balita</th>
                <th className="p-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center">Memuat data warga...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-500 italic">Belum ada warga terdaftar di RT Anda.</td></tr>
              ) : warga.map(w => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-white">{w.nama}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{w.nik}</p>
                  </td>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={w.is_fakir} 
                      onChange={() => toggleBansos(w.id, 'is_fakir', w.is_fakir)}
                      disabled={updatingId === w.id}
                      className="w-4 h-4 rounded accent-red-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={w.is_miskin} 
                      onChange={() => toggleBansos(w.id, 'is_miskin', w.is_miskin)}
                      disabled={updatingId === w.id}
                      className="w-4 h-4 rounded accent-orange-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={w.is_ibu_hamil} 
                      onChange={() => toggleBansos(w.id, 'is_ibu_hamil', w.is_ibu_hamil)}
                      disabled={updatingId === w.id}
                      className="w-4 h-4 rounded accent-pink-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={w.is_balita} 
                      onChange={() => toggleBansos(w.id, 'is_balita', w.is_balita)}
                      disabled={updatingId === w.id}
                      className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 text-right">
                    {(w.is_fakir || w.is_miskin || w.is_ibu_hamil || w.is_balita) ? (
                      <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-tighter">Penerima</span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-700/10 px-2 py-1 rounded-full uppercase tracking-tighter">Normal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
