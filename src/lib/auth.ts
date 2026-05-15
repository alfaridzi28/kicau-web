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
}

export function useAuth() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
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
  }, [router]);

  const logout = () => {
    localStorage.clear();
    router.push('/');
  };

  return { user, token, logout };
}

export async function apiFetch(endpoint: string, token: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error tidak diketahui' }));
    throw new Error(err.detail || 'Request gagal');
  }
  return res.json();
}
