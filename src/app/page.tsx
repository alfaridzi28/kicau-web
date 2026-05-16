'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const ROLE_TO_ROUTE: Record<string, string> = {
  superadmin: '/dashboard/superadmin',
  lurah: '/dashboard/lurah',
  staff: '/dashboard/lurah',
  rw: '/dashboard/rw',
  rt: '/dashboard/rt',
  warga: '/dashboard/warga',
};

interface Pemberitahuan {
  id: number;
  judul: string;
  isi: string;
  foto?: string;
  target_rt?: string;
  target_rw?: string;
  created_at: string;
}

export default function LandingPage() {
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [berita, setBerita] = useState<Pemberitahuan[]>([]);
  const [locating, setLocating] = useState(false);
  const [locInfo, setLocInfo] = useState('');
  const router = useRouter();

  // Auto-get location and fetch pemberitahuan publik
  const fetchBerita = useCallback(async (lat?: number, lng?: number) => {
    try {
      const params = new URLSearchParams();
      if (lat) params.set('lat', lat.toString());
      if (lng) params.set('lng', lng.toString());
      const res = await fetch(`${API_URL}/pemberitahuan/publik?${params}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setBerita(data.pemberitahuan || []);
        if (data.detected_region) {
          setLocInfo(`📍 Terdeteksi di wilayah RT ${data.detected_region.rt} / RW ${data.detected_region.rw}`);
        } else if (lat && lng) {
          setLocInfo('📍 Lokasi Anda terdeteksi, namun belum ada info RT/RW spesifik');
        }
      }
    } catch {
      // Gagal diam-diam, tidak tampilkan error di halaman publik
    }
  }, []);

  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const userInfo = JSON.parse(user);
        const route = ROLE_TO_ROUTE[userInfo.effective_role || userInfo.role] || '/dashboard/warga';
        router.push(route);
        return;
      } catch (e) {}
    }

    // Coba dapat lokasi dan fetch pemberitahuan yang relevan
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setLocating(false);
          await fetchBerita(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          setLocating(false);
          fetchBerita();
        },
        { timeout: 5000 }
      );
    } else {
      fetchBerita();
    }
  }, [fetchBerita, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'NIK atau Password salah.');
        return;
      }
      let effectiveRole = data.role;
      if (data.role === 'staff') {
        if (data.user_info.rt) effectiveRole = 'rt';
        else if (data.user_info.rw) effectiveRole = 'rw';
        else effectiveRole = 'lurah';
      }
      // Simpan effective_role agar bisa dipakai oleh seluruh aplikasi
      data.user_info.effective_role = effectiveRole;
      data.user_info.role = data.role; // Pastikan role juga tersimpan jika backend belum terupdate

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user_info));
      const route = ROLE_TO_ROUTE[effectiveRole] || '/dashboard/warga';
      router.push(route);
    } catch {
      setError('Koneksi ke backend gagal. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return s; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 font-[Inter,sans-serif]">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative border-b border-white/5 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600/30 rounded-xl flex items-center justify-center border border-indigo-500/30">
              <span className="text-xl">🏛️</span>
            </div>
            <div>
              <h1 className="text-white font-extrabold text-xl tracking-tight">KICAU</h1>
              <p className="text-indigo-300/60 text-xs">Sistem Administrasi Warga Digital</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogin(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 shadow-lg shadow-indigo-900/40"
          >
            Masuk ke Sistem →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 text-indigo-300 text-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Sistem Aktif · Pelayanan Warga 24/7
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          Informasi &amp; Layanan
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Warga Digital
          </span>
        </h2>
        <p className="text-white/50 text-lg max-w-2xl mx-auto mb-8">
          Pantau pemberitahuan RT/RW, ajukan surat pengantar, laporkan aduan, dan akses layanan administrasi kelurahan kapan saja.
        </p>
        <button
          onClick={() => setShowLogin(true)}
          className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-indigo-900/40"
        >
          Login & Akses Layanan
        </button>
      </div>

      {/* Pemberitahuan */}
      <div className="relative max-w-7xl mx-auto px-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-xl font-bold text-white">🔔 Pemberitahuan Terbaru</h3>
          {locating && (
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <div className="w-3 h-3 border border-white/40 border-t-transparent rounded-full animate-spin" />
              Mencari lokasi...
            </div>
          )}
          {locInfo && !locating && (
            <span className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              {locInfo}
            </span>
          )}
        </div>

        {berita.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <span className="text-4xl block mb-3">📭</span>
            <p className="text-white/40">Belum ada pemberitahuan untuk wilayah Anda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {berita.map((item) => (
              <div key={item.id} className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-2xl overflow-hidden transition-all hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-900/20 group">
                {item.foto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.foto.startsWith('http') ? item.foto : `${API_URL}${item.foto}`}
                    alt={item.judul}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm">📣</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm leading-snug">{item.judul}</p>
                      <p className="text-white/40 text-xs mt-0.5">
                        {item.target_rt ? `RT ${item.target_rt}` : ''}{item.target_rw ? ` / RW ${item.target_rw}` : ''}
                        {!item.target_rt && !item.target_rw ? 'Semua Warga' : ''}
                      </p>
                    </div>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed line-clamp-3">{item.isi}</p>
                  <p className="text-white/25 text-xs mt-3">{formatDate(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-slate-900/95 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <button
              onClick={() => setShowLogin(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white text-xl"
            >✕</button>

            <div className="text-center mb-7">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600/30 rounded-2xl mb-4 border border-indigo-500/30">
                <span className="text-2xl">🏛️</span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">Masuk ke KICAU</h2>
              <p className="text-white/40 text-sm mt-1">Gunakan NIK dan password Anda</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm flex gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}
              <div>
                <label className="block text-white/70 text-sm mb-2">NIK</label>
                <input
                  type="text"
                  id="nik"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  placeholder="Masukkan NIK Anda"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  placeholder="Masukkan password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Memproses...</>
                ) : 'Masuk →'}
              </button>
            </form>

            {/* Dev hints */}
            <div className="mt-5 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/30 text-xs text-center mb-2">🧪 Akun Testing:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'Superadmin', nik: '3215252801990001', color: 'border-purple-500/30 hover:bg-purple-500/10' },
                  { role: 'Lurah', nik: '3200000000000010', color: 'border-blue-500/30 hover:bg-blue-500/10' },
                  { role: 'RW', nik: '3200000000000012', color: 'border-emerald-500/30 hover:bg-emerald-500/10' },
                  { role: 'RT', nik: '3200000000000014', color: 'border-cyan-500/30 hover:bg-cyan-500/10' },
                  { role: 'Warga', nik: '3215252801990003', color: 'border-slate-500/30 hover:bg-slate-500/10' },
                ].map((acc) => (
                  <button
                    key={acc.nik}
                    type="button"
                    onClick={() => { setNik(acc.nik); setPassword('password123'); }}
                    className={`text-xs px-3 py-2 rounded-lg border ${acc.color} text-white/50 hover:text-white transition text-left`}
                  >
                    <span className="block font-semibold">{acc.role}</span>
                    <span className="text-[10px] opacity-60">NIK: ...{acc.nik.slice(-4)}</span>
                  </button>
                ))}
              </div>
              <p className="text-white/20 text-[10px] text-center mt-2">Password: <code className="bg-white/10 px-1 rounded">password123</code></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
