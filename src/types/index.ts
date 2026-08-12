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

export type RequestStatus = 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

export type TargetUserType = 'NEW_USER' | 'EXISTING_USER' | 'BOTH';

export interface SocialPreviewConfig {
  enabled: boolean;
  title?: string;
  description?: string;
  imageUrl?: string;
}

export interface LinkRecord {
  id: string;
  linkType: LinkType;
  originalUrl: string;
  finalLink: string;
  linkHash: string;
  
  // Request Status for AppsFlyer OneLink
  status?: RequestStatus;

  // UTM parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmId?: string;
  utmContent?: string;
  utmTerm?: string;
  
  // AppsFlyer parameters & Request Metadata
  mediaSource?: string;
  afChannel?: string;
  afCId?: string;
  afAdset?: string;
  afAd?: string;
  afKeywords?: string;
  deepLinkValue?: string;
  isRetargeting?: boolean;
  
  // New OneLink Request Fields
  targetUser?: TargetUserType;
  desiredSlug?: string;
  socialPreview?: SocialPreviewConfig;
  note?: string;

  // AppsFlyer Admin Processing Info
  processedByUserId?: string;
  processedByName?: string;
  processedAt?: string;

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
  channel: string;
  campaignName: string;
  campaignId?: string;
  adGroup?: string;
  adName?: string;
  keywords?: string;
  targetUser?: TargetUserType;
  deepLinkValue: string;
  desiredSlug?: string;
  socialPreview?: SocialPreviewConfig;
  note?: string;
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
