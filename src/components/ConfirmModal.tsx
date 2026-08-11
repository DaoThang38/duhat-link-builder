'use client';

import React from 'react';
import { LinkType } from '@/types';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  linkType: LinkType;
  originalUrl: string;
  source: string;
  medium: string;
  campaign: string;
  previewLink: string;
  creatorName: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  linkType,
  originalUrl,
  source,
  medium,
  campaign,
  previewLink,
  creatorName,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20201c]/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-[#deded7] rounded-[24px] max-w-[580px] w-full p-7 shadow-[0_28px_90px_rgba(0,0,0,0.24)] space-y-4 text-[#20201c]">
        {/* Kicker & Title */}
        <div className="flex items-start justify-between">
          <div>
            <p className="m-0 text-[#8a6200] text-[11px] font-black tracking-[0.12em] uppercase">
              BƯỚC XÁC NHẬN CUỐI
            </p>
            <h3 className="m-0 mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-[-0.035em]">
              Kiểm tra trước khi tạo link
            </h3>
            <p className="m-0 mt-1 text-xs text-[#71716a]">
              Hệ thống sẽ chuẩn hóa URL và kiểm tra trùng SHA-256 trong PostgreSQL trước khi lưu.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#71716a] hover:text-[#20201c] p-1.5 rounded-full hover:bg-[#f9f9f6] transition-colors border-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Box */}
        <div className="my-5 border border-[#deded7] rounded-[14px] overflow-hidden bg-white">
          <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
            <b className="text-[#71716a] font-medium">Loại link:</b>
            <strong className="text-[#20201c] font-bold">
              {linkType === 'UTM' ? 'Google UTM' : 'AppsFlyer OneLink'}
            </strong>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
            <b className="text-[#71716a] font-medium">URL Đích:</b>
            <strong className="text-[#20201c] font-mono break-all">{originalUrl}</strong>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
            <b className="text-[#71716a] font-medium">Nguồn / Kênh:</b>
            <strong className="text-[#20201c]">
              {source} <span className="text-[#71716a]">/</span> {medium || 'Mặc định'}
            </strong>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
            <b className="text-[#71716a] font-medium">Tên chiến dịch:</b>
            <strong className="text-[#20201c]">{campaign}</strong>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
            <b className="text-[#71716a] font-medium">Người tạo:</b>
            <strong className="text-[#8a6200]">{creatorName}</strong>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 text-xs bg-[#f9f9f6]">
            <b className="text-[#71716a] font-medium">Link dự kiến:</b>
            <span className="font-mono text-[11px] text-[#20201c] break-all select-all">{previewLink}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn secondary"
          >
            Quay lại chỉnh sửa
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="btn primary"
          >
            {isLoading ? (
              <span>Đang xử lý...</span>
            ) : (
              <>
                <span>Xác nhận &amp; tạo link</span>
                <span className="arrow">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
