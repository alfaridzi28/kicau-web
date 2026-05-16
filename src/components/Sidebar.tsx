'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import packageJson from '../../package.json';

interface SidebarProps {
  user: { nama: string; role: string; rt?: string; rw?: string; jabatan?: string; effective_role?: string };
  onLogout: () => void;
}

const menuByRole: Record<string, { label: string; icon: string; href: string }[]> = {
  lurah: [
    { label: 'Dashboard', icon: '📊', href: '/dashboard/lurah' },
    { label: 'Data Warga', icon: '👥', href: '/dashboard/lurah/warga' },
    { label: 'Manajemen Staff', icon: '👔', href: '/dashboard/lurah/staff' },
    { label: 'Bansos', icon: '🤝', href: '/dashboard/lurah/bansos' },
    { label: 'Aset Wilayah', icon: '🏪', href: '/dashboard/lurah/aset' },
    { label: 'Aduan Warga', icon: '📢', href: '/dashboard/lurah/aduan' },
    { label: 'Surat Pengantar', icon: '📄', href: '/dashboard/lurah/surat' },
    { label: 'Pemberitahuan', icon: '🔔', href: '/dashboard/lurah/pemberitahuan' },
  ],
  superadmin: [
    { label: 'Master Dashboard', icon: '📊', href: '/dashboard/superadmin' },
    { label: 'Manajemen User', icon: '👥', href: '/dashboard/superadmin/warga' },
    { label: 'Peta Global', icon: '🗺️', href: '/dashboard/superadmin/peta' },
    { label: 'Iuran & Kas', icon: '💰', href: '/dashboard/superadmin/iuran' },
    { label: 'Manajemen Bansos', icon: '🤝', href: '/dashboard/superadmin/bansos' },
    { label: 'Inventaris Sistem', icon: '📦', href: '/dashboard/superadmin/aset' },
    { label: 'Pusat Aduan', icon: '📢', href: '/dashboard/superadmin/aduan' },
    { label: 'Arsip Surat', icon: '📄', href: '/dashboard/superadmin/surat' },
    { label: 'Broadcast Global', icon: '🔔', href: '/dashboard/superadmin/pemberitahuan' },
  ],
  staff: [
    { label: 'Dashboard', icon: '📊', href: '/dashboard/lurah' },
    { label: 'Data Warga', icon: '👥', href: '/dashboard/lurah/warga' },
    { label: 'Aduan', icon: '📢', href: '/dashboard/lurah/aduan' },
    { label: 'Pemberitahuan', icon: '🔔', href: '/dashboard/lurah/pemberitahuan' },
  ],
  rw: [
    { label: 'Dashboard RW', icon: '📊', href: '/dashboard/rw' },
    { label: 'Warga RW', icon: '👥', href: '/dashboard/rw/warga' },
    { label: 'Iuran & Kas', icon: '💰', href: '/dashboard/rw/iuran' },
    { label: 'Aset RW', icon: '🏪', href: '/dashboard/rw/aset' },
    { label: 'Aduan', icon: '📢', href: '/dashboard/rw/aduan' },
    { label: 'Surat Pengantar', icon: '📄', href: '/dashboard/rw/surat' },
    { label: 'Pemberitahuan', icon: '🔔', href: '/dashboard/rw/pemberitahuan' },
    { label: 'Bagan Organisasi', icon: '🌿', href: '/dashboard/rw/bagan' },
  ],
  rt: [
    { label: 'Dashboard RT', icon: '📊', href: '/dashboard/rt' },
    { label: 'Bagan Organisasi', icon: '🌿', href: '/dashboard/rt/bagan' },
    { label: 'Warga Saya', icon: '👥', href: '/dashboard/rt/warga' },
    { label: 'Iuran & Kas', icon: '💰', href: '/dashboard/rt/iuran' },
    { label: 'Aset RT', icon: '🏪', href: '/dashboard/rt/aset' },
    { label: 'Aduan Masuk', icon: '📢', href: '/dashboard/rt/aduan' },
    { label: 'Surat Pengantar', icon: '📄', href: '/dashboard/rt/surat' },
    { label: 'Pemberitahuan', icon: '🔔', href: '/dashboard/rt/pemberitahuan' },
  ],
  warga: [
    { label: 'Beranda', icon: '🏠', href: '/dashboard/warga' },
    { label: 'Struktur Wilayah', icon: '🌿', href: '/dashboard/warga/bagan' },
    { label: 'Cek Iuran', icon: '💰', href: '/dashboard/warga/iuran' },
    { label: 'Buat Aduan', icon: '📢', href: '/dashboard/warga/aduan' },
    { label: 'Surat Pengantar', icon: '📄', href: '/dashboard/warga/surat' },
    { label: 'Aset & Pinjam', icon: '🏪', href: '/dashboard/warga/aset' },
    { label: 'Pemberitahuan', icon: '🔔', href: '/dashboard/warga/pemberitahuan' },
    { label: 'Profil Saya', icon: '👤', href: '/dashboard/warga/profil' },
  ],
};

const roleColors: Record<string, string> = {
  lurah: 'from-indigo-900 to-indigo-800',
  superadmin: 'from-purple-900 to-purple-800',
  rw: 'from-emerald-900 to-emerald-800',
  rt: 'from-cyan-900 to-cyan-800',
  warga: 'from-slate-800 to-slate-700',
  staff: 'from-orange-900 to-orange-800',
};

const roleLabel: Record<string, string> = {
  lurah: 'Kelurahan',
  superadmin: '⚙️ Superadmin',
  rw: 'Wilayah RW',
  rt: 'Wilayah RT',
  warga: '👤 Warga',
};

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  
  // Resolve role: prioritaskan effective_role untuk staff agar mendapat menu admin
  const roleToUse = user?.effective_role || user?.role || 'warga';
  
  // Tentukan menu berdasarkan role aktif
  const menu = menuByRole[roleToUse as keyof typeof menuByRole] || menuByRole.warga;
  const gradient = roleColors[roleToUse] || roleColors['warga'];

  const isActive = (href: string) => {
    if (pathname === href) return true;
    const hrefParts = href.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathname === href) return true;
    if (hrefParts.length === 2) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          main {
            padding-top: 5rem !important;
            padding-left: 1.5rem !important;
            padding-right: 1.5rem !important;
          }
        }
      `}} />

      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-5 left-5 z-[9999] bg-indigo-600/90 backdrop-blur border border-white/20 p-2.5 rounded-xl text-white shadow-xl flex items-center justify-center transition-all hover:bg-indigo-500"
        aria-label="Toggle Menu"
      >
        <span className="text-xl leading-none">{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[9990]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-[9995]
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300
        w-64 min-h-screen bg-gradient-to-b ${gradient} flex flex-col shadow-2xl flex-shrink-0
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/10 mt-12 lg:mt-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {user.nama.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate">{user.nama}</p>
              <p className="text-white/60 text-xs truncate">{user.jabatan || roleLabel[user.role] || user.role}</p>
            </div>
          </div>
          {(user.rt || user.rw) && (
            <div className="bg-white/10 rounded-lg px-3 py-2 text-xs text-white/80">
              {user.rt && <span>RT {user.rt}</span>}
              {user.rt && user.rw && <span> / </span>}
              {user.rw && <span>RW {user.rw}</span>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-3 px-3">Menu</p>
          {menu.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Branding + Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="text-center px-2">
            <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase mb-1">
              KICAU v{packageJson.version} — dibuat oleh Impuls
            </p>
            <a 
              href="mailto:alfaridzi.rifqi28@gmail.com" 
              className="text-white/20 text-[9px] hover:text-white/40 transition-colors truncate block"
            >
              alfaridzi.rifqi28@gmail.com
            </a>
          </div>
          <button
            onClick={onLogout}
            className="w-full bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>🚪</span> Keluar
          </button>
        </div>
      </aside>
    </>
  );
}
