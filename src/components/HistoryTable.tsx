'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LinkRecord } from '@/types';
import SyncStatusBadge from './SyncStatusBadge';
import { Search, Copy, Check, Filter, ExternalLink, RefreshCw, Calendar, User as UserIcon, RotateCcw } from 'lucide-react';

function getCampaignDisplayName(item: LinkRecord): string {
  if (item.utmCampaign && item.utmCampaign !== '-' && item.utmCampaign !== item.utmSource && item.utmCampaign !== item.mediaSource) {
    return item.utmCampaign;
  }
  if (item.afCId && item.afCId !== '-') return item.afCId;
  
  try {
    const url = new URL(item.finalLink);
    const cVal = url.searchParams.get('c') || url.searchParams.get('utm_campaign') || url.searchParams.get('af_c_id');
    if (cVal) return cVal;
  } catch {}

  return item.utmCampaign || '-';
}

export default function HistoryTable() {
  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCreator, setSelectedCreator] = useState<string>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
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

  // Extract unique creator names dynamically
  const uniqueCreators = useMemo(() => {
    const set = new Set<string>();
    links.forEach((l) => {
      if (l.createdByName) set.add(l.createdByName);
    });
    return Array.from(set);
  }, [links]);

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedType('ALL');
    setSelectedCreator('ALL');
    setSelectedDateRange('ALL');
    setStartDate('');
    setEndDate('');
    setSelectedStatus('ALL');
  };

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const campaignName = getCampaignDisplayName(link);

      // 1. Search term match
      const matchesSearch =
        !searchTerm.trim() ||
        link.finalLink.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.createdByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.utmSource && link.utmSource.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (link.mediaSource && link.mediaSource.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Link Type match
      const matchesType = selectedType === 'ALL' || link.linkType === selectedType;

      // 3. Creator match
      const matchesCreator = selectedCreator === 'ALL' || link.createdByName === selectedCreator;

      // 4. Status match
      const matchesStatus = selectedStatus === 'ALL' || link.syncStatus === selectedStatus;

      // 5. Date Range match
      let matchesDate = true;
      if (link.createdAt) {
        const linkDate = new Date(link.createdAt);
        const now = new Date();

        if (selectedDateRange === 'TODAY') {
          matchesDate = linkDate.toDateString() === now.toDateString();
        } else if (selectedDateRange === '7DAYS') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = linkDate >= sevenDaysAgo;
        } else if (selectedDateRange === '30DAYS') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = linkDate >= thirtyDaysAgo;
        } else if (selectedDateRange === 'CUSTOM') {
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            matchesDate = matchesDate && linkDate >= start;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && linkDate <= end;
          }
        }
      }

      return matchesSearch && matchesType && matchesCreator && matchesStatus && matchesDate;
    });
  }, [links, searchTerm, selectedType, selectedCreator, selectedDateRange, startDate, endDate, selectedStatus]);

  const isFiltered =
    searchTerm !== '' ||
    selectedType !== 'ALL' ||
    selectedCreator !== 'ALL' ||
    selectedDateRange !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    startDate !== '' ||
    endDate !== '';

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
          <p className="text-xs text-[#71716a] m-0 pt-1">
            Hiển thị {filteredLinks.length} / {links.length} bản ghi link
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isFiltered && (
            <button
              onClick={resetAllFilters}
              className="btn secondary text-xs min-h-[38px] px-3.5 text-[#b42318] border-[#deded7] hover:bg-[#fff0ed]"
              title="Đặt lại tất cả bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}

          <button
            onClick={fetchLinks}
            title="Tải lại danh sách"
            className="btn secondary text-xs min-h-[38px] px-3.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>
        </div>
      </div>

      {/* Advanced Multi-Dimensional Filter Bar */}
      <div className="p-4 bg-[#f9f9f6] border border-[#deded7] rounded-[16px] space-y-3">
        {/* Search Row */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71716a]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo link, người tạo, tên chiến dịch..."
            className="w-full pl-10 pr-4 h-[42px] bg-white border border-[#deded7] rounded-[12px] text-xs text-[#20201c] placeholder-[#71716a] focus:outline-none focus:border-[#20201c]"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Creator Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-bold text-[#71716a] flex items-center space-x-1">
              <UserIcon className="w-3 h-3 text-[#71716a]" />
              <span>Người tạo</span>
            </label>
            <select
              value={selectedCreator}
              onChange={(e) => setSelectedCreator(e.target.value)}
              className="w-full px-3 h-[40px] bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c] font-bold focus:outline-none focus:border-[#20201c]"
            >
              <option value="ALL">Tất cả người tạo ({uniqueCreators.length})</option>
              {uniqueCreators.map((creator) => (
                <option key={creator} value={creator}>
                  {creator}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-bold text-[#71716a] flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-[#71716a]" />
              <span>Ngày tạo</span>
            </label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full px-3 h-[40px] bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c] font-bold focus:outline-none focus:border-[#20201c]"
            >
              <option value="ALL">Tất cả thời gian</option>
              <option value="TODAY">Hôm nay</option>
              <option value="7DAYS">7 ngày qua</option>
              <option value="30DAYS">30 ngày qua</option>
              <option value="CUSTOM">Tùy chọn ngày...</option>
            </select>
          </div>

          {/* Link Type Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-bold text-[#71716a] flex items-center space-x-1">
              <Filter className="w-3 h-3 text-[#71716a]" />
              <span>Loại link</span>
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 h-[40px] bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c] font-bold focus:outline-none focus:border-[#20201c]"
            >
              <option value="ALL">Tất cả loại link</option>
              <option value="UTM">Google UTM</option>
              <option value="ONELINK">AppsFlyer OneLink</option>
            </select>
          </div>

          {/* Sync Status Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-bold text-[#71716a] flex items-center space-x-1">
              <RefreshCw className="w-3 h-3 text-[#71716a]" />
              <span>Trạng thái</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 h-[40px] bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c] font-bold focus:outline-none focus:border-[#20201c]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SUCCESS">Đã đồng bộ</option>
              <option value="PENDING">Đang chờ</option>
              <option value="FAILED">Lỗi đồng bộ</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if CUSTOM selected */}
        {selectedDateRange === 'CUSTOM' && (
          <div className="flex items-center space-x-3 pt-2 border-t border-[#deded7] animate-fadeIn">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#71716a] font-bold">Từ ngày:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 h-[38px] bg-white border border-[#deded7] rounded-[8px] text-xs text-[#20201c]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-[#71716a] font-bold">Đến ngày:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 h-[38px] bg-white border border-[#deded7] rounded-[8px] text-xs text-[#20201c]"
              />
            </div>
          </div>
        )}
      </div>

      {/* History Table matching Design System */}
      <div className="overflow-hidden border border-[#deded7] rounded-[18px] bg-white">
        <div className="hidden md:grid grid-cols-[90px_130px_180px_1fr_130px_120px] gap-4 items-center p-4 bg-[#20201c] text-white text-[11px] font-extrabold uppercase tracking-wider">
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
          <div className="text-center py-10 text-[#71716a] text-xs space-y-2">
            <p className="m-0 font-bold">Không tìm thấy bản ghi link nào khớp với bộ lọc.</p>
            {isFiltered && (
              <button
                onClick={resetAllFilters}
                className="btn secondary text-xs min-h-[34px] px-3.5"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          filteredLinks.map((item) => (
            <div
              key={item.id}
              className="flex flex-col md:grid md:grid-cols-[90px_130px_180px_1fr_130px_120px] gap-2 md:gap-4 items-start md:items-center p-4 border-b border-[#deded7] last:border-0 text-xs hover:bg-[#f9f9f6] transition-colors"
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
                <strong className="font-bold text-[#20201c] break-all">
                  {getCampaignDisplayName(item)}
                </strong>
                <span className="block text-[10px] text-[#71716a] break-all">
                  {item.utmSource || item.mediaSource || '-'} / {item.utmMedium || item.afChannel || '-'}
                </span>
              </div>

              <div className="w-full overflow-hidden break-all">
                <code className="block font-mono text-[11px] text-[#20201c] font-bold break-all whitespace-pre-wrap select-all leading-relaxed" title={item.finalLink}>
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
