'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/auth';

interface GeoFeature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    id: string;
    nama: string;
    nik: string;
    alamat: string;
    rt: string;
    rw: string;
    role: string;
    is_fakir: boolean;
    is_miskin: boolean;
    is_ibu_hamil: boolean;
    is_balita: boolean;
  };
}

interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

interface PetaWargaProps {
  token: string;
}

// Warna marker berdasarkan kondisi bansos
function getMarkerColor(props: GeoFeature['properties']): string {
  if (props.is_fakir || props.is_miskin) return '#ef4444'; // merah - sangat butuh
  if (props.is_ibu_hamil || props.is_balita) return '#f59e0b'; // kuning - perlu perhatian
  return '#3b82f6'; // biru - normal
}

function createCustomIcon(L: any, color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 14px;
      height: 14px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 3px ${color}40;
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });
}

export default function PetaWarga({ token }: PetaWargaProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markerCount, setMarkerCount] = useState(0);
  const [filterRw, setFilterRw] = useState('');
  const [filterRt, setFilterRt] = useState('');
  const [showBansos, setShowBansos] = useState(false);

  useEffect(() => {
    // Pastikan hanya diinisialisasi sekali
    if (mapInstanceRef.current) return;
    if (!mapRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // Inject Leaflet CSS ke head jika belum ada
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        // Tunggu CSS selesai dimuat
        await new Promise(resolve => { link.onload = resolve; setTimeout(resolve, 500); });
      }

      // Inisialisasi peta dengan center di Indonesia (default Surabaya area)
      const map = L.map(mapRef.current!, {
        center: [-7.2575, 112.7521], // Surabaya
        zoom: 15,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Tile layer OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Load data warga
      await loadMarkers(map, L);
    };

    initMap().catch((e) => {
      setError('Gagal memuat peta: ' + e.message);
      setLoading(false);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const loadMarkers = async (map: any, L: any, rt?: string, rw?: string, bansosOnly?: boolean) => {
    setLoading(true);
    setError('');

    try {
      // Hapus layer marker lama
      map.eachLayer((layer: any) => {
        if (layer._isCustomMarker) map.removeLayer(layer);
      });

      // Tentukan endpoint
      const endpoint = bansosOnly
        ? `/bansos/geojson${rw ? `?rw=${rw}` : ''}${rt ? `&rt=${rt}` : ''}`
        : `/warga/geojson/points${rw ? `?rw=${rw}` : ''}${rt ? `&rt=${rt}` : ''}`;

      const geojson: GeoJSON = await apiFetch(endpoint, token);
      const features = geojson.features || [];

      if (features.length === 0) {
        setMarkerCount(0);
        setLoading(false);
        return;
      }

      // Tambah markers
      const bounds: [number, number][] = [];
      features.forEach((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;
        const color = bansosOnly ? '#f59e0b' : getMarkerColor(props as any);

        const marker = L.marker([lat, lng], { icon: createCustomIcon(L, color) });
        marker._isCustomMarker = true;

        // Popup info
        const bansosInfo = [];
        if ((props as any).is_fakir) bansosInfo.push('Fakir');
        if ((props as any).is_miskin) bansosInfo.push('Miskin');
        if ((props as any).is_ibu_hamil) bansosInfo.push('Ibu Hamil');
        if ((props as any).is_balita) bansosInfo.push('Balita');

        const kategoriStr = bansosOnly
          ? (props as any).kategori_bansos?.join(', ') || '-'
          : bansosInfo.length > 0 ? `🔴 ${bansosInfo.join(', ')}` : '✅ Normal';

        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif; min-width: 200px;">
            <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
              ${props.nama}
            </div>
            <div style="font-size: 12px; color: #475569; space-y: 4px; line-height: 1.8;">
              <div>📋 NIK: <strong>${props.nik || '-'}</strong></div>
              <div>📍 ${props.alamat || 'Alamat tidak diisi'}</div>
              <div>🏠 RT ${props.rt || '?'} / RW ${props.rw || '?'}</div>
              <div style="margin-top: 6px; font-size: 11px; background: ${bansosInfo.length > 0 ? '#fef2f2' : '#f0fdf4'}; padding: 4px 8px; border-radius: 6px; color: ${bansosInfo.length > 0 ? '#ef4444' : '#16a34a'}">
                ${kategoriStr}
              </div>
            </div>
          </div>
        `, { maxWidth: 280 });

        marker.addTo(map);
        bounds.push([lat, lng]);
      });

      // Fit ke semua marker
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 });
      }

      setMarkerCount(features.length);
    } catch (e: any) {
      setError('Gagal memuat data warga: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    if (mapInstanceRef.current) {
      import('leaflet').then(({ default: L }) => {
        loadMarkers(mapInstanceRef.current, L, filterRt || undefined, filterRw || undefined, showBansos);
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/50 border-b border-white/5 flex-wrap">
        <input
          type="text"
          placeholder="Filter RW..."
          value={filterRw}
          onChange={(e) => setFilterRw(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm w-28 placeholder:text-white/30 focus:outline-none focus:border-indigo-400"
        />
        <input
          type="text"
          placeholder="Filter RT..."
          value={filterRt}
          onChange={(e) => setFilterRt(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm w-28 placeholder:text-white/30 focus:outline-none focus:border-indigo-400"
        />
        <label className="flex items-center gap-2 text-white/70 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={showBansos}
            onChange={(e) => setShowBansos(e.target.checked)}
            className="w-4 h-4 rounded accent-orange-400"
          />
          Hanya Bansos
        </label>
        <button
          onClick={handleFilter}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
        >
          Tampilkan
        </button>

        {/* Legend */}
        <div className="flex items-center gap-4 ml-auto text-xs text-white/50">
          {markerCount > 0 && <span className="text-indigo-300 font-medium">{markerCount} titik</span>}
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Normal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Ibu Hamil/Balita
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Fakir/Miskin
          </span>
        </div>
      </div>

      {/* Loading / Error overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center z-[1000] pointer-events-none">
          <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3 shadow-xl">
            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-sm">Memuat data peta...</span>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute top-20 left-4 right-4 bg-red-900/80 border border-red-500/50 rounded-xl p-3 text-red-300 text-sm z-[1000]">
          ⚠️ {error}
        </div>
      )}

      {/* Map Container */}
      <div className="relative flex-1">
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: '400px' }} />
      </div>
    </div>
  );
}
