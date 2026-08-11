export type UserRole = 'ADMIN' | 'MEMBER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export type LinkType = 'UTM' | 'ONELINK';

export type SyncStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface LinkRecord {
  id: string;
  linkType: LinkType;
  originalUrl: string;
  finalLink: string;
  linkHash: string;
  
  // UTM parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmId?: string;
  utmContent?: string;
  utmTerm?: string;
  
  // AppsFlyer parameters
  mediaSource?: string;
  afChannel?: string;
  afCId?: string;
  afAdset?: string;
  afAd?: string;
  afKeywords?: string;
  deepLinkValue?: string;
  isRetargeting?: boolean;

  // Creator Info
  createdByUserId: string;
  createdByName: string;
  createdByEmail: string;
  
  // SharePoint Sync
  syncStatus: SyncStatus;
  syncAttempts: number;
  lastSyncError?: string;
  syncedAt?: string;

  createdAt: string;
}

export interface CatalogItem {
  id: string;
  linkType: 'UTM' | 'ONELINK' | 'BOTH';
  categoryType: string;
  value: string;
  description?: string; // "Dùng khi" / "Ý nghĩa"
  isStrict: boolean; // true = Chỉ chọn trong danh sách; false = Điền tự do
  usageCount: number;
  lastUsedAt: string;
  createdByUserId?: string;
}

export interface UtmInputParams {
  originalUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmId?: string;
  utmContent?: string;
  utmTerm?: string;
}

export interface OneLinkInputParams {
  oneLinkTemplate: string;
  mediaSource: string;
  campaignName: string;
  channel?: string;
  campaignId?: string;
  adGroup?: string;
  adName?: string;
  keywords?: string;
  deepLinkValue?: string;
  isRetargeting?: boolean;
}

export interface DuplicateLinkErrorResponse {
  error: string;
  isDuplicate: true;
  existingRecord: {
    finalLink: string;
    createdByName: string;
    createdByEmail: string;
    createdAt: string;
  };
}
