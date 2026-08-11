'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/types';
import { LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout?: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      if (onLogout) onLogout();
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (!user) return null;

  const navItems = [
    { name: 'Tạo Link', href: '/dashboard' },
    { name: 'Lịch sử Team', href: '/dashboard/history' },
    { name: 'Danh mục chuẩn', href: '/dashboard/catalog' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#ffcc00] border-b border-[#20201c]/15 shadow-sm text-[#20201c] font-sans">
      <div className="max-w-[1220px] mx-auto px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Official Duhat Logo & Branding */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group text-[#20201c] no-underline">
          <img src="https://duhat.vn/icon.svg" alt="Duhat Icon" className="h-8 w-auto object-contain" />
          <img src="https://duhat.vn/logo.svg" alt="Duhat Logo" className="h-5 w-auto object-contain" />
          <span className="w-[1px] h-5 bg-[#20201c]/30 mx-1"></span>
          <span className="font-black text-sm tracking-tight uppercase">Link Builder</span>
        </Link>

        {/* Center: Compact Pill Navigation */}
        <nav className="flex items-center gap-1.5 bg-[#20201c]/10 p-1 rounded-full border border-[#20201c]/10">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap no-underline ${
                  isActive
                    ? 'bg-[#20201c] text-white shadow-md'
                    : 'text-[#20201c] hover:bg-white/60'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white/75 px-3 py-1 rounded-full border border-[#20201c]/15 text-xs font-extrabold text-[#20201c]">
            <UserIcon className="w-3.5 h-3.5" />
            <span>{user.fullName}</span>
            {user.role === 'ADMIN' && <ShieldCheck className="w-3.5 h-3.5 text-[#8a6200]" />}
          </div>

          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="px-3 py-1.5 bg-[#20201c] text-white hover:bg-black rounded-full text-xs font-black transition-all flex items-center gap-1 cursor-pointer border-0 shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thoát</span>
          </button>
        </div>
      </div>
    </header>
  );
}
