'use client';

import { useState } from 'react';

export default function Login() {
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Pada production (Vercel), pastikan URL mengarah ke backend Render
    // const apiUrl = 'https://kicau-backend.onrender.com/login';
    const apiUrl = 'http://localhost:8000/login';
    
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nik, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('kicau_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user_info));
        alert(`Selamat datang ${data.user_info.nama}!`);
        window.location.href = '/dashboard';
      } else {
        alert('Login Gagal. NIK atau Password salah.');
      }
    } catch (error) {
      alert('Koneksi ke backend gagal. Pastikan backend sudah berjalan.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md shadow-2xl border border-white/20 text-white">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">KICAU</h1>
          <p className="text-blue-200 text-sm">Kumpulan Informasi & Catatan Administrasi Umum</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Nomor Induk Kependudukan (NIK)</label>
            <input 
              type="text" 
              value={nik}
              onChange={(e) => setNik(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-white/50"
              placeholder="Contoh: 3215252801990004"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 text-white placeholder-white/50"
              placeholder="Contoh: password"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl transition duration-300 transform hover:scale-105 shadow-lg"
          >
            Masuk ke Sistem
          </button>
        </form>
      </div>
    </div>
  );
}
