'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@/types';
import { LogOut, User as UserIcon, ShieldCheck, Edit3, Users } from 'lucide-react';
import EditProfileModal from './EditProfileModal';

interface NavbarProps {
  user: User | null;
  onLogout?: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);

  useEffect(() => {
    async function loadMembers() {
      if (user?.role === 'ADMIN') {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const data = await res.json();
            setTeamMembers(data.users || []);
          }
        } catch (e) {
          console.error('Failed to load team members:', e);
        }
      }
    }
    loadMembers();
  }, [user?.role]);

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
    <>
      <header className="sticky top-0 z-40 bg-[#ffcc00] border-b border-[#20201c]/15 shadow-sm text-[#20201c] font-sans">
        <div className="max-w-[1220px] mx-auto px-5 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Left: Official Duhat Logo & Branding */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group text-[#20201c] no-underline">
            <img src="https://duhat.vn/icon.svg" alt="Duhat Icon" className="h-8 w-auto object-contain" />
            <img src="https://duhat.vn/logo.svg" alt="Duhat Logo" className="h-5 w-auto object-contain" />
            <span className="w-[1px] h-5 bg-[#20201c]/30 mx-1"></span>
            <span className="font-black text-sm tracking-tight uppercase">Link Builder</span>
          </Link>

          {/* Center: Compact 3-Tab Pill Navigation */}
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

          {/* Right: User Profile, Member Selector & Actions */}
          <div className="flex items-center gap-2">
            {/* Clickable Profile Badge for Changing Name */}
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              title="Nhấp để đổi tên hiển thị"
              className="flex items-center gap-1.5 bg-white hover:bg-[#fff9df] px-3 py-1.5 rounded-full border border-[#20201c]/20 text-xs font-extrabold text-[#20201c] cursor-pointer transition-all shadow-xs group"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#20201c]" />
              <span>{user.fullName}</span>
              {user.role === 'ADMIN' && (
                <span title="Tài khoản Admin">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8a6200]" />
                </span>
              )}
              <Edit3 className="w-3 h-3 text-[#71716a] group-hover:text-[#20201c] transition-colors ml-0.5" />
            </button>

            {/* Admin Member List Dropdown right next to Profile Badge */}
            {user.role === 'ADMIN' && (
              <div className="relative">
                <select
                  aria-label="Danh sách tất cả thành viên trong team"
                  className="bg-white/95 hover:bg-white border border-[#20201c]/20 text-[#20201c] text-xs font-extrabold rounded-full px-3 py-1.5 focus:outline-none focus:border-[#20201c] cursor-pointer shadow-xs transition-colors"
                  onChange={(e) => {
                    if (e.target.value) {
                      const selected = teamMembers.find((m) => m.email === e.target.value);
                      if (selected) {
                        alert(`Thành viên: ${selected.fullName}\nEmail: ${selected.email}\nVai trò: ${selected.role}`);
                      }
                    }
                  }}
                >
                  <option value="">👥 Thành viên ({teamMembers.length || 1})</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.email}>
                      {m.fullName} ({m.email}) [{m.role}]
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="px-3 py-1.5 bg-[#20201c] text-white hover:bg-black rounded-full text-xs font-black transition-all flex items-center gap-1 cursor-pointer border-0 shadow-sm ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>
      </header>

      {/* Edit Profile Name Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
      />
    </>
  );
}
