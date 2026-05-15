'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import SignaturePad from '@/components/SignaturePad';

export default function RTSuratPage() {
  const { user, isLoading, logout } = useAuth();
  const [surat, setSurat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurat, setSelectedSurat] = useState<any>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');

  const fetchSurat = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/surat?rt=${user?.rt}&rw=${user?.rw}`);
      setSurat(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSurat();
  }, [user]);

  const handleApprove = async () => {
    if (!signature) {
      alert("Harap bubuhkan tanda tangan digital");
      return;
    }
    
    try {
      await apiFetch(`/surat/${selectedSurat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'approved',
          file_ttd_digital: signature,
          catatan: catatan
        })
      });
      alert("Surat berhasil disetujui");
      setSelectedSurat(null);
      fetchSurat();
    } catch (err: any) {
      alert(err.message || "Gagal menyetujui surat");
    }
  };

  const handleReject = async () => {
    if (!catatan) {
      alert("Harap masukkan alasan penolakan pada catatan");
      return;
    }
    try {
      await apiFetch(`/surat/${selectedSurat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected', catatan: catatan })
      });
      alert("Surat ditolak");
      setSelectedSurat(null);
      fetchSurat();
    } catch (err: any) {
      alert(err.message || "Gagal menolak surat");
    }
  };

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <h1 className="text-3xl font-bold mb-8">Persetujuan Surat Pengantar</h1>

        <div className="bg-slate-800/40 rounded-3xl border border-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-slate-400 text-xs uppercase font-bold">
              <tr>
                <th className="p-4">Warga</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center">Memuat data...</td></tr>
              ) : surat.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500 italic">Tidak ada pengajuan surat.</td></tr>
              ) : surat.map(s => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-4">
                    <p className="font-bold text-white">{s.user?.nama}</p>
                    <p className="text-[10px] text-slate-500">{s.user?.nik}</p>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase">{s.kategori}</span>
                  </td>
                  <td className="p-4 max-w-xs truncate">{s.keterangan}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                      s.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-orange-500/20 text-orange-400'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {s.status === 'pending' && (
                      <button 
                        onClick={() => setSelectedSurat(s)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                      >
                        Proses
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedSurat && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6">Persetujuan Surat</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nama Pemohon</label>
                    <p className="text-white font-bold">{selectedSurat.user?.nama}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Kategori Surat</label>
                    <p className="text-indigo-400 font-bold uppercase">{selectedSurat.kategori}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Keterangan Warga</label>
                    <p className="text-sm text-slate-300">{selectedSurat.keterangan || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Catatan RT (Alasan tolak/info tambahan)</label>
                    <textarea 
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white h-24 outline-none focus:ring-2 focus:ring-indigo-500"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Tanda Tangan Digital Ketua RT</label>
                  <SignaturePad onChange={setSignature} />
                  <div className="flex gap-4 pt-4">
                    <button onClick={handleReject} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 rounded-2xl border border-red-500/20 transition">Tolak</button>
                    <button onClick={handleApprove} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl shadow-lg transition">Setujui</button>
                  </div>
                  <button onClick={() => setSelectedSurat(null)} className="w-full text-slate-500 text-xs font-bold mt-4">Batal & Tutup</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
