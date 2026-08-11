'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { User } from '@/types';
import { UserProvider } from '@/context/UserContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push('/login');
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9f6] flex items-center justify-center text-[#71716a]">
        <div className="text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#20201c] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-extrabold text-[#20201c]">Đang xác thực phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <UserProvider user={user}>
      <div className="min-h-screen bg-[#f9f9f6] text-[#20201c] flex flex-col font-sans">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <main className="flex-1 max-w-[1220px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {children}
        </main>
        <footer className="border-t border-[#deded7] py-6 text-center text-xs text-[#71716a] bg-[#f9f9f6]">
          © 2026 Duhat Growth &amp; Marketing Team. Managed &amp; Centralized Link Building System.
        </footer>
      </div>
    </UserProvider>
  );
}
