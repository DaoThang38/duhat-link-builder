'use client';

import React, { useState, useEffect } from 'react';
import { LinkRecord } from '@/types';
import SyncStatusBadge from './SyncStatusBadge';
import { Search, Copy, Check, Filter, ExternalLink, RefreshCw } from 'lucide-react';

export default function HistoryTable() {
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/links');
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links || []);
      }
    } catch (err) {
      console.error('Failed to load link history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      link.finalLink.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.createdByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (link.utmCampaign && link.utmCampaign.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (link.mediaSource && link.mediaSource.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'ALL' || link.linkType === selectedType;

    return matchesSearch && matchesType;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="duhat-card space-y-6">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#deded7] pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#20201c] tracking-tight m-0">Lịch sử Team</h2>
        </div>

        <button
          onClick={fetchLinks}
          title="Tải lại danh sách"
          className="btn secondary text-xs min-h-[38px] px-3.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Tải lại</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71716a]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo link, người tạo, chiến dịch..."
            className="w-full pl-10 pr-4 h-[44px] bg-white border border-[#deded7] rounded-[12px] text-xs text-[#20201c] placeholder-[#71716a] focus:outline-none focus:border-[#20201c]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-[#71716a] flex-shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 h-[44px] bg-white border border-[#deded7] rounded-[12px] text-xs text-[#20201c] focus:outline-none focus:border-[#20201c]"
          >
            <option value="ALL">Tất cả loại link</option>
            <option value="UTM">Google UTM</option>
            <option value="ONELINK">AppsFlyer OneLink</option>
          </select>
        </div>
      </div>

      {/* History Table matching Design System */}
      <div className="overflow-hidden border border-[#deded7] rounded-[18px] bg-white">
        <div className="hidden md:grid grid-cols-[100px_140px_1fr_1.5fr_130px_120px] gap-4 items-center p-4 bg-[#20201c] text-white text-[11px] font-extrabold uppercase tracking-wider">
          <span>Loại</span>
          <span>Người tạo</span>
          <span>Chiến dịch</span>
          <span>Link cuối</span>
          <span>Trạng thái</span>
          <span className="text-right">Thao tác</span>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-[#71716a]">
            <span className="inline-block w-6 h-6 border-2 border-[#20201c] border-t-transparent rounded-full animate-spin"></span>
            <span className="block mt-2 text-xs font-bold">Đang tải lịch sử...</span>
          </div>
        ) : filteredLinks.length === 0 ? (
          <div className="text-center py-10 text-[#71716a] text-xs">
            Chưa có bản ghi link nào.
          </div>
        ) : (
          filteredLinks.map((item) => (
            <div
              key={item.id}
              className="flex flex-col md:grid md:grid-cols-[100px_140px_1fr_1.5fr_130px_120px] gap-2 md:gap-4 items-start md:items-center p-4 border-b border-[#deded7] last:border-0 text-xs hover:bg-[#f9f9f6] transition-colors"
            >
              <div>
                <span className="inline-flex px-2.5 py-1 bg-[#fff3bd] text-[#20201c] rounded-full text-[10px] font-black uppercase">
                  {item.linkType}
                </span>
              </div>

              <div>
                <strong className="block font-bold text-[#20201c]">{item.createdByName}</strong>
                <span className="text-[10px] text-[#71716a]">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>

              <div>
                <strong className="font-bold text-[#20201c]">
                  {item.utmCampaign || item.afAdset || item.mediaSource || '-'}
                </strong>
                <span className="block text-[10px] text-[#71716a]">
                  {item.utmSource || item.mediaSource || '-'} / {item.utmMedium || item.afChannel || '-'}
                </span>
              </div>

              <div className="w-full overflow-hidden">
                <code className="block font-mono text-[11px] text-[#71716a] truncate max-w-full" title={item.finalLink}>
                  {item.finalLink}
                </code>
              </div>

              <div>
                <SyncStatusBadge
                  linkId={item.id}
                  status={item.syncStatus}
                  syncAttempts={item.syncAttempts}
                  lastError={item.lastSyncError}
                  onSyncComplete={fetchLinks}
                />
              </div>

              <div className="flex items-center justify-start md:justify-end gap-1.5 w-full">
                <button
                  onClick={() => handleCopy(item.finalLink, item.id)}
                  className="btn yellow text-[11px] min-h-[32px] px-3"
                >
                  {copiedId === item.id ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Đã copy</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <a
                  href={item.finalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn secondary text-[11px] min-h-[32px] px-2.5"
                  title="Mở link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
