'use client';

import { useEffect, useState } from 'react';
import { useAuth, apiFetch } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default function WargaIuranPage() {
  const { user, isLoading, logout } = useAuth();
  const [iuran, setIuran] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [rtChair, setRtChair] = useState<any>(null);

  useEffect(() => {
    if (user) {
      apiFetch(`/iuran?user_id=${user.id}`)
        .then(setIuran)
        .catch(console.error)
        .finally(() => setLoading(false));

      apiFetch(`/warga?rt=${user.rt}&rw=${user.rw}`)
        .then(data => {
           const chair = data.find((w: any) => w.role === 'rt');
           setRtChair(chair);
        })
        .catch(console.error);
    }
  }, [user]);

  if (isLoading || !user) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#0f172a] text-slate-200">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-8 overflow-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-white">Informasi Iuran</h1>
          <p className="text-slate-400 mt-1">Pantau riwayat pembayaran iuran bulanan Anda</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                 <h2 className="font-bold text-white uppercase text-xs tracking-widest">Riwayat Pembayaran</h2>
                 <span className="text-[10px] text-slate-500">{iuran.length} Transaksi Terdeteksi</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] uppercase text-slate-500 font-bold">
                    <tr>
                      <th className="p-4">Periode</th>
                      <th className="p-4">Tanggal Bayar</th>
                      <th className="p-4">Nominal</th>
                      <th className="p-4">Keterangan</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr><td colSpan={5} className="p-10 text-center">Memuat data iuran...</td></tr>
                    ) : iuran.length === 0 ? (
                      <tr><td colSpan={5} className="p-10 text-center text-slate-500 italic">Belum ada riwayat iuran.</td></tr>
                    ) : iuran.map(item => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-bold text-white">{item.bulan_tahun}</td>
                        <td className="p-4 text-slate-400 text-xs">{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="p-4 text-emerald-400 font-bold">Rp {item.nominal.toLocaleString()}</td>
                        <td className="p-4 text-xs text-slate-500">{item.keterangan || '-'}</td>
                        <td className="p-4 text-right">
                           <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-2 py-1 rounded-full uppercase">Lunas</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-2">Total Kontribusi</h3>
                  <p className="text-4xl font-black text-white mt-4 mb-2">
                    Rp {iuran.reduce((acc, curr) => acc + curr.nominal, 0).toLocaleString()}
                  </p>
                  <p className="text-indigo-100/60 text-xs">Akumulasi iuran Anda selama bergabung di KICAU.</p>
                </div>
                <div className="absolute -right-4 -bottom-4 text-white opacity-10">
                  <span className="text-9xl">💰</span>
                </div>
             </div>

             <div className="bg-slate-800/40 p-6 rounded-3xl border border-white/5 shadow-xl">
                <h3 className="text-sm font-bold text-white mb-4">Butuh Bantuan?</h3>
                <p className="text-xs text-slate-400 mb-6">Jika ada kesalahan data iuran, silakan hubungi Ketua RT {user.rt}.</p>
                <button 
                  onClick={() => setShowContact(true)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-2xl text-xs transition"
                >
                  Hubungi RT {user.rt}
                </button>
             </div>
          </div>
        </div>

        {/* Contact Modal */}
        {showContact && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
              <div className="w-20 h-20 bg-indigo-600 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl shadow-lg shadow-indigo-900/40">
                👤
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Ketua RT {user.rt}</h3>
              <p className="text-indigo-400 font-bold mb-6">{rtChair?.nama || 'Nama Pengurus...'}</p>
              
              <div className="space-y-3">
                 <a 
                    href={`https://wa.me/628123456789`} // Placeholder number
                    target="_blank"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition"
                 >
                   <span>📱</span> WhatsApp
                 </a>
                 <button 
                    onClick={() => setShowContact(false)}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-2xl transition"
                 >
                   Tutup
                 </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-6 italic">Gunakan layanan aduan untuk laporan resmi terkait fasilitas umum.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
