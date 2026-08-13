'use client';

import React, { useState, useMemo } from 'react';
import { LinkType, User, TargetUserType, DuplicateLinkErrorResponse } from '@/types';
import AutocompleteInput from './AutocompleteInput';
import UrlAutocompleteInput from './UrlAutocompleteInput';
import ConfirmModal from './ConfirmModal';
import { generateUtmUrl } from '@/lib/link-generator';
import { Copy, Check, AlertCircle, ExternalLink, Link as LinkIcon, CheckCircle2, RotateCcw, Info, Share2, FileText, Send } from 'lucide-react';

interface LinkBuilderFormProps {
  currentUser: User;
  onLinkCreated?: () => void;
}

export default function LinkBuilderForm({ currentUser, onLinkCreated }: LinkBuilderFormProps) {
  const [activeTab, setActiveTab] = useState<LinkType>('ONELINK');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPreview, setCopiedPreview] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdLinkRecord, setCreatedLinkRecord] = useState<any>(null);

  // Duplicate Link Modal State
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateLinkErrorResponse['existingRecord'] | null>(null);

  // Form Fields - Google UTM
  const [utmUrl, setUtmUrl] = useState('');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmId, setUtmId] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [utmTerm, setUtmTerm] = useState('');

  // Form Fields - AppsFlyer OneLink Request
  const DEFAULT_ONELINK_TEMPLATE = process.env.NEXT_PUBLIC_ONELINK_DEFAULT_TEMPLATE || 'https://duhat.onelink.me/abc1';
  const [oneLinkTemplate, setOneLinkTemplate] = useState(DEFAULT_ONELINK_TEMPLATE);
  const [mediaSource, setMediaSource] = useState('');
  const [channel, setChannel] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [adGroup, setAdGroup] = useState('');
  const [adName, setAdName] = useState('');
  const [targetUser, setTargetUser] = useState<TargetUserType>('NEW_USER');
  const [deepLinkValue, setDeepLinkValue] = useState('');
  const [desiredSlug, setDesiredSlug] = useState('');
  const [note, setNote] = useState('');

  // Social Media Preview Fields
  const [enableSocialPreview, setEnableSocialPreview] = useState(false);
  const [socialTitle, setSocialTitle] = useState('');
  const [socialDescription, setSocialDescription] = useState('');
  const [socialImageUrl, setSocialImageUrl] = useState('');

  // Real-time Preview Calculation (UTM only)
  const liveUtmPreview = useMemo(() => {
    try {
      if (activeTab === 'UTM') {
        if (!utmUrl && !utmSource && !utmMedium && !utmCampaign) return '';
        return generateUtmUrl({
          originalUrl: utmUrl || 'https://duhat.vn',
          utmSource: utmSource || '',
          utmMedium: utmMedium || '',
          utmCampaign: utmCampaign || '',
          utmId: utmId || undefined,
          utmContent: utmContent || undefined,
          utmTerm: utmTerm || undefined,
        });
      }
      return '';
    } catch {
      return '';
    }
  }, [activeTab, utmUrl, utmSource, utmMedium, utmCampaign, utmId, utmContent, utmTerm]);

  const handleResetForm = () => {
    setUtmUrl('');
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
    setUtmId('');
    setUtmContent('');
    setUtmTerm('');

    setOneLinkTemplate('https://duhat.onelink.me/abc1');
    setMediaSource('');
    setChannel('');
    setCampaignName('');
    setCampaignId('');
    setAdGroup('');
    setAdName('');
    setTargetUser('NEW_USER');
    setDeepLinkValue('');
    setDesiredSlug('');
    setNote('');
    setEnableSocialPreview(false);
    setSocialTitle('');
    setSocialDescription('');
    setSocialImageUrl('');

    setErrorMessage('');
    setDuplicateInfo(null);
    setCreatedLinkRecord(null);
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (activeTab === 'UTM') {
      if (!utmUrl.trim() || !utmSource.trim() || !utmMedium.trim() || !utmCampaign.trim()) {
        setErrorMessage('Vui lòng điền đủ các trường bắt buộc có dấu * (URL, Nguồn, Kênh, Tên chiến dịch).');
        return;
      }
    } else {
      if (!oneLinkTemplate.trim() || !mediaSource.trim() || !channel.trim() || !campaignName.trim() || !targetUser || !deepLinkValue.trim()) {
        setErrorMessage('Vui lòng điền đủ các trường bắt buộc có dấu * (Template, Nguồn, Hình thức, Tên chiến dịch, Khách hàng mục tiêu, Đích đến trong App).');
        return;
      }
    }

    setIsConfirmOpen(true);
  };

  const handleExecuteCreate = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setDuplicateInfo(null);

    const payload =
      activeTab === 'UTM'
        ? {
          linkType: 'UTM',
          originalUrl: utmUrl,
          utmSource,
          utmMedium,
          utmCampaign,
          utmId,
          utmContent,
          utmTerm,
        }
        : {
          linkType: 'ONELINK',
          oneLinkTemplate,
          mediaSource,
          channel,
          campaignName,
          campaignId,
          adGroup,
          adName,
          targetUser,
          deepLinkValue,
          desiredSlug,
          socialPreview: enableSocialPreview ? {
            enabled: true,
            title: socialTitle,
            description: socialDescription,
            imageUrl: socialImageUrl,
          } : undefined,
          note,
        };

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 409 && data.isDuplicate) {
        setDuplicateInfo(data.existingRecord);
        setIsConfirmOpen(false);
      } else if (!res.ok) {
        setErrorMessage(data.error || 'Thao tác thất bại.');
      } else {
        setCreatedLinkRecord(data.linkRecord);
        setIsConfirmOpen(false);
        if (onLinkCreated) onLinkCreated();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi mạng khi gọi API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPreview = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPreview(true);
    setTimeout(() => setCopiedPreview(false), 2000);
  };

  const targetUserLabel = targetUser === 'NEW_USER' ? 'Khách mới' : targetUser === 'EXISTING_USER' ? 'Người đã cài App' : 'Cả hai';

  return (
    <div className="duhat-card space-y-6">
      {/* Segmented Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#deded7] pb-5">
        <div className="tabs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ONELINK');
              setCreatedLinkRecord(null);
              setDuplicateInfo(null);
            }}
            className={`tab ${activeTab === 'ONELINK' ? 'active' : ''}`}
          >
            AppsFlyer OneLink
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('UTM');
              setCreatedLinkRecord(null);
              setDuplicateInfo(null);
            }}
            className={`tab ${activeTab === 'UTM' ? 'active' : ''}`}
          >
            Google UTM Track
          </button>
        </div>

        <div className="text-right">
          <span className="text-xs text-[#71716a] font-medium">Người yêu cầu: </span>
          <span className="font-extrabold text-xs text-[#20201c]">{currentUser.fullName}</span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {createdLinkRecord && (
        <div className="p-4 bg-[#eaf8ef] border border-[#176b46]/30 rounded-[14px] text-[#176b46] font-bold text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#176b46]" />
            <span>
              {activeTab === 'ONELINK'
                ? '🎉 Đã gửi yêu cầu OneLink thành công! Yêu cầu đã được lưu để người phụ trách AppsFlyer xử lý.'
                : '🎉 Tạo link UTM thành công! Link đã được lưu vào hệ thống.'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {createdLinkRecord.finalLink && (
              <button
                type="button"
                onClick={() => handleCopyLink(createdLinkRecord.finalLink)}
                className="btn yellow text-xs min-h-[34px] px-3.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Đã sao chép!' : 'Sao chép link'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleResetForm}
              className="btn secondary text-xs min-h-[34px] px-3 bg-white"
              title="Xóa nhanh form để nhập yêu cầu tiếp theo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{activeTab === 'ONELINK' ? 'Gửi yêu cầu tiếp' : 'Tạo link tiếp'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-[#fff0ed] border border-[#deded7] rounded-[12px] text-[#b42318] text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Duplicate Link Card */}
      {duplicateInfo && (
        <div className="p-5 bg-[#fff4d1] border border-[#edce67] rounded-[18px] space-y-3 text-[#20201c]">
          <div className="flex items-center space-x-2 text-[#8a6200] font-extrabold text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>
              {activeTab === 'ONELINK'
                ? `Yêu cầu này đã được ${duplicateInfo.createdByName} gửi trước đó lúc ${new Date(duplicateInfo.createdAt).toLocaleTimeString('vi-VN')}`
                : `Link này đã được ${duplicateInfo.createdByName} tạo lúc ${new Date(duplicateInfo.createdAt).toLocaleTimeString('vi-VN')}`}
            </span>
          </div>
          <div className="bg-white p-3.5 rounded-[12px] border border-[#deded7] text-xs space-y-1 font-mono">
            <div><span className="text-[#71716a]">Trạng thái / Link: </span><span className="font-bold text-[#20201c] break-all">{duplicateInfo.finalLink || 'Đang chờ tạo trên AppsFlyer'}</span></div>
            <div><span className="text-[#71716a]">Email người gửi: </span><span>{duplicateInfo.createdByEmail}</span></div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleOpenConfirm} className="space-y-6">
        {activeTab === 'UTM' ? (
          <div className="space-y-5">
            <UrlAutocompleteInput
              label="URL website"
              linkType="UTM"
              value={utmUrl}
              onChange={setUtmUrl}
              required
              placeholder="https://duhat.vn/landing-page"
              helpText="URL đầy đủ bắt đầu bằng http:// hoặc https://. Tự động gợi ý từ lịch sử website."
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AutocompleteInput
                label="Nguồn (utm_source)"
                categoryType="utm_source"
                linkType="UTM"
                value={utmSource}
                onChange={setUtmSource}
                required
                placeholder="google, facebook, zalo..."
                helpText="Tham số utm_source."
              />
              <AutocompleteInput
                label="Kênh (utm_medium)"
                categoryType="utm_medium"
                linkType="UTM"
                value={utmMedium}
                onChange={setUtmMedium}
                required
                placeholder="cpc, paid_social, email..."
                helpText="Tham số utm_medium."
              />
              <AutocompleteInput
                label="Tên chiến dịch (utm_campaign)"
                categoryType="utm_campaign"
                linkType="UTM"
                value={utmCampaign}
                onChange={setUtmCampaign}
                required
                placeholder="tet_sale_2026..."
                helpText="Tham số utm_campaign."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#deded7]">
              <AutocompleteInput
                label="ID Chiến dịch (utm_id)"
                categoryType="utm_id"
                linkType="UTM"
                value={utmId}
                onChange={setUtmId}
                placeholder="cmp_9981..."
              />
              <AutocompleteInput
                label="Nội dung (utm_content)"
                categoryType="utm_content"
                linkType="UTM"
                value={utmContent}
                onChange={setUtmContent}
                placeholder="banner_hero_v1..."
              />
              <AutocompleteInput
                label="Từ khóa (utm_term)"
                categoryType="utm_term"
                linkType="UTM"
                value={utmTerm}
                onChange={setUtmTerm}
                placeholder="phong_thuy..."
              />
            </div>
          </div>
        ) : (
          /* AppsFlyer OneLink Request Form */
          <div className="space-y-5">
            {/* 4.1 OneLink Template */}
            <UrlAutocompleteInput
              label="OneLink Template *"
              linkType="ONELINK"
              value={oneLinkTemplate}
              onChange={setOneLinkTemplate}
              required
              placeholder="https://duhat.onelink.me/abc1"
              helpText="Chọn template AppsFlyer được cấu hình sẵn cho ứng dụng."
            />

            {/* 4.2 Nguồn & 4.3 Hình thức & 4.4 Tên chiến dịch */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AutocompleteInput
                label="Nguồn / Nơi đặt link *"
                categoryType="media_source"
                linkType="ONELINK"
                value={mediaSource}
                onChange={setMediaSource}
                required
                placeholder="facebook, tiktok, zalo_oa, email, qr..."
                helpText="Nơi link sẽ được phát hành (Tham số AppsFlyer: pid)."
              />
              <AutocompleteInput
                label="Hình thức sử dụng *"
                categoryType="channel"
                linkType="ONELINK"
                value={channel}
                onChange={setChannel}
                required
                placeholder="Quảng cáo trả phí, Bài đăng tự nhiên, Email..."
                helpText="Cách thức phân phối link (Tham số AppsFlyer: af_channel)."
              />
              <AutocompleteInput
                label="Tên chiến dịch *"
                categoryType="campaign_name"
                linkType="ONELINK"
                value={campaignName}
                onChange={setCampaignName}
                required
                placeholder="Siêu Sale 2026, Hội thảo Hà Nội..."
                helpText="Tên chiến dịch nghiệp vụ (Tham số AppsFlyer: c)."
              />
            </div>

            {/* 4.5 Mã quản lý & 4.6 Nhóm QC & 4.7 Mẫu QC */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#deded7]">
              <AutocompleteInput
                label="Mã quản lý nội bộ"
                categoryType="campaign_id"
                linkType="ONELINK"
                value={campaignId}
                onChange={setCampaignId}
                placeholder="cmp_sale_06, c_1029..."
                helpText="Dùng đối soát hệ thống nội bộ (af_c_id)."
              />
              <AutocompleteInput
                label="Nhóm quảng cáo / Ad Set"
                categoryType="ad_group"
                linkType="ONELINK"
                value={adGroup}
                onChange={setAdGroup}
                placeholder="khach_cu, gen_z, hanoi_25_35..."
                helpText="Phân biệt đối tượng nhóm quảng cáo (af_adset)."
              />
              <AutocompleteInput
                label="Mẫu quảng cáo / Ad"
                categoryType="ad_name"
                linkType="ONELINK"
                value={adName}
                onChange={setAdName}
                placeholder="video_review, banner_red..."
                helpText="Tên mẫu creative quảng cáo (af_ad)."
              />
            </div>

            {/* 4.8 Khách hàng mục tiêu & 4.10 Đích đến trong App */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#deded7]">
              {/* 4.8 Khách hàng mục tiêu */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-[#20201c]">
                  Khách hàng mục tiêu <span className="text-[#b42318]">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetUser('NEW_USER')}
                    className={`px-3 py-2 text-xs font-bold rounded-[10px] border transition-all ${
                      targetUser === 'NEW_USER'
                        ? 'bg-[#20201c] text-white border-[#20201c]'
                        : 'bg-white text-[#20201c] border-[#deded7] hover:bg-[#f5f5f0]'
                    }`}
                  >
                    Khách mới
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetUser('EXISTING_USER')}
                    className={`px-3 py-2 text-xs font-bold rounded-[10px] border transition-all ${
                      targetUser === 'EXISTING_USER'
                        ? 'bg-[#20201c] text-white border-[#20201c]'
                        : 'bg-white text-[#20201c] border-[#deded7] hover:bg-[#f5f5f0]'
                    }`}
                  >
                    Người đã cài App
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetUser('BOTH')}
                    className={`px-3 py-2 text-xs font-bold rounded-[10px] border transition-all ${
                      targetUser === 'BOTH'
                        ? 'bg-[#20201c] text-white border-[#20201c]'
                        : 'bg-white text-[#20201c] border-[#deded7] hover:bg-[#f5f5f0]'
                    }`}
                  >
                    Cả hai
                  </button>
                </div>
                <p className="text-[11px] text-[#71716a] m-0 italic">
                  💡 Người phụ trách AppsFlyer sẽ kiểm tra và quyết định cấu hình Retargeting khi tạo link.
                </p>
              </div>

              {/* 4.10 Đích đến trong App */}
              <AutocompleteInput
                label="Đích đến trong App *"
                categoryType="deep_link_screen"
                linkType="ONELINK"
                value={deepLinkValue}
                onChange={setDeepLinkValue}
                required
                placeholder="Trang chủ, Tạo khảo sát, Chi tiết khảo sát..."
                helpText="Chỉ chọn màn hình đã được Product/Developer xác nhận hỗ trợ."
              />
            </div>

            {/* 4.11 Đuôi link mong muốn & 4.13 Thông tin bổ sung */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#deded7]">
              <div className="space-y-1">
                <label className="block text-xs font-black text-[#20201c]">Đuôi link mong muốn (Slug)</label>
                <input
                  type="text"
                  value={desiredSlug}
                  onChange={(e) => setDesiredSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-_]/g, ''))}
                  placeholder="tet2026, survey2026..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#deded7] rounded-[12px] text-xs font-mono text-[#20201c] focus:outline-none focus:border-[#20201c]"
                />
                <p className="text-[11px] text-[#8a6200] m-0 italic">
                  ⚠️ Đuôi link chỉ là đề xuất. Link thực tế phụ thuộc khả năng khởi tạo trên AppsFlyer.
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-[#20201c]">Ghi chú / Thông tin phụ</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Dùng cho standee Hội thảo, Cần xong trước 15/08..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#deded7] rounded-[12px] text-xs text-[#20201c] focus:outline-none focus:border-[#20201c]"
                />
                <p className="text-[11px] text-[#71716a] m-0">
                  Bổ sung các thông tin hoặc thời hạn yêu cầu cho chuyên viên xử lý.
                </p>
              </div>
            </div>

            {/* 4.12 Hiển thị Mạng Xã Hội (Social Media Preview) */}
            <div className="p-4 bg-[#f8f8f6] rounded-[16px] border border-[#e5e5e0] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-[#20201c]">
                  <Share2 className="w-4 h-4 text-[#8a6200]" />
                  <span>Hiển thị Mạng Xã Hội (Social Media Preview)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setEnableSocialPreview(false)}
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition-all ${
                      !enableSocialPreview ? 'bg-[#20201c] text-white' : 'bg-white text-[#71716a] border border-[#deded7]'
                    }`}
                  >
                    Mặc định
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnableSocialPreview(true)}
                    className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition-all ${
                      enableSocialPreview ? 'bg-[#8a6200] text-white' : 'bg-white text-[#71716a] border border-[#deded7]'
                    }`}
                  >
                    Có yêu cầu riêng
                  </button>
                </div>
              </div>

              {enableSocialPreview && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[#deded7]">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-extrabold text-[#20201c]">Tiêu đề hiển thị</label>
                    <input
                      type="text"
                      value={socialTitle}
                      onChange={(e) => setSocialTitle(e.target.value)}
                      placeholder="Tham gia Khảo sát nhận Voucher..."
                      className="w-full px-3 py-2 bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-extrabold text-[#20201c]">Mô tả hiển thị</label>
                    <input
                      type="text"
                      value={socialDescription}
                      onChange={(e) => setSocialDescription(e.target.value)}
                      placeholder="Chương trình ưu đãi đặc biệt tháng 8..."
                      className="w-full px-3 py-2 bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-extrabold text-[#20201c]">Link hình ảnh mong muốn</label>
                    <input
                      type="url"
                      value={socialImageUrl}
                      onChange={(e) => setSocialImageUrl(e.target.value)}
                      placeholder="https://example.com/banner.png"
                      className="w-full px-3 py-2 bg-white border border-[#deded7] rounded-[10px] text-xs text-[#20201c]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUMMARY / PREVIEW ROW */}
        {activeTab === 'UTM' ? (
          <div className="p-5 bg-gradient-to-r from-[#fffcf2] via-white to-[#fffcf2] border border-[#ffcc00]/60 rounded-[20px] space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-[#8a6200]">
                <LinkIcon className="w-4 h-4 text-[#8a6200]" />
                <span>LINK DỰ KIẾN</span>
                <span className="w-2 h-2 rounded-full bg-[#176b46] animate-pulse"></span>
              </div>

              {liveUtmPreview && (
                <button
                  type="button"
                  onClick={() => handleCopyPreview(liveUtmPreview)}
                  className="px-3 py-1 bg-[#ffcc00] hover:bg-[#ebd217] text-[#20201c] rounded-full text-[11px] font-black transition-all border-0 cursor-pointer flex items-center gap-1"
                >
                  {copiedPreview ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {liveUtmPreview ? (
              <p className="m-0 font-mono text-xs sm:text-sm font-bold text-[#20201c] break-all select-all leading-relaxed pt-1">
                {liveUtmPreview}
              </p>
            ) : (
              <p className="m-0 font-sans text-xs text-[#71716a] italic pt-1">
                Bắt đầu nhập thông tin ở trên để tạo và cập nhật link dự kiến theo thời gian thực...
              </p>
            )}
          </div>
        ) : (
          /* THÔNG TIN YÊU CẦU SUMMARY BOX FOR ONELINK */
          <div className="p-5 bg-gradient-to-r from-[#fffcf2] via-white to-[#fffcf2] border border-[#ffcc00]/60 rounded-[20px] space-y-3 shadow-sm text-xs">
            <div className="flex items-center justify-between border-b border-[#edce67]/50 pb-2">
              <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[#8a6200]">
                <FileText className="w-4 h-4 text-[#8a6200]" />
                <span>THÔNG TIN YÊU CẦU ONELINK</span>
              </div>
              <span className="duhat-badge yellow text-[10px]">Mới tạo - Chờ xử lý</span>
            </div>

            {/* Template */}
            <div className="text-[#20201c] pb-2 border-b border-[#edce67]/30 flex flex-wrap items-center gap-1.5">
              <span className="text-[#71716a] font-medium">Template OneLink:</span>
              <strong className="font-mono text-[#8a6200] break-all">{oneLinkTemplate || '—'}</strong>
            </div>

            {/* Main Form Fields Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[#20201c]">
              <div><span className="text-[#71716a]">Nguồn đặt link:</span> <strong>{mediaSource || '—'}</strong></div>
              <div><span className="text-[#71716a]">Hình thức:</span> <strong>{channel || '—'}</strong></div>
              <div><span className="text-[#71716a]">Tên chiến dịch:</span> <strong>{campaignName || '—'}</strong></div>
              
              <div><span className="text-[#71716a]">Mã quản lý nội bộ:</span> <strong>{campaignId || '—'}</strong></div>
              <div><span className="text-[#71716a]">Nhóm QC (Ad Set):</span> <strong>{adGroup || '—'}</strong></div>
              <div><span className="text-[#71716a]">Mẫu QC (Ad):</span> <strong>{adName || '—'}</strong></div>

              <div><span className="text-[#71716a]">Khách hàng:</span> <strong>{targetUserLabel}</strong></div>
              <div><span className="text-[#71716a]">Đích đến App:</span> <strong>{deepLinkValue || '—'}</strong></div>
              <div><span className="text-[#71716a]">Đuôi mong muốn:</span> <code className="bg-[#ebd217]/20 px-1 rounded font-mono">{desiredSlug || 'Tự động'}</code></div>
            </div>

            {/* Note & Social Preview Details */}
            {(note || enableSocialPreview) ? (
              <div className="pt-2 border-t border-[#edce67]/40 space-y-2">
                {note && (
                  <div>
                    <span className="text-[#71716a]">Ghi chú / Thông tin phụ: </span>
                    <span className="italic text-[#20201c]">{note}</span>
                  </div>
                )}
                {enableSocialPreview ? (
                  <div className="p-2.5 bg-white/80 rounded-[12px] border border-[#edce67]/50 space-y-1 text-[11px]">
                    <div className="font-extrabold text-[#8a6200]">Hiển thị MXH (Social Preview): <span className="font-semibold text-[#20201c]">Có yêu cầu riêng</span></div>
                    {socialTitle && <div><span className="text-[#71716a]">Tiêu đề:</span> <strong>{socialTitle}</strong></div>}
                    {socialDescription && <div><span className="text-[#71716a]">Mô tả:</span> <strong>{socialDescription}</strong></div>}
                    {socialImageUrl && <div><span className="text-[#71716a]">Link Ảnh:</span> <strong className="font-mono break-all">{socialImageUrl}</strong></div>}
                  </div>
                ) : (
                  <div className="text-[#71716a]">
                    <span>Hiển thị MXH (Social Preview): </span><span className="font-medium text-[#20201c]">Mặc định</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-2 border-t border-[#edce67]/30 text-[#71716a]">
                <span>Hiển thị MXH (Social Preview): </span><span className="font-medium text-[#20201c]">Mặc định</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-auto btn secondary text-xs min-h-[44px] px-4 text-[#b42318] border-[#deded7] hover:bg-[#fff0ed] hover:border-[#fecdca] transition-colors"
            title="Xóa tất cả các ô nhập liệu để bắt đầu điền lại"
          >
            <RotateCcw className="w-4 h-4 text-[#b42318]" />
            <span>Xóa form điền lại</span>
          </button>

          <button type="submit" className="w-full sm:w-auto btn primary min-h-[44px]">
            {activeTab === 'ONELINK' ? (
              <>
                <Send className="w-4 h-4" />
                <span>Gửi yêu cầu OneLink</span>
              </>
            ) : (
              <>
                <span>Xác nhận &amp; tạo link</span>
                <span className="arrow">→</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Result Card for Newly Created Link / Request */}
      {createdLinkRecord && (
        <div className="p-6 color-[#ffffff] bg-[#20201c] border-radius-[18px] space-y-4 rounded-[18px] text-white">
          <div className="flex items-center justify-between">
            <p className="m-0 text-[#c9c9c1] text-[11px] font-black tracking-[0.08em] uppercase">
              {createdLinkRecord.linkType === 'ONELINK' ? 'YÊU CẦU ĐÃ ĐƯỢC LƯU VÀO HỆ THỐNG' : 'LINK VỪA TẠO VÀ ĐỒNG BỘ SHAREPOINT'}
            </p>
            <span className="duhat-badge synced">
              {createdLinkRecord.linkType === 'ONELINK' ? 'Chờ AppsFlyer Admin' : 'Đã đồng bộ'}
            </span>
          </div>

          {createdLinkRecord.finalLink ? (
            <p className="m-0 font-mono text-xs break-all text-white select-all">
              {createdLinkRecord.finalLink}
            </p>
          ) : (
            <div className="text-xs text-[#deded7] space-y-1">
              <div>Mã yêu cầu: <strong className="font-mono text-white">#{createdLinkRecord.id.slice(0, 8)}</strong></div>
              <div>Người yêu cầu: <strong className="text-white">{createdLinkRecord.createdByName}</strong></div>
              <div className="text-[#ebd217] pt-1">👉 Người phụ trách sẽ khởi tạo OneLink trên AppsFlyer Dashboard và cập nhật link hoàn chỉnh vào hệ thống.</div>
            </div>
          )}

          {createdLinkRecord.finalLink && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleCopyLink(createdLinkRecord.finalLink)}
                className="btn yellow"
              >
                <span>{copied ? 'Đã sao chép!' : 'Sao chép link'}</span>
              </button>

              <a
                href={createdLinkRecord.finalLink}
                target="_blank"
                rel="noreferrer"
                className="btn secondary"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Mở link</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteCreate}
        isLoading={isLoading}
        linkType={activeTab}
        originalUrl={activeTab === 'UTM' ? utmUrl : oneLinkTemplate}
        source={activeTab === 'UTM' ? utmSource : mediaSource}
        medium={activeTab === 'UTM' ? utmMedium : channel}
        campaign={activeTab === 'UTM' ? utmCampaign : campaignName}
        previewLink={liveUtmPreview}
        creatorName={currentUser.fullName}
        targetUserLabel={targetUserLabel}
        deepLinkScreenLabel={deepLinkValue}
        campaignId={campaignId}
        adGroup={adGroup}
        adName={adName}
        desiredSlug={desiredSlug}
        note={note}
        socialPreview={enableSocialPreview ? {
          enabled: true,
          title: socialTitle,
          description: socialDescription,
          imageUrl: socialImageUrl,
        } : undefined}
      />
    </div>
  );
}
