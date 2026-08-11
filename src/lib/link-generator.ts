import { UtmInputParams, OneLinkInputParams } from '@/types';

/**
 * Generates a full Google UTM URL, supporting base URLs with or without existing query params.
 */
export function generateUtmUrl(params: UtmInputParams): string {
  const { originalUrl, utmSource, utmMedium, utmCampaign, utmId, utmContent, utmTerm } = params;

  let urlObj: URL;
  try {
    let formattedBase = originalUrl.trim();
    if (!formattedBase.startsWith('http://') && !formattedBase.startsWith('https://')) {
      formattedBase = `https://${formattedBase}`;
    }
    urlObj = new URL(formattedBase);
  } catch (e) {
    throw new Error('URL không hợp lệ. Vui lòng kiểm tra lại URL web/landing page.');
  }

  // Set required parameters
  if (utmSource) urlObj.searchParams.set('utm_source', utmSource.trim());
  if (utmMedium) urlObj.searchParams.set('utm_medium', utmMedium.trim());
  if (utmCampaign) urlObj.searchParams.set('utm_campaign', utmCampaign.trim());

  // Set optional parameters
  if (utmId && utmId.trim()) urlObj.searchParams.set('utm_id', utmId.trim());
  if (utmContent && utmContent.trim()) urlObj.searchParams.set('utm_content', utmContent.trim());
  if (utmTerm && utmTerm.trim()) urlObj.searchParams.set('utm_term', utmTerm.trim());

  return urlObj.toString();
}

/**
 * Generates AppsFlyer OneLink URL with standard parameters
 */
export function generateOneLinkUrl(params: OneLinkInputParams): string {
  const {
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
  } = params;

  let urlObj: URL;
  try {
    let formattedTemplate = oneLinkTemplate.trim();
    if (!formattedTemplate.startsWith('http://') && !formattedTemplate.startsWith('https://')) {
      formattedTemplate = `https://${formattedTemplate}`;
    }
    urlObj = new URL(formattedTemplate);
  } catch (e) {
    throw new Error('Link AppsFlyer Template không hợp lệ. Ví dụ: https://duhat.onelink.me/abc1');
  }

  // Required AppsFlyer Query Params
  urlObj.searchParams.set('pid', mediaSource.trim());
  urlObj.searchParams.set('c', campaignName.trim());

  // Optional AppsFlyer Query Params
  if (channel && channel.trim()) urlObj.searchParams.set('af_channel', channel.trim());
  if (campaignId && campaignId.trim()) urlObj.searchParams.set('af_c_id', campaignId.trim());
  if (adGroup && adGroup.trim()) urlObj.searchParams.set('af_adset', adGroup.trim());
  if (adName && adName.trim()) urlObj.searchParams.set('af_ad', adName.trim());
  if (keywords && keywords.trim()) urlObj.searchParams.set('af_keywords', keywords.trim());
  if (deepLinkValue && deepLinkValue.trim()) urlObj.searchParams.set('deep_link_value', deepLinkValue.trim());

  if (isRetargeting) {
    urlObj.searchParams.set('is_retargeting', 'true');
  }

  return urlObj.toString();
}
