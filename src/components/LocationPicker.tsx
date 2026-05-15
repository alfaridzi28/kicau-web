'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./LocationMapView'), { ssr: false });

interface LocationPickerProps {
  onLocation: (lat: number, lng: number) => void;
  initialLat?: number | null;
  initialLng?: number | null;
}

export default function LocationPicker({ onLocation, initialLat, initialLng }: LocationPickerProps) {
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser Anda tidak mendukung geolokasi');
      return;
    }
    setLoading(true);
    setError('');
    setStatus('Mendapatkan lokasi...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setStatus(`✅ Lokasi ditemukan (akurasi ±${Math.round(accuracy)}m)`);
        onLocation(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setStatus('');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Izin lokasi ditolak. Aktifkan di pengaturan browser.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Lokasi tidak tersedia. Coba lagi.');
            break;
          default:
            setError('Gagal mendapatkan lokasi: ' + err.message);
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    if (initialLat && initialLng) {
      setStatus(`📍 Lokasi: ${initialLat.toFixed(6)}, ${initialLng.toFixed(6)}`);
    }
  }, [initialLat, initialLng]);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={getLocation}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl text-sm font-medium transition disabled:opacity-50"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>📍</span>
        )}
        {loading ? 'Mendapatkan lokasi...' : 'Dapatkan Lokasi Saya'}
      </button>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}
      {status && !error && (
        <p className="text-green-400 text-xs">{status}</p>
      )}

      {lat && lng && (
        <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: '180px' }}>
          <MapView lat={lat} lng={lng} />
        </div>
      )}
    </div>
  );
}
