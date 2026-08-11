'use client';

import React, { useState, useMemo } from 'react';
import { LinkType, User, DuplicateLinkErrorResponse } from '@/types';
import AutocompleteInput from './AutocompleteInput';
import UrlAutocompleteInput from './UrlAutocompleteInput';
import ConfirmModal from './ConfirmModal';
import { generateUtmUrl, generateOneLinkUrl } from '@/lib/link-generator';
import { Copy, Check, AlertCircle, ExternalLink, Link as LinkIcon, Sparkles, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';

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

  // Form Fields - AppsFlyer OneLink
  const DEFAULT_ONELINK_TEMPLATE = process.env.NEXT_PUBLIC_ONELINK_DEFAULT_TEMPLATE || 'https://duhat.onelink.me/abc1';
  const [oneLinkTemplate, setOneLinkTemplate] = useState(DEFAULT_ONELINK_TEMPLATE);
  const [mediaSource, setMediaSource] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [channel, setChannel] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [adGroup, setAdGroup] = useState('');
  const [adName, setAdName] = useState('');
  const [keywords, setKeywords] = useState('');
  const [deepLinkValue, setDeepLinkValue] = useState('');
  const [isRetargeting, setIsRetargeting] = useState(false);

  // Real-time Preview Calculation
  const livePreview = useMemo(() => {
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
      } else {
        if (!oneLinkTemplate && !mediaSource && !campaignName) return '';
        return generateOneLinkUrl({
          oneLinkTemplate: oneLinkTemplate || DEFAULT_ONELINK_TEMPLATE,
          mediaSource: mediaSource || '',
          campaignName: campaignName || '',
          channel: channel || undefined,
          campaignId: campaignId || undefined,
          adGroup: adGroup || undefined,
          adName: adName || undefined,
          keywords: keywords || undefined,
          deepLinkValue: deepLinkValue || undefined,
          isRetargeting,
        });
      }
    } catch {
      return '';
    }
  }, [
    activeTab,
    utmUrl,
    utmSource,
    utmMedium,
    utmCampaign,
    utmId,
    utmContent,
    utmTerm,
    oneLinkTemplate,
    mediaSource,
    campaignName,
    channel,
    campaignId,
    adGroup,
    adName,
    keywords,
    deepLinkValue,
    isRetargeting,
  ]);

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
    setCampaignName('');
    setChannel('');
    setCampaignId('');
    setAdGroup('');
    setAdName('');
    setKeywords('');
    setDeepLinkValue('');
    setIsRetargeting(false);

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
      if (!oneLinkTemplate.trim() || !mediaSource.trim() || !campaignName.trim()) {
        setErrorMessage('Vui lòng điền đủ các trường bắt buộc có dấu * (Template, Media Source, Tên chiến dịch).');
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
          campaignName,
          channel,
          campaignId,
          adGroup,
          adName,
          keywords,
          deepLinkValue,
          isRetargeting,
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
        setErrorMessage(data.error || 'Tạo link thất bại.');
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
          <span className="text-xs text-[#71716a] font-medium">Người tạo: </span>
          <span className="font-extrabold text-xs text-[#20201c]">{currentUser.fullName}</span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {createdLinkRecord && (
        <div className="p-4 bg-[#eaf8ef] border border-[#176b46]/30 rounded-[14px] text-[#176b46] font-bold text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#176b46]" />
            <span>🎉 Tạo link thành công! Link đã được kiểm tra trùng lặp và lưu vào hệ thống.</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleCopyLink(createdLinkRecord.finalLink)}
              className="btn yellow text-xs min-h-[34px] px-3.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? 'Đã sao chép!' : 'Sao chép link'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="btn secondary text-xs min-h-[34px] px-3 bg-white"
              title="Xóa nhanh form để tạo link tiếp theo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tạo link tiếp</span>
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
            <span>Link này đã được {duplicateInfo.createdByName} tạo lúc {new Date(duplicateInfo.createdAt).toLocaleTimeString('vi-VN')}</span>
          </div>
          <div className="bg-white p-3.5 rounded-[12px] border border-[#deded7] text-xs space-y-1 font-mono">
            <div><span className="text-[#71716a]">Link cũ: </span><span className="font-bold text-[#20201c] break-all">{duplicateInfo.finalLink}</span></div>
            <div><span className="text-[#71716a]">Email người tạo: </span><span>{duplicateInfo.createdByEmail}</span></div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleCopyLink(duplicateInfo.finalLink)}
              className="btn yellow text-xs min-h-[38px] px-4"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép link cũ</span>
            </button>
            <a
              href={duplicateInfo.finalLink}
              target="_blank"
              rel="noreferrer"
              className="btn secondary text-xs min-h-[38px] px-4"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở link</span>
            </a>
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
          /* AppsFlyer OneLink Form */
          <div className="space-y-5">
            <UrlAutocompleteInput
              label="OneLink Template"
              linkType="ONELINK"
              value={oneLinkTemplate}
              onChange={setOneLinkTemplate}
              required
              placeholder="https://duhat.onelink.me/abc1"
              helpText="Link mẫu AppsFlyer được cấu hình sẵn. Tự động gợi ý các Template OneLink."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AutocompleteInput
                label="Media Source (pid)"
                categoryType="media_source"
                linkType="ONELINK"
                value={mediaSource}
                onChange={setMediaSource}
                required
                placeholder="facebook_ads, tiktok_ads..."
                helpText="Tham số pid."
              />
              <AutocompleteInput
                label="Tên chiến dịch (c)"
                categoryType="campaign_name"
                linkType="ONELINK"
                value={campaignName}
                onChange={setCampaignName}
                required
                placeholder="app_install_2026..."
                helpText="Tham số c."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#deded7]">
              <AutocompleteInput
                label="Kênh (af_channel)"
                categoryType="channel"
                linkType="ONELINK"
                value={channel}
                onChange={setChannel}
                placeholder="paid_social..."
              />
              <AutocompleteInput
                label="ID Chiến dịch (af_c_id)"
                categoryType="campaign_id"
                linkType="ONELINK"
                value={campaignId}
                onChange={setCampaignId}
                placeholder="c_1029..."
              />
              <AutocompleteInput
                label="Nhóm QC (af_adset)"
                categoryType="ad_group"
                linkType="ONELINK"
                value={adGroup}
                onChange={setAdGroup}
                placeholder="adset_genz..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AutocompleteInput
                label="Mẫu Quảng Cáo (af_ad)"
                categoryType="ad_name"
                linkType="ONELINK"
                value={adName}
                onChange={setAdName}
                placeholder="video_review..."
              />
              <AutocompleteInput
                label="Màn Hình App (deep_link_value)"
                categoryType="deep_link_screen"
                linkType="ONELINK"
                value={deepLinkValue}
                onChange={setDeepLinkValue}
                placeholder="create_poll, home..."
              />
              <div className="flex items-center pt-7 space-x-2">
                <input
                  type="checkbox"
                  id="retargetingCheck"
                  checked={isRetargeting}
                  onChange={(e) => setIsRetargeting(e.target.checked)}
                  className="w-4 h-4 accent-[#20201c]"
                />
                <label htmlFor="retargetingCheck" className="text-xs font-extrabold text-[#20201c] cursor-pointer">
                  Retargeting Campaign (is_retargeting)
                </label>
              </div>
            </div>
          </div>
        )}

        {/* DÒNG LINK DỰ KIẾN (LIVE EXPECTED LINK PREVIEW ROW) */}
        <div className="p-5 bg-gradient-to-r from-[#fffcf2] via-white to-[#fffcf2] border border-[#ffcc00]/60 rounded-[20px] space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-[#8a6200]">
              <LinkIcon className="w-4 h-4 text-[#8a6200]" />
              <span>LINK DỰ KIẾN</span>
              <span className="w-2 h-2 rounded-full bg-[#176b46] animate-pulse"></span>
            </div>

            {livePreview && (
              <button
                type="button"
                onClick={() => handleCopyPreview(livePreview)}
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

          {livePreview ? (
            <p className="m-0 font-mono text-xs sm:text-sm font-bold text-[#20201c] break-all select-all leading-relaxed pt-1">
              {livePreview}
            </p>
          ) : (
            <p className="m-0 font-sans text-xs text-[#71716a] italic pt-1">
              Bắt đầu nhập thông tin ở trên để tạo và cập nhật link dự kiến theo thời gian thực...
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleResetForm}
            className="w-full sm:w-auto btn secondary text-xs min-h-[44px] px-4 text-[#b42318] border-[#deded7] hover:bg-[#fff0ed] hover:border-[#fecdca] transition-colors"
            title="Xóa tất cả các ô nhập liệu để bắt đầu điền link mới"
          >
            <RotateCcw className="w-4 h-4 text-[#b42318]" />
            <span>Xóa form để điền link tiếp</span>
          </button>

          <button type="submit" className="w-full sm:w-auto btn primary min-h-[44px]">
            <span>Xác nhận &amp; tạo link</span>
            <span className="arrow">→</span>
          </button>
        </div>
      </form>

      {/* Result Card for Newly Created Link */}
      {createdLinkRecord && (
        <div className="p-6 color-[#ffffff] bg-[#20201c] border-radius-[18px] space-y-4 rounded-[18px] text-white">
          <div className="flex items-center justify-between">
            <p className="m-0 text-[#c9c9c1] text-[11px] font-black tracking-[0.08em] uppercase">
              LINK VỪA TẠO VÀ ĐỒNG BỘ SHAREPOINT
            </p>
            <span className="duhat-badge synced">Đã đồng bộ</span>
          </div>

          <p className="m-0 font-mono text-xs break-all text-white select-all">
            {createdLinkRecord.finalLink}
          </p>

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
        previewLink={livePreview}
        creatorName={currentUser.fullName}
      />
    </div>
  );
}
