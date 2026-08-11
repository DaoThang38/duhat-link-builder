'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { X, Check, User as UserIcon, AlertCircle } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onProfileUpdated?: (updatedUser: User) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Cập nhật tên thất bại.');
      } else {
        setSuccessMessage('Đã cập nhật tên thành công!');
        if (onProfileUpdated) onProfileUpdated(data.user);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối mạng.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[24px] border border-[#deded7] shadow-[0_24px_48px_rgba(32,32,28,0.24)] w-full max-w-md overflow-hidden text-[#20201c]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#deded7] bg-[#f9f9f6]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#fff3bd] flex items-center justify-center text-[#8a6200]">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold m-0 text-[#20201c]">Đổi tên hiển thị</h3>
              <p className="text-[11px] text-[#71716a] m-0">Tên này sẽ hiển thị trên tất cả link bạn tạo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#deded7]/50 border-0 bg-transparent cursor-pointer flex items-center justify-center text-[#71716a]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-[#fff0ed] border border-[#fecdca] rounded-[12px] text-[#b42318] text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-[#eaf8ef] border border-[#176b46]/30 rounded-[12px] text-[#176b46] text-xs font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="duhat-field">
            <label className="text-xs font-bold text-[#71716a]">Email đăng nhập (Cố định)</label>
            <input
              type="text"
              disabled
              value={user.email}
              className="bg-[#f0f0eb] text-[#71716a] cursor-not-allowed font-mono text-xs"
            />
          </div>

          <div className="duhat-field">
            <label className="text-xs font-bold text-[#20201c]">
              Họ và Tên mới <span className="req">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên hiển thị..."
              className="text-xs font-extrabold text-[#20201c]"
            />
            <p className="duhat-help">Nhập tên đầy đủ (ví dụ: Đào Tất Thắng, Nguyễn Văn A...)</p>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#deded7]">
            <button
              type="button"
              onClick={onClose}
              className="btn secondary text-xs min-h-[38px] px-4"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn yellow text-xs min-h-[38px] px-5"
            >
              {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
