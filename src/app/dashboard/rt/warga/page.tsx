'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import ExportButton from '@/components/ExportButton';

export default function RTWargaPage() {
  const { user, isLoading, logout } = useAuth();
  const [warga, setWarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedWarga, setSelectedWarga] = useState<any>(null);
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    nomor_kk: '',
    alamat: '',
    is_fakir: false,
    is_miskin: false,
    is_ibu_hamil: false,
    is_balita: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = user?.role === 'rw' ? `/warga?rw=${user.rw}` : `/warga?rt=${user?.rt}&rw=${user?.rw}`;
      const data = await apiFetch(endpoint);
      setWarga(data.filter((w: any) => w.role === 'warga'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleOpenModal = (w?: any) => {
    if (w) {
      setSelectedWarga(w);
      setFormData({
        nama: w.nama,
        nik: w.nik,
        nomor_kk: w.nomor_kk || '',
        alamat: w.alamat || '',
        is_fakir: w.is_fakir,
        is_miskin: w.is_miskin,
        is_ibu_hamil: w.is_ibu_hamil,
        is_balita: w.is_balita,
      });
    } else {
      setSelectedWarga(null);
      setFormData({
        nama: '',
        nik: '',
        nomor_kk: '',
        alamat: '',
        is_fakir: false,
        is_miskin: false,
        is_ibu_hamil: false,
        is_balita: false,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedWarga) {
        await apiFetch(`/warga/${selectedWarga.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch(`/warga`, {
          method: 'POST',
          body: JSON.stringify({ ...formData, rt: user?.rt, rw: user?.rw, role: 'warga' })
        });
      }
      setShowModal(false);
      fetchData();
      alert("Data warga berhasil disimpan");
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan data");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus data warga ini secara permanen?")) return;
    try {
      await apiFetch(`/warga/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus data");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-extrabold text-white">Kelola Warga RT {user.rt}</h1>
            <p className="text-slate-400 mt-1">Database kependudukan tingkat RT / RW {user.rw}</p>
          </div>
          <div className="flex gap-4">
            <ExportButton 
              data={warga}
              filename={`Warga_RT${user.rt}`}
              columns={[
                { key: 'nama', label: 'Nama' },
                { key: 'nik', label: 'NIK' },
                { key: 'nomor_kk', label: 'No. KK' },
                { key: 'alamat', label: 'Alamat' }
              ]}
            />
            <button 
              onClick={() => handleOpenModal()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition flex items-center gap-2"
            >
              <span>➕</span> Tambah Warga
            </button>
          </div>
        </header>

        <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-bold">
              <tr>
                <th className="p-5">Identitas Warga</th>
                <th className="p-5">Informasi KK</th>
                <th className="p-5">Status Sosial</th>
                <th className="p-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center">Memuat database...</td></tr>
              ) : warga.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-500 italic">Belum ada warga terdaftar.</td></tr>
              ) : warga.map(w => (
                <tr key={w.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-5">
                    <p className="font-bold text-white">{w.nama}</p>
                    <p className="text-xs text-slate-500 font-mono">{w.nik}</p>
                  </td>
                  <td className="p-5">
                    <p className="text-xs text-slate-400">KK: {w.nomor_kk || '-'}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{w.alamat || 'Alamat tidak diatur'}</p>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-wrap gap-1">
                      {w.is_fakir && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 uppercase">Fakir</span>}
                      {w.is_miskin && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 uppercase">Miskin</span>}
                      {!w.is_fakir && !w.is_miskin && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-700/20 text-slate-500 uppercase">Mampu</span>}
                    </div>
                  </td>
                  <td className="p-5 text-right space-x-3">
                    <button onClick={() => handleOpenModal(w)} className="text-indigo-400 hover:text-indigo-300 font-bold text-xs transition">Edit</button>
                    <button onClick={() => handleDelete(w.id)} className="text-red-400 hover:text-red-300 font-bold text-xs transition">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl p-8 shadow-2xl overflow-auto max-h-[90vh]">
              <h2 className="text-2xl font-bold text-white mb-6">{selectedWarga ? 'Update Data Warga' : 'Tambah Warga Baru'}</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Lengkap</label>
                    <input 
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">NIK</label>
                    <input 
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.nik}
                      onChange={(e) => setFormData({...formData, nik: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nomor KK</label>
                    <input 
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.nomor_kk}
                      onChange={(e) => setFormData({...formData, nomor_kk: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Alamat Lengkap</label>
                    <input 
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.alamat}
                      onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Status Ekonomi & Sosial</p>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Fakir', key: 'is_fakir' },
                        { label: 'Miskin', key: 'is_miskin' },
                        { label: 'Ibu Hamil', key: 'is_ibu_hamil' },
                        { label: 'Balita', key: 'is_balita' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition">
                           <input 
                            type="checkbox"
                            checked={(formData as any)[item.key]}
                            onChange={(e) => setFormData({...formData, [item.key]: e.target.checked})}
                            className="w-4 h-4 rounded accent-indigo-500"
                           />
                           <span className="text-xs font-bold text-white">{item.label}</span>
                        </label>
                      ))}
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 text-white font-bold py-3 rounded-2xl transition hover:bg-slate-700">Batal</button>
                  <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-2xl shadow-lg transition hover:bg-indigo-500">Simpan Perubahan</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
