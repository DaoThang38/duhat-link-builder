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
  previewLink?: string;
  creatorName: string;
  targetUserLabel?: string;
  deepLinkScreenLabel?: string;
  campaignId?: string;
  adGroup?: string;
  adName?: string;
  desiredSlug?: string;
  note?: string;
  socialPreview?: {
    enabled: boolean;
    title?: string;
    description?: string;
    imageUrl?: string;
  };
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
  targetUserLabel,
  deepLinkScreenLabel,
  campaignId,
  adGroup,
  adName,
  desiredSlug,
  note,
  socialPreview,
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
              {linkType === 'UTM' ? 'Kiểm tra trước khi tạo link' : 'Xác nhận gửi yêu cầu OneLink'}
            </h3>
            <p className="m-0 mt-1 text-xs text-[#71716a]">
              {linkType === 'UTM'
                ? 'Hệ thống sẽ chuẩn hóa URL và kiểm tra trùng SHA-256 trước khi lưu.'
                : 'Yêu cầu sẽ được lưu vào hệ thống để người phụ trách khởi tạo trên AppsFlyer Dashboard.'}
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
        <div className="my-5 border border-[#deded7] rounded-[14px] overflow-hidden bg-white max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
            <b className="text-[#71716a] font-medium">Loại thao tác:</b>
            <strong className="text-[#20201c] font-bold">
              {linkType === 'UTM' ? 'Tạo Google UTM' : 'Yêu cầu AppsFlyer OneLink'}
            </strong>
          </div>

          <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
            <b className="text-[#71716a] font-medium">{linkType === 'UTM' ? 'URL Đích:' : 'Template:'}</b>
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

          {linkType === 'ONELINK' && (
            <>
              {campaignId && (
                <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
                  <b className="text-[#71716a] font-medium">Mã quản lý:</b>
                  <strong className="text-[#20201c]">{campaignId}</strong>
                </div>
              )}
              {adGroup && (
                <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
                  <b className="text-[#71716a] font-medium">Nhóm QC (Ad Set):</b>
                  <strong className="text-[#20201c]">{adGroup}</strong>
                </div>
              )}
              {adName && (
                <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
                  <b className="text-[#71716a] font-medium">Mẫu QC (Ad):</b>
                  <strong className="text-[#20201c]">{adName}</strong>
                </div>
              )}
              {targetUserLabel && (
                <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
                  <b className="text-[#71716a] font-medium">Khách hàng:</b>
                  <strong className="text-[#20201c]">{targetUserLabel}</strong>
                </div>
              )}
              {deepLinkScreenLabel && (
                <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
                  <b className="text-[#71716a] font-medium">Đích đến App:</b>
                  <strong className="text-[#20201c]">{deepLinkScreenLabel}</strong>
                </div>
              )}
              {desiredSlug && (
                <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
                  <b className="text-[#71716a] font-medium">Đuôi mong muốn:</b>
                  <code className="bg-[#ebd217]/20 px-1 py-0.5 rounded font-mono text-[#20201c]">{desiredSlug}</code>
                </div>
              )}
              {note && (
                <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
                  <b className="text-[#71716a] font-medium">Ghi chú:</b>
                  <span className="italic text-[#20201c]">{note}</span>
                </div>
              )}
              {socialPreview && (
                <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
                  <b className="text-[#71716a] font-medium">Social Preview:</b>
                  <div className="space-y-1">
                    <span className="font-bold text-[#8a6200]">
                      {socialPreview.enabled ? 'Có yêu cầu riêng' : 'Mặc định'}
                    </span>
                    {socialPreview.enabled && (
                      <div className="text-[11px] text-[#71716a] space-y-0.5 pt-1">
                        {socialPreview.title && <div>Tiêu đề: <span className="text-[#20201c] font-medium">{socialPreview.title}</span></div>}
                        {socialPreview.description && <div>Mô tả: <span className="text-[#20201c] font-medium">{socialPreview.description}</span></div>}
                        {socialPreview.imageUrl && <div>Ảnh: <span className="text-[#20201c] font-mono break-all">{socialPreview.imageUrl}</span></div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 border-b border-[#deded7] text-xs">
            <b className="text-[#71716a] font-medium">Người gửi:</b>
            <strong className="text-[#8a6200]">{creatorName}</strong>
          </div>

          {linkType === 'UTM' ? (
            <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 text-xs bg-[#f9f9f6]">
              <b className="text-[#71716a] font-medium">Link dự kiến:</b>
              <span className="font-mono text-[11px] text-[#20201c] break-all select-all">{previewLink}</span>
            </div>
          ) : (
            <div className="grid grid-cols-[130px_1fr] gap-2.5 p-3 text-xs bg-[#fffcf2]">
              <b className="text-[#8a6200] font-bold">Trạng thái sau gửi:</b>
              <span className="font-bold text-[#8a6200]">Mới tạo (Chờ người phụ trách xử lý trên AppsFlyer)</span>
            </div>
          )}
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
                <span>{linkType === 'UTM' ? 'Xác nhận & tạo link' : 'Xác nhận & Gửi yêu cầu'}</span>
                <span className="arrow">→</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

