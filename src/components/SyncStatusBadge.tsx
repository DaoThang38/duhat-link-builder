'use client';

import React, { useState } from 'react';
import { SyncStatus } from '@/types';
import { RefreshCw } from 'lucide-react';

interface SyncStatusBadgeProps {
  linkId: string;
  status: SyncStatus;
  syncAttempts?: number;
  lastError?: string;
  onSyncComplete?: () => void;
}

export default function SyncStatusBadge({
  linkId,
  status,
  syncAttempts = 0,
  lastError,
  onSyncComplete,
}: SyncStatusBadgeProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<SyncStatus>(status);
  const [errorMsg, setErrorMsg] = useState<string | undefined>(lastError);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const res = await fetch('/api/links/retry-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentStatus('SUCCESS');
        setErrorMsg(undefined);
        if (onSyncComplete) onSyncComplete();
      } else {
        setCurrentStatus('FAILED');
        setErrorMsg(data.error || 'Lỗi kết nối Webhook');
      }
    } catch (err: any) {
      setCurrentStatus('FAILED');
      setErrorMsg(err.message);
    } finally {
      setIsRetrying(false);
    }
  };

  if (currentStatus === 'SUCCESS') {
    return (
      <span className="duhat-badge synced">
        Đã đồng bộ
      </span>
    );
  }

  if (currentStatus === 'PENDING') {
    return (
      <span className="duhat-badge pending">
        Đang chờ
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span title={errorMsg || 'Lỗi gửi dữ liệu SharePoint'} className="duhat-badge failed">
        Lỗi đồng bộ ({syncAttempts})
      </span>
      <button
        onClick={handleRetry}
        disabled={isRetrying}
        title="Thử lại đồng bộ SharePoint"
        className="p-1 text-[#71716a] hover:text-[#20201c] hover:bg-[#fff3bd] rounded-full transition-colors disabled:opacity-40"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-[#8a6200]' : ''}`} />
      </button>
    </div>
  );
}
