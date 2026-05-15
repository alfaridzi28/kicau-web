'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/auth';

interface Aduan {
  id: string;
  judul: string;
  isi: string;
  latitude?: number;
  longitude?: number;
  status: string;
  foto_bukti?: string;
  user?: { nama: string };
}

export default function PetaAduan() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mapInstanceRef.current) return;
    if (!mapRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css'; link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        await new Promise(resolve => { link.onload = resolve; setTimeout(resolve, 500); });
      }

      const map = L.map(mapRef.current!, {
        center: [-7.2575, 112.7521],
        zoom: 13,
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      await loadAduan(map, L);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const loadAduan = async (map: any, L: any) => {
    setLoading(true);
    try {
      const aduanList: Aduan[] = await apiFetch('/aduan');
      const bounds: [number, number][] = [];

      aduanList.filter(a => a.latitude && a.longitude).forEach(a => {
        const color = a.status === 'selesai' ? '#10b981' : a.status === 'diproses' ? '#3b82f6' : '#f59e0b';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:12px;height:12px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 0 10px ${color}80"></div>`,
          iconSize: [12, 12]
        });

        const marker = L.marker([a.latitude!, a.longitude!], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:150px">
            <p style="font-weight:bold;margin:0">${a.judul}</p>
            <p style="font-size:10px;color:#666;margin:2px 0 8px">${a.user?.nama || 'Warga'}</p>
            <span style="font-size:9px;padding:2px 6px;border-radius:4px;background:${color}20;color:${color};font-weight:bold;text-transform:uppercase">${a.status}</span>
          </div>
        `);
        bounds.push([a.latitude!, a.longitude!]);
      });

      if (bounds.length > 0) map.fitBounds(bounds, { padding: [50, 50] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-900 overflow-hidden rounded-3xl border border-white/5">
      <div ref={mapRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center z-[1000]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      )}
    </div>
  );
}
