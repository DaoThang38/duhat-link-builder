'use client';

import React, { useState, useEffect } from 'react';
import { LinkRecord, RequestStatus } from '@/types';
import { X, CheckCircle, ExternalLink, AlertCircle, Link as LinkIcon, Info } from 'lucide-react';

interface UpdateOneLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: LinkRecord | null;
  onSuccess: () => void;
}

export default function UpdateOneLinkModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: UpdateOneLinkModalProps) {
  const [finalLink, setFinalLink] = useState('');
  const [status, setStatus] = useState<RequestStatus>('COMPLETED');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (record) {
      setFinalLink(record.finalLink || '');
      setStatus(record.status || 'COMPLETED');
      setErrorMessage('');
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (status === 'COMPLETED' && !finalLink.trim()) {
      setErrorMessage('Vui lòng nhập OneLink AppsFlyer hoàn chỉnh sau khi tạo trên AppsFlyer Dashboard.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(`/api/links/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finalLink: finalLink.trim(),
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Cập nhật link thất bại.');
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi mạng khi cập nhật.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[24px] shadow-2xl border border-[#deded7] max-w-xl w-full p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-[#71716a] hover:text-[#20201c] hover:bg-[#f5f5f0] rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="duhat-badge yellow text-[10px]">ADMIN / SPECIALIST</span>
            <h3 className="text-lg font-black text-[#20201c] m-0">Cập nhật OneLink AppsFlyer</h3>
          </div>
          <p className="text-xs text-[#71716a] m-0">
            Nhập OneLink thực tế sau khi đã tạo &amp; kiểm thử trên AppsFlyer Dashboard.
          </p>
        </div>

        {/* Request Details Summary Card */}
        <div className="p-4 bg-[#f8f8f6] rounded-[16px] border border-[#e5e5e0] space-y-2 text-xs">
          <div className="font-extrabold text-[#20201c] flex items-center gap-1.5 border-b border-[#deded7] pb-2">
            <Info className="w-4 h-4 text-[#8a6200]" />
            <span>Chi tiết yêu cầu #{record.id.slice(0, 8)}</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[#20201c]">
            <div><span className="text-[#71716a]">Người yêu cầu:</span> <strong>{record.createdByName}</strong></div>
            <div><span className="text-[#71716a]">Thời gian gửi:</span> {new Date(record.createdAt).toLocaleString('vi-VN')}</div>
            <div><span className="text-[#71716a]">Nguồn (pid):</span> <strong>{record.mediaSource || '-'}</strong></div>
            <div><span className="text-[#71716a]">Hình thức (af_channel):</span> <strong>{record.afChannel || '-'}</strong></div>
            <div><span className="text-[#71716a]">Chiến dịch (c):</span> <strong>{record.utmCampaign || record.afCId || '-'}</strong></div>
            <div><span className="text-[#71716a]">Đích đến App:</span> <strong>{record.deepLinkValue || '-'}</strong></div>
            
            {record.targetUser && (
              <div>
                <span className="text-[#71716a]">Đối tượng:</span>{' '}
                <strong>
                  {record.targetUser === 'NEW_USER' ? 'Khách mới' : record.targetUser === 'EXISTING_USER' ? 'Người đã cài App' : 'Cả hai'}
                </strong>
              </div>
            )}

            {record.desiredSlug && (
              <div><span className="text-[#71716a]">Slug mong muốn:</span> <code className="bg-[#ebd217]/20 px-1 py-0.5 rounded font-mono">{record.desiredSlug}</code></div>
            )}
          </div>

          {record.note && (
            <div className="pt-1.5 border-t border-[#deded7] text-[#71716a]">
              <span>Ghi chú yêu cầu: </span><span className="italic text-[#20201c]">{record.note}</span>
            </div>
          )}

          {record.socialPreview?.enabled && (
            <div className="p-2.5 bg-white rounded-[10px] border border-[#deded7] space-y-1 text-[11px]">
              <div className="font-bold text-[#8a6200]">Yêu cầu Social Preview:</div>
              {record.socialPreview.title && <div><span className="text-[#71716a]">Tiêu đề:</span> {record.socialPreview.title}</div>}
              {record.socialPreview.description && <div><span className="text-[#71716a]">Mô tả:</span> {record.socialPreview.description}</div>}
              {record.socialPreview.imageUrl && <div><span className="text-[#71716a]">Link Ảnh:</span> {record.socialPreview.imageUrl}</div>}
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-[#fff0ed] border border-[#deded7] rounded-[12px] text-[#b42318] text-xs font-bold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-[#20201c]">
              Trạng thái xử lý <span className="text-[#b42318]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('COMPLETED')}
                className={`px-3 py-2 text-xs font-extrabold rounded-[10px] border transition-all ${
                  status === 'COMPLETED'
                    ? 'bg-[#176b46] text-white border-[#176b46]'
                    : 'bg-white text-[#20201c] border-[#deded7] hover:bg-[#f5f5f0]'
                }`}
              >
                Đã tạo link
              </button>
              <button
                type="button"
                onClick={() => setStatus('IN_PROGRESS')}
                className={`px-3 py-2 text-xs font-extrabold rounded-[10px] border transition-all ${
                  status === 'IN_PROGRESS'
                    ? 'bg-[#0066cc] text-white border-[#0066cc]'
                    : 'bg-white text-[#20201c] border-[#deded7] hover:bg-[#f5f5f0]'
                }`}
              >
                Đang xử lý
              </button>
              <button
                type="button"
                onClick={() => setStatus('REJECTED')}
                className={`px-3 py-2 text-xs font-extrabold rounded-[10px] border transition-all ${
                  status === 'REJECTED'
                    ? 'bg-[#b42318] text-white border-[#b42318]'
                    : 'bg-white text-[#20201c] border-[#deded7] hover:bg-[#f5f5f0]'
                }`}
              >
                Cần bổ sung / Hủy
              </button>
            </div>
          </div>

          {status === 'COMPLETED' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-[#20201c]">
                OneLink Hoàn Chỉnh (AppsFlyer URL) <span className="text-[#b42318]">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={finalLink}
                  onChange={(e) => setFinalLink(e.target.value)}
                  placeholder="https://duhat.onelink.me/abc1/x7ab29"
                  required={status === 'COMPLETED'}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#deded7] rounded-[12px] text-xs font-mono text-[#20201c] focus:outline-none focus:border-[#20201c] focus:ring-1 focus:ring-[#20201c]"
                />
              </div>
              <p className="text-[11px] text-[#71716a] m-0">
                Link thực tế được tạo và kiểm tra trực tiếp trên AppsFlyer Dashboard.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#deded7]">
            <button
              type="button"
              onClick={onClose}
              className="btn secondary text-xs min-h-[40px] px-4"
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn primary text-xs min-h-[40px] px-5"
            >
              {isLoading ? (
                <span>Đang cập nhật...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Lưu &amp; Hoàn thành</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
