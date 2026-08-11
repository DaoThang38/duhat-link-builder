import { LinkRecord } from '@/types';
import { updateLinkSyncStatus } from '@/lib/db';

/**
 * Parses SharePoint / OneDrive share link to extract Item ID (sourcedoc GUID)
 * Example: sourcedoc=%7B2af077e1-811a-4a78-b29c-419855ca3c05%7D -> 2af077e1-811a-4a78-b29c-419855ca3c05
 */
export function extractSharePointItemId(url: string): string | null {
  try {
    const match = url.match(/sourcedoc=%7B([a-f0-9\-]+)%7D/i) || url.match(/sourcedoc=\{([a-f0-9\-]+)\}/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Triggers sync of newly created link record into SharePoint Excel.
 * Supports:
 * 1. Power Automate HTTP Webhook (Recommended & Easiest, zero Azure App setup needed)
 * 2. Microsoft Graph API (Direct App Integration using Tenant/Client Secret)
 */
export async function syncLinkToSharePoint(record: LinkRecord): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.POWER_AUTOMATE_WEBHOOK_URL;
  const azureTenantId = process.env.AZURE_TENANT_ID;
  const azureClientId = process.env.AZURE_CLIENT_ID;
  const azureClientSecret = process.env.AZURE_CLIENT_SECRET;
  const sharepointFileUrl = process.env.SHAREPOINT_EXCEL_URL || 'https://vingroupjsc-my.sharepoint.com/:x:/r/personal/huytd33_vingroup_net/_layouts/15/Doc.aspx?sourcedoc=%7B2af077e1-811a-4a78-b29c-419855ca3c05%7D';

  const payload = {
    id: record.id,
    linkType: record.linkType,
    originalUrl: record.originalUrl,
    finalLink: record.finalLink,
    linkHash: record.linkHash,
    source: record.utmSource || record.mediaSource || '',
    medium: record.utmMedium || record.afChannel || '',
    campaign: record.utmCampaign || record.afAdset || '',
    adName: record.utmContent || record.afAd || '',
    createdByName: record.createdByName,
    createdByEmail: record.createdByEmail,
    createdAt: new Date(record.createdAt).toLocaleString('vi-VN'),
  };

  // METHOD 1: Power Automate Webhook (If configured)
  if (webhookUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        await updateLinkSyncStatus(record.id, 'SUCCESS');
        return { success: true };
      } else {
        const errText = await response.text().catch(() => response.statusText);
        const msg = `Power Automate Webhook trả về lỗi HTTP ${response.status}: ${errText}`;
        await updateLinkSyncStatus(record.id, 'FAILED', msg);
        return { success: false, error: msg };
      }
    } catch (err: any) {
      const msg = err.name === 'AbortError' ? 'Hết thời gian chờ phản hồi (Timeout 10s).' : err.message || 'Lỗi kết nối Webhook SharePoint.';
      await updateLinkSyncStatus(record.id, 'FAILED', msg);
      return { success: false, error: msg };
    }
  }

  // METHOD 2: Microsoft Graph API (If Azure credentials are present)
  if (azureTenantId && azureClientId && azureClientSecret) {
    try {
      // 1. Get OAuth Access Token from Microsoft Entra / Azure AD
      const tokenRes = await fetch(`https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: azureClientId,
          client_secret: azureClientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      });

      if (!tokenRes.ok) {
        throw new Error(`Xác thực Azure AD thất bại: ${tokenRes.statusText}`);
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // 2. Extract item ID from SharePoint file URL
      const itemId = extractSharePointItemId(sharepointFileUrl) || '2af077e1-811a-4a78-b29c-419855ca3c05';

      // 3. Append row directly to Excel table via Graph API
      const graphRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${itemId}/workbook/tables/Table1/rows/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[
            payload.createdAt,
            payload.createdByName,
            payload.createdByEmail,
            payload.linkType,
            payload.source,
            payload.medium,
            payload.campaign,
            payload.adName,
            payload.finalLink,
          ]],
        }),
      });

      if (graphRes.ok) {
        await updateLinkSyncStatus(record.id, 'SUCCESS');
        return { success: true };
      } else {
        const errJson = await graphRes.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Lỗi Microsoft Graph API ${graphRes.status}`);
      }
    } catch (err: any) {
      const msg = `Lỗi đồng bộ Microsoft Graph API: ${err.message}`;
      await updateLinkSyncStatus(record.id, 'FAILED', msg);
      return { success: false, error: msg };
    }
  }

  // Fallback info if no integration is configured yet
  const msg = 'Chưa thiết lập biến môi trường POWER_AUTOMATE_WEBHOOK_URL hoặc AZURE_CLIENT_ID.';
  await updateLinkSyncStatus(record.id, 'FAILED', msg);
  return { success: false, error: msg };
}
