'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import Navbar from '@/components/Navbar';
import { Search, ShieldCheck, User as UserIcon, Users, RefreshCw, Calendar, Mail } from 'lucide-react';

export default function UsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          setCurrentUser(meData.user);

          if (meData.user?.role === 'ADMIN') {
            const usersRes = await fetch('/api/users');
            if (usersRes.ok) {
              const usersData = await usersRes.json();
              setUsers(usersData.users || []);
            } else {
              const errData = await usersRes.json();
              setErrorMessage(errData.error || 'Không thể tải danh sách thành viên.');
            }
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Lỗi mạng.');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const memberCount = users.filter((u) => u.role === 'MEMBER').length;

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-[#20201c] font-sans antialiased">
      <Navbar user={currentUser} />

      <main className="max-w-[1220px] mx-auto px-5 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#deded7] pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-[#20201c]" />
              <h1 className="text-2xl font-extrabold tracking-tight m-0 text-[#20201c]">Quản lý Thành viên Team</h1>
            </div>
            <p className="text-xs text-[#71716a] m-0 pt-1">Danh sách tất cả thành viên đã đăng ký tài khoản trong hệ thống (Quyền Admin)</p>
          </div>

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={fetchUsers}
              className="btn secondary text-xs min-h-[38px] px-3.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>
          )}
        </div>

        {/* Access Denied Banner if not ADMIN */}
        {!isLoading && currentUser && currentUser.role !== 'ADMIN' && (
          <div className="p-6 bg-white border border-[#deded7] rounded-[18px] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#fff0ed] text-[#b42318] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold m-0 text-[#20201c]">Quyền truy cập bị hạn chế</h3>
            <p className="text-xs text-[#71716a] max-w-md mx-auto">
              Tính năng xem danh sách tất cả thành viên chỉ dành cho tài khoản có quyền **ADMIN**. Tài khoản của bạn hiện là **MEMBER**.
            </p>
          </div>
        )}

        {currentUser?.role === 'ADMIN' && (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="duhat-card p-4 flex items-center space-x-3 bg-white">
                <div className="w-10 h-10 rounded-full bg-[#fff3bd] text-[#20201c] flex items-center justify-center font-extrabold text-sm">
                  {users.length}
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase text-[#71716a]">Tổng thành viên</span>
                  <p className="text-sm font-extrabold m-0 text-[#20201c]">{users.length} người dùng</p>
                </div>
              </div>

              <div className="duhat-card p-4 flex items-center space-x-3 bg-white">
                <div className="w-10 h-10 rounded-full bg-[#fff9df] text-[#8a6200] flex items-center justify-center font-extrabold text-sm">
                  {adminCount}
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase text-[#71716a]">Tài khoản Admin</span>
                  <p className="text-sm font-extrabold m-0 text-[#20201c]">{adminCount} Quản trị viên</p>
                </div>
              </div>

              <div className="duhat-card p-4 flex items-center space-x-3 bg-white">
                <div className="w-10 h-10 rounded-full bg-[#eaf8ef] text-[#176b46] flex items-center justify-center font-extrabold text-sm">
                  {memberCount}
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase text-[#71716a]">Thành viên Member</span>
                  <p className="text-sm font-extrabold m-0 text-[#20201c]">{memberCount} Nhân viên</p>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71716a]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm thành viên theo tên, email..."
                className="w-full pl-10 pr-4 h-[44px] bg-white border border-[#deded7] rounded-[12px] text-xs text-[#20201c] placeholder-[#71716a] focus:outline-none focus:border-[#20201c]"
              />
            </div>

            {/* Members Table */}
            <div className="overflow-hidden border border-[#deded7] rounded-[18px] bg-white">
              <div className="hidden md:grid grid-cols-[60px_1fr_1.5fr_140px_150px] gap-4 items-center p-4 bg-[#20201c] text-white text-[11px] font-extrabold uppercase tracking-wider">
                <span>STT</span>
                <span>Họ và Tên</span>
                <span>Email</span>
                <span>Vai trò</span>
                <span>Ngày tham gia</span>
              </div>

              {isLoading ? (
                <div className="text-center py-10 text-[#71716a]">
                  <span className="inline-block w-6 h-6 border-2 border-[#20201c] border-t-transparent rounded-full animate-spin"></span>
                  <span className="block mt-2 text-xs font-bold">Đang tải danh sách thành viên...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-10 text-[#71716a] text-xs">
                  Không tìm thấy thành viên nào.
                </div>
              ) : (
                filteredUsers.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="flex flex-col md:grid md:grid-cols-[60px_1fr_1.5fr_140px_150px] gap-2 md:gap-4 items-start md:items-center p-4 border-b border-[#deded7] last:border-0 text-xs hover:bg-[#f9f9f6] transition-colors"
                  >
                    <div className="text-[#71716a] font-bold">#{index + 1}</div>

                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-full bg-[#fff3bd] text-[#20201c] font-black text-xs flex items-center justify-center flex-shrink-0">
                        {item.fullName ? item.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <strong className="font-bold text-[#20201c]">{item.fullName}</strong>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[#71716a] font-mono text-[11px]">
                      <Mail className="w-3.5 h-3.5 flex-shrink-0 text-[#a1a19a]" />
                      <span>{item.email}</span>
                    </div>

                    <div>
                      {item.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#fff3bd] text-[#8a6200] rounded-full text-[10px] font-black uppercase">
                          <ShieldCheck className="w-3 h-3" />
                          ADMIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#eaf8ef] text-[#176b46] rounded-full text-[10px] font-black uppercase">
                          <UserIcon className="w-3 h-3" />
                          MEMBER
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-[#71716a] flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-[#a1a19a]" />
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Đã đăng ký'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
