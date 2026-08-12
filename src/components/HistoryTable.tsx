'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LinkRecord, User } from '@/types';
import { useUser } from '@/context/UserContext';
import SyncStatusBadge from './SyncStatusBadge';
import UpdateOneLinkModal from './UpdateOneLinkModal';
import { Search, Copy, Check, Filter, ExternalLink, RefreshCw, Calendar, User as UserIcon, RotateCcw, Edit3, Clock, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, Trash2, FileSpreadsheet } from 'lucide-react';


interface HistoryTableProps {
  currentUser?: User;
}

function getCampaignDisplayName(item: LinkRecord): string {
  if (item.utmCampaign && item.utmCampaign !== '-' && item.utmCampaign !== item.utmSource && item.utmCampaign !== item.mediaSource) {
    return item.utmCampaign;
  }
  if (item.afCId && item.afCId !== '-') return item.afCId;
  
  if (item.finalLink) {
    try {
      const url = new URL(item.finalLink);
      const cVal = url.searchParams.get('c') || url.searchParams.get('utm_campaign') || url.searchParams.get('af_c_id');
      if (cVal) return cVal;
    } catch {}
  }

  return item.utmCampaign || '-';
}

function renderRequestStatusBadge(status?: string, linkType?: string) {
  const currentStatus = status || (linkType === 'ONELINK' ? 'NEW' : 'COMPLETED');

  switch (currentStatus) {
    case 'NEW':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#fff4d1] text-[#8a6200] border border-[#edce67]">
          <Clock className="w-3 h-3 text-[#8a6200]" />
          <span>Mới tạo</span>
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#e0f2fe] text-[#0369a1] border border-[#7dd3fc]">
          <Clock className="w-3 h-3 text-[#0369a1] animate-spin" />
          <span>Đang xử lý</span>
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#eaf8ef] text-[#176b46] border border-[#86efac]">
          <CheckCircle2 className="w-3 h-3 text-[#176b46]" />
          <span>Đã tạo link</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#fff0ed] text-[#b42318] border border-[#fecdca]">
          <XCircle className="w-3 h-3 text-[#b42318]" />
          <span>Cần bổ sung / Hủy</span>
        </span>
      );
    default:
      return null;
  }
}

export default function HistoryTable({ currentUser }: HistoryTableProps) {
  const { user } = useUser();
  const activeUser = currentUser || user;

  const [links, setLinks] = useState<LinkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedCreator, setSelectedCreator] = useState<string>('ALL');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedRequestStatus, setSelectedRequestStatus] = useState<string>('ALL');
  const [selectedSyncStatus, setSelectedSyncStatus] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded Row State for details
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Update Modal State
  const [editingRecord, setEditingRecord] = useState<LinkRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteRecord = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản ghi này khỏi hệ thống?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi xóa bản ghi');
      await fetchLinks();
    } catch (err: any) {
      alert(err.message || 'Không thể xóa bản ghi');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteLegacyOneLinks = async () => {
    if (!confirm('Bạn có chắc chắn muốn dọn dẹp TOÀN BỘ các bản ghi OneLink kiểu cũ (các bản ghi tự sinh link trước đây) khỏi hệ thống?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/links', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi dọn dẹp OneLink cũ');
      alert(data.message);
      await fetchLinks();
    } catch (err: any) {
      alert(err.message || 'Không thể dọn dẹp');
    } finally {
      setIsDeleting(false);
    }
  };

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

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
    setSelectedRequestStatus('ALL');
    setSelectedSyncStatus('ALL');
  };

  const filteredLinks = useMemo(() => {
    return links.filter((link) => {
      const campaignName = getCampaignDisplayName(link);
      const reqStatus = link.status || (link.linkType === 'ONELINK' ? 'NEW' : 'COMPLETED');

      // 1. Search term match
      const matchesSearch =
        !searchTerm.trim() ||
        (link.finalLink && link.finalLink.toLowerCase().includes(searchTerm.toLowerCase())) ||
        link.createdByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (link.utmSource && link.utmSource.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (link.mediaSource && link.mediaSource.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (link.desiredSlug && link.desiredSlug.toLowerCase().includes(searchTerm.toLowerCase()));

      // 2. Link Type match
      const matchesType = selectedType === 'ALL' || link.linkType === selectedType;

      // 3. Creator match
      const matchesCreator = selectedCreator === 'ALL' || link.createdByName === selectedCreator;

      // 4. Request Status match
      const matchesReqStatus = selectedRequestStatus === 'ALL' || reqStatus === selectedRequestStatus;

      // 5. Sync Status match
      const matchesSyncStatus = selectedSyncStatus === 'ALL' || link.syncStatus === selectedSyncStatus;

      // 6. Date Range match
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

      return matchesSearch && matchesType && matchesCreator && matchesReqStatus && matchesSyncStatus && matchesDate;
    });
  }, [links, searchTerm, selectedType, selectedCreator, selectedDateRange, startDate, endDate, selectedRequestStatus, selectedSyncStatus]);

  const isFiltered =
    searchTerm !== '' ||
    selectedType !== 'ALL' ||
    selectedCreator !== 'ALL' ||
    selectedDateRange !== 'ALL' ||
    selectedRequestStatus !== 'ALL' ||
    selectedSyncStatus !== 'ALL' ||
    startDate !== '' ||
    endDate !== '';

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenUpdateModal = (item: LinkRecord) => {
    setEditingRecord(item);
    setIsUpdateModalOpen(true);
  };

  const handleExportExcel = () => {
    window.open('/api/links/export', '_blank');
  };

  return (
    <div className="duhat-card space-y-6">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#deded7] pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#20201c] tracking-tight m-0">Lịch sử Team</h2>
          <p className="text-xs text-[#71716a] m-0 pt-1">
            Hiển thị {filteredLinks.length} / {links.length} bản ghi
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
            onClick={handleExportExcel}
            title="Xuất dữ liệu lịch sử ra file Excel (.xlsx)"
            className="btn secondary text-xs min-h-[38px] px-3.5 bg-[#107c41] text-white border-[#107c41] hover:bg-[#0b5c30]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

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


      {/* Multi-Dimensional Filter Bar */}
      <div className="p-4 bg-[#f9f9f6] border border-[#deded7] rounded-[16px] space-y-3">
        {/* Search Row */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71716a]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo link, người gửi, tên chiến dịch, nguồn..."
            className="w-full pl-10 pr-4 h-[42px] bg-white border border-[#deded7] rounded-[12px] text-xs text-[#20201c] placeholder-[#71716a] focus:outline-none focus:border-[#20201c]"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Creator Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-bold text-[#71716a] flex items-center space-x-1">
              <UserIcon className="w-3 h-3 text-[#71716a]" />
              <span>Người yêu cầu</span>
            </label>
            <select
              value={selectedCreator}
              onChange={(e) => setSelectedCreator(e.target.value)}
              className="w-full px-2.5 h-[38px] bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c] font-bold focus:outline-none focus:border-[#20201c]"
            >
              <option value="ALL">Tất cả ({uniqueCreators.length})</option>
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
              <span>Thời gian</span>
            </label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full px-2.5 h-[38px] bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c] font-bold focus:outline-none focus:border-[#20201c]"
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
              className="w-full px-2.5 h-[38px] bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c] font-bold focus:outline-none focus:border-[#20201c]"
            >
              <option value="ALL">Tất cả loại</option>
              <option value="ONELINK">AppsFlyer OneLink</option>
              <option value="UTM">Google UTM</option>
            </select>
          </div>

          {/* Request Status Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-bold text-[#71716a] flex items-center space-x-1">
              <Clock className="w-3 h-3 text-[#71716a]" />
              <span>Trạng thái xử lý</span>
            </label>
            <select
              value={selectedRequestStatus}
              onChange={(e) => setSelectedRequestStatus(e.target.value)}
              className="w-full px-2.5 h-[38px] bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c] font-bold focus:outline-none focus:border-[#20201c]"
            >
              <option value="ALL">Tất cả xử lý</option>
              <option value="NEW">Mới tạo (Chờ xử lý)</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="COMPLETED">Đã tạo link</option>
              <option value="REJECTED">Cần bổ sung / Hủy</option>
            </select>
          </div>

          {/* Sync Status Filter */}
          <div className="flex flex-col space-y-1">
            <label className="text-[11px] font-bold text-[#71716a] flex items-center space-x-1">
              <RefreshCw className="w-3 h-3 text-[#71716a]" />
              <span>SharePoint Sync</span>
            </label>
            <select
              value={selectedSyncStatus}
              onChange={(e) => setSelectedSyncStatus(e.target.value)}
              className="w-full px-2.5 h-[38px] bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c] font-bold focus:outline-none focus:border-[#20201c]"
            >
              <option value="ALL">Tất cả đồng bộ</option>
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

      {/* History Table */}
      <div className="overflow-hidden border border-[#deded7] rounded-[18px] bg-white">
        <div className="hidden md:grid grid-cols-[85px_120px_150px_1fr_135px_195px] gap-3 items-center p-4 bg-[#20201c] text-white text-[11px] font-extrabold uppercase tracking-wider">
          <span>Loại</span>
          <span>Người gửi</span>
          <span>Chiến dịch</span>
          <span>Link / Trạng thái</span>
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
            <p className="m-0 font-bold">Không tìm thấy bản ghi nào khớp với bộ lọc.</p>
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
          filteredLinks.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="border-b border-[#deded7] last:border-0 hover:bg-[#fcfcf9] transition-colors"
              >
                <div className="flex flex-col md:grid md:grid-cols-[85px_120px_150px_1fr_135px_195px] gap-2 md:gap-3 items-start md:items-center p-4 text-xs">
                  <div>
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.linkType === 'ONELINK'
                          ? 'bg-[#fff3bd] text-[#8a6200] border border-[#edce67]'
                          : 'bg-[#e0f2fe] text-[#0369a1] border border-[#7dd3fc]'
                      }`}
                    >
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

                  <div className="w-full overflow-hidden break-all space-y-1">
                    {item.finalLink ? (
                      <button
                        type="button"
                        onClick={() => handleCopy(item.finalLink, item.id)}
                        className="group text-left w-full p-2 rounded-[10px] bg-[#f8f8f6] hover:bg-[#fff9df] border border-[#deded7] hover:border-[#edce67] transition-all cursor-pointer relative"
                        title="Click để sao chép link"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-black uppercase text-[#71716a] group-hover:text-[#8a6200] flex items-center gap-1">
                            <Copy className="w-2.5 h-2.5" />
                            <span>Bấm vào để copy</span>
                          </span>
                          {copiedId === item.id ? (
                            <span className="text-[10px] font-bold text-[#176b46] bg-[#eaf8ef] border border-[#a2e2b8] px-1.5 py-0.2 rounded flex items-center gap-0.5 animate-fadeIn">
                              <Check className="w-3 h-3 text-[#176b46]" />
                              <span>Đã copy!</span>
                            </span>
                          ) : (
                            <span className="text-[9px] text-[#71716a] opacity-0 group-hover:opacity-100 transition-opacity">
                              Sao chép
                            </span>
                          )}
                        </div>
                        <code className="block font-mono text-[11px] text-[#20201c] font-bold break-all leading-relaxed group-hover:text-[#8a6200]">
                          {item.finalLink}
                        </code>
                      </button>
                    ) : (
                      <div className="space-y-1 text-xs">
                        <div className="text-[11px] text-[#8a6200] font-semibold italic">
                          ⏳ Đang chờ người phụ trách khởi tạo OneLink trên AppsFlyer
                        </div>
                        {item.desiredSlug && (
                          <div className="flex items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] text-[#71716a] font-bold">Đuôi link đề xuất:</span>
                            <code className="bg-[#fff4d1] text-[#8a6200] border border-[#edce67] px-2 py-0.5 rounded font-mono font-bold text-[11px] whitespace-nowrap">
                              {item.desiredSlug}
                            </code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    {renderRequestStatusBadge(item.status, item.linkType)}
                    <SyncStatusBadge
                      linkId={item.id}
                      status={item.syncStatus}
                      syncAttempts={item.syncAttempts}
                      lastError={item.lastSyncError}
                      onSyncComplete={fetchLinks}
                    />
                  </div>

                  <div className="flex items-center justify-start md:justify-end gap-1.5 w-full shrink-0">
                    {/* 1. Toggle details expansion */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1.5 text-[#71716a] hover:text-[#20201c] hover:bg-[#deded7]/50 rounded-full transition-colors shrink-0"
                      title="Xem chi tiết yêu cầu"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* 2. Admin Action: Update Link (OneLink only) */}
                    {item.linkType === 'ONELINK' && activeUser?.role === 'ADMIN' && (
                      <button
                        onClick={() => handleOpenUpdateModal(item)}
                        className="btn secondary text-[11px] min-h-[32px] px-2.5 bg-[#20201c] text-white hover:bg-[#3a3a33] border-[#20201c] shrink-0"
                        title="Cập nhật OneLink hoàn chỉnh (Dành cho Admin)"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                    )}

                    {/* 3. Open External Link Button */}
                    {item.finalLink && (
                      <a
                        href={item.finalLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn secondary text-[11px] min-h-[32px] px-2.5 shrink-0"
                        title="Mở link trong tab mới"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* 4. Admin Action: Delete Record (ALWAYS AT FAR RIGHT) */}
                    {activeUser?.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteRecord(item.id)}
                        disabled={isDeleting}
                        className="p-1.5 text-[#b42318] hover:bg-[#fff0ed] rounded-full transition-colors shrink-0"
                        title="Xóa bản ghi này (Dành cho Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-5 py-4 bg-[#f8f8f6] border-t border-[#deded7] text-xs space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-[#deded7] pb-2">
                      <div className="font-extrabold text-[#20201c] flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${item.linkType === 'ONELINK' ? 'bg-[#8a6200]' : 'bg-[#0369a1]'}`}></span>
                        <span>
                          Chi tiết đầy đủ {item.linkType === 'ONELINK' ? 'Yêu cầu OneLink' : 'Link Google UTM'} #{item.id.slice(0, 8)}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#71716a]">
                        Tạo lúc: {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    {/* Distinct Grid View for UTM vs ONELINK */}
                    {item.linkType === 'UTM' ? (
                      /* UTM Details Grid */
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 bg-white p-3.5 rounded-[12px] border border-[#deded7]">
                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Người khởi tạo</span>
                          <strong className="text-[#20201c] font-bold">{item.createdByName}</strong>
                          <span className="block text-[10px] text-[#71716a]">{item.createdByEmail || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">URL Gốc (Landing Page)</span>
                          <code className="text-[#20201c] font-mono text-[11px] break-all">{item.originalUrl || '-'}</code>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Nguồn (utm_source)</span>
                          <span className="font-bold text-[#20201c]">{item.utmSource || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Kênh (utm_medium)</span>
                          <span className="font-bold text-[#20201c]">{item.utmMedium || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Tên chiến dịch (utm_campaign)</span>
                          <span className="font-bold text-[#20201c]">{getCampaignDisplayName(item)}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Mã chiến dịch (utm_id)</span>
                          <span className="font-mono text-[#20201c]">{item.utmId || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Nội dung QC (utm_content)</span>
                          <span className="font-bold text-[#20201c]">{item.utmContent || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Từ khóa (utm_term)</span>
                          <span className="font-bold text-[#20201c]">{item.utmTerm || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Link UTM Hoàn chỉnh</span>
                          <code className="font-mono text-[11px] text-[#0369a1] font-bold break-all">{item.finalLink}</code>
                        </div>
                      </div>
                    ) : (
                      /* OneLink Details Grid */
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 bg-white p-3.5 rounded-[12px] border border-[#deded7]">
                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Người yêu cầu</span>
                          <strong className="text-[#20201c] font-bold">{item.createdByName}</strong>
                          <span className="block text-[10px] text-[#71716a]">{item.createdByEmail || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">OneLink Template</span>
                          <code className="text-[#20201c] font-mono text-[11px] break-all">{item.originalUrl || '-'}</code>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Khách hàng mục tiêu</span>
                          <span className="font-bold text-[#20201c]">
                            {item.targetUser === 'NEW_USER'
                              ? 'Khách hàng mới (New Users)'
                              : item.targetUser === 'EXISTING_USER'
                              ? 'Người dùng đã cài App (Existing Users)'
                              : item.targetUser === 'BOTH'
                              ? 'Cả khách mới & khách cũ (Both)'
                              : '-'}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Nguồn đặt link (media_source / pid)</span>
                          <span className="font-bold text-[#20201c]">{item.mediaSource || item.utmSource || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Hình thức (af_channel / channel)</span>
                          <span className="font-bold text-[#20201c]">{item.afChannel || item.utmMedium || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Tên chiến dịch (campaign_name / c)</span>
                          <span className="font-bold text-[#20201c]">{getCampaignDisplayName(item)}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Mã quản lý nội bộ (af_c_id)</span>
                          <span className="font-mono text-[#20201c]">{item.afCId || item.utmId || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Nhóm QC (af_adset)</span>
                          <span className="font-bold text-[#20201c]">{item.afAdset || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Mẫu QC (af_ad)</span>
                          <span className="font-bold text-[#20201c]">{item.afAd || item.utmContent || '-'}</span>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Đích đến trong App (deep_link_value)</span>
                          <code className="font-mono text-[#8a6200] font-bold">{item.deepLinkValue || '-'}</code>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">Slug đề xuất</span>
                          <code className="font-mono text-[#8a6200] font-bold">{item.desiredSlug || '-'}</code>
                        </div>

                        <div>
                          <span className="block text-[10px] font-black uppercase text-[#71716a]">OneLink Hoàn chỉnh</span>
                          {item.finalLink ? (
                            <code className="font-mono text-[11px] text-[#176b46] font-bold break-all">{item.finalLink}</code>
                          ) : (
                            <span className="text-[#8a6200] italic font-semibold">Chưa khởi tạo trên AppsFlyer</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Section 2: Note */}
                    {item.note && (
                      <div className="bg-[#fff9df] p-3 rounded-[10px] border border-[#edce67] text-xs">
                        <span className="font-bold text-[#8a6200]">Ghi chú từ người gửi: </span>
                        <span className="text-[#20201c] italic">{item.note}</span>
                      </div>
                    )}

                    {/* Section 3: Social Preview */}
                    {item.socialPreview?.enabled && (
                      <div className="p-3 bg-white rounded-[10px] border border-[#deded7] text-xs space-y-1.5">
                        <div className="font-bold text-[#8a6200] flex items-center space-x-1.5">
                          <span>🌐 Cấu hình Hiển thị Social Media Preview:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[#20201c]">
                          <div><span className="text-[#71716a]">Title:</span> {item.socialPreview.title || '-'}</div>
                          <div><span className="text-[#71716a]">Description:</span> {item.socialPreview.description || '-'}</div>
                          <div className="break-all"><span className="text-[#71716a]">Image URL:</span> {item.socialPreview.imageUrl || '-'}</div>
                        </div>
                      </div>
                    )}

                    {/* Section 4: Admin Audit Log */}
                    {item.processedByName && (
                      <div className="text-[11px] text-[#176b46] pt-2 border-t border-[#deded7] flex items-center justify-between">
                        <div>
                          <span>Người cập nhật link: </span>
                          <strong className="font-extrabold">{item.processedByName}</strong>
                          {item.processedAt && <span> lúc {new Date(item.processedAt).toLocaleString('vi-VN')}</span>}
                        </div>
                        <span className="font-bold uppercase bg-[#eaf8ef] px-2 py-0.5 rounded text-[10px]">
                          Trạng thái: {item.status}
                        </span>
                      </div>
                    )}
                  </div>
                )}


              </div>
            );
          })
        )}
      </div>

      {/* Admin Update OneLink Modal */}
      <UpdateOneLinkModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        record={editingRecord}
        onSuccess={fetchLinks}
      />
    </div>
  );
}
