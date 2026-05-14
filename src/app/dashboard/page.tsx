'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/');
    }
  }, [router]);

  if (!user) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-xl">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-blue-900 text-white p-4 shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">KICAU Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="font-medium bg-blue-800 px-3 py-1 rounded-lg">
            {user.nama} (Role: {user.role.toUpperCase()})
          </span>
          <button 
            onClick={() => {
              localStorage.clear();
              router.push('/');
            }}
            className="bg-red-500 px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition shadow-sm"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 flex items-center justify-between">
              Pemberitahuan Area RW {user.rw}
            </h2>
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 hover:shadow-md transition">
              <h3 className="font-bold text-blue-900 text-lg">Kerja Bakti Rutin</h3>
              <p className="text-gray-700 mt-2">Diberitahukan kepada seluruh warga RW {user.rw} untuk mengikuti kerja bakti pada hari Minggu pagi di lapangan serbaguna.</p>
              <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
                <span>Dibuat oleh: Ketua RW</span>
                <span>14 Mei 2026</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
             <h2 className="text-xl font-semibold mb-4">Peta Interaktif (Geospatial Area)</h2>
             <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                [ Integrasi Peta / OSRM akan tampil di sini via Leaflet ]
             </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
             <h2 className="text-lg font-bold mb-4 text-gray-800">Menu Akses Cepat</h2>
             <ul className="space-y-3">
               <li><button className="w-full text-left px-5 py-4 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition font-medium border border-gray-200 hover:border-blue-200 flex justify-between items-center">
                 Buat Surat Pengantar <span>→</span>
               </button></li>
               <li><button className="w-full text-left px-5 py-4 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition font-medium border border-gray-200 hover:border-blue-200 flex justify-between items-center">
                 Laporan Aduan Warga <span>→</span>
               </button></li>
               <li><button className="w-full text-left px-5 py-4 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition font-medium border border-gray-200 hover:border-blue-200 flex justify-between items-center">
                 Cek Iuran Bulanan <span>→</span>
               </button></li>
               {user.role !== 'warga' && (
                 <li><button className="w-full text-left px-5 py-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition font-medium border border-indigo-200 flex justify-between items-center">
                   Panel Administrasi {user.role.toUpperCase()} <span>→</span>
                 </button></li>
               )}
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
