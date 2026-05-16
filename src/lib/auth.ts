'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// API base URL
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UserInfo {
  id: string;
  nama: string;
  nik: string;
  role: string;
  effective_role?: string;
  rt?: string;
  rw?: string;
  jabatan?: string;
  tanda_tangan?: string;
  kecamatan?: string;
  desa_kelurahan?: string;
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const tokenData = localStorage.getItem('token');
    if (userData && tokenData) {
      setUser(JSON.parse(userData));
      setToken(tokenData);
    } else {
      router.push('/');
    }
    setIsLoading(false);
  }, [router]);

  const logout = () => {
    localStorage.clear();
    router.push('/');
  };

  return { user, token, logout, isLoading };
}

export async function apiFetch(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error tidak diketahui' }));
    throw new Error(err.detail || 'Request gagal');
  }
  return res.json();
}
