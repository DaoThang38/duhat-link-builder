'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Đăng ký thất bại.');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError('Lỗi mạng khi đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f6] flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[960px] grid grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[28px] bg-white border border-[#deded7] shadow-[0_18px_55px_rgba(32,32,28,0.10)] min-h-[480px]">
        {/* Left Side: Brand Yellow Hero */}
        <div className="flex flex-col justify-between p-8 sm:p-12 bg-gradient-to-br from-[#ffcc00] to-[#ffe27a] text-[#20201c]">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <img src="https://duhat.vn/icon.svg" alt="Duhat Icon" className="h-9 w-auto object-contain" />
              <img src="https://duhat.vn/logo.svg" alt="Duhat Logo" className="h-6 w-auto object-contain" />
              <span className="w-[1px] h-5 bg-[#20201c]/30 mx-1"></span>
              <span className="font-extrabold text-sm">Link Builder</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.055em] leading-[0.98]">
              Tạo link đúng.<br />Dùng chung một chuẩn.
            </h2>
          </div>
          <p className="m-0 text-xs font-semibold text-[#45453f] pt-6 border-t border-[#20201c]/15">
            Đăng ký tham gia hệ thống quản lý link tập trung cho toàn bộ đội ngũ Duhat.
          </p>
        </div>

        {/* Right Side: Auth Form */}
        <div className="flex items-center justify-center p-8 sm:p-12 bg-white">
          <div className="w-full max-w-[350px] space-y-5">
            <div>
              <span className="text-[11px] font-black tracking-[0.12em] uppercase text-[#8a6200] block mb-1">
                DÀNH CHO THÀNH VIÊN MỚI
              </span>
              <h3 className="text-3xl font-extrabold text-[#20201c] tracking-tight m-0">Tạo tài khoản</h3>
            </div>

            {error && (
              <div className="p-3.5 bg-[#fff0ed] border border-[#deded7] rounded-[12px] text-[#b42318] text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="duhat-field">
                <label>Họ và Tên</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div className="duhat-field">
                <label>Email làm việc</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ten@duhat.vn"
                />
              </div>

              <div className="duhat-field">
                <label>Mật khẩu</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </div>

              <button type="submit" disabled={loading} className="btn primary w-full mt-2">
                {loading ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <span>Hoàn tất Đăng ký</span>
                    <span className="arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-xs text-[#71716a] pt-4 border-t border-[#deded7]">
              Đã có tài khoản?{' '}
              <Link href="/login" className="font-extrabold text-[#20201c] hover:underline">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
