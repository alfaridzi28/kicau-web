'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function SuperadminSuratPage() {
  const { user, isLoading, logout } = useAuth();
  const [surat, setSurat] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSurat, setSelectedSurat] = useState<any>(null);

  const fetchSurat = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/surat');
      setSurat(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSurat();
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">Audit <span className="text-purple-500">Log Administrasi</span></h1>
          <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Global Monitoring & Integritas Dokumen Pengantar Seluruh Wilayah</p>
        </header>

        <div className="bg-slate-800/40 backdrop-blur-xl rounded-[48px] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-black tracking-widest">
              <tr>
                <th className="p-8">Otoritas Wilayah</th>
                <th className="p-8">Pemohon</th>
                <th className="p-8">Kategori Dokumen</th>
                <th className="p-8">Tanggal Log</th>
                <th className="p-8 text-right">Status Sistem</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr><td colSpan={5} className="p-20 text-center animate-pulse text-slate-500 font-black uppercase">Scanning Global Archives...</td></tr>
              ) : surat.length === 0 ? (
                <tr><td colSpan={5} className="p-20 text-center text-slate-600 font-bold uppercase tracking-widest text-xs italic">No administrative logs found.</td></tr>
              ) : surat.map((s) => (
                <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-all group">
                  <td className="p-8">
                     <p className="text-white font-black text-xs uppercase tracking-tighter italic">RT {s.user?.rt || '-'} / RW {s.user?.rw || '-'}</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase">Kelurahan Regional</p>
                  </td>
                  <td className="p-8">
                    <p className="font-black text-white group-hover:text-purple-400 transition-colors">{s.user?.nama || 'Warga'}</p>
                    <p className="text-[10px] text-slate-500 font-mono">NIK: {s.user?.nik || '-'}</p>
                  </td>
                  <td className="p-8">
                    <span className="bg-purple-500/10 text-purple-400 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter border border-purple-500/20">{s.kategori || s.jenis_surat}</span>
                  </td>
                  <td className="p-8 text-slate-500 font-mono text-xs">
                     {new Date(s.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex flex-col items-end gap-3">
                      <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase border ${
                        s.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 
                        s.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {s.status.replace('_', ' ')}
                      </span>
                      <button onClick={() => setSelectedSurat(s)} className="text-[10px] font-black text-purple-400 uppercase tracking-widest hover:underline">Lihat Detail →</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Modal */}
        {selectedSurat && (
          <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center p-6 z-50">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-2xl p-8 relative shadow-2xl animate-in zoom-in duration-300">
              <button onClick={() => setSelectedSurat(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white text-2xl font-black">×</button>
              <h2 className="text-2xl font-black text-white mb-6 uppercase">Detail Dokumen</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Pemohon</p>
                  <p className="text-lg text-white font-bold">{selectedSurat.user?.nama}</p>
                  <p className="text-xs text-slate-400">NIK: {selectedSurat.user?.nik}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">Keterangan / Keperluan</p>
                  <p className="text-sm text-slate-300 bg-slate-800/50 p-4 rounded-xl border border-white/5">{selectedSurat.keterangan || '-'}</p>
                </div>
                {selectedSurat.catatan && (
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-2">Catatan RT</p>
                    <p className="text-sm text-emerald-400 bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">{selectedSurat.catatan}</p>
                  </div>
                )}
                {selectedSurat.file_ttd_digital && (
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-2">Tanda Tangan Digital RT</p>
                    <img src={selectedSurat.file_ttd_digital} alt="Tanda Tangan" className="w-48 object-contain rounded-xl border border-white/10 bg-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
