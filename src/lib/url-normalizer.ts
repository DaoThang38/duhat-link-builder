import crypto from 'crypto';

/**
 * Normalizes a URL string for consistent hashing and exact duplicate detection.
 * Standardizes:
 * - Scheme & hostname to lowercase
 * - Strip default ports (:80, :443)
 * - Strip trailing slashes on empty paths
 * - Sort query parameter keys alphabetically
 */
export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  const trimmed = rawUrl.trim();

  try {
    const parsed = new URL(trimmed);

    // 1. Lowercase scheme and hostname
    parsed.protocol = parsed.protocol.toLowerCase();
    parsed.hostname = parsed.hostname.toLowerCase();

    // 2. Strip default ports
    if (
      (parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')
    ) {
      parsed.port = '';
    }

    // 3. Normalize pathname (strip trailing slash if length > 1)
    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;

    // 4. Sort search parameters alphabetically by key, then by value
    const params = Array.from(parsed.searchParams.entries());
    params.sort((a, b) => {
      if (a[0] === b[0]) {
        return a[1].localeCompare(b[1]);
      }
      return a[0].localeCompare(b[0]);
    });

    // Reconstruct search string
    const searchParams = new URLSearchParams();
    params.forEach(([key, val]) => searchParams.append(key, val));
    
    parsed.search = searchParams.toString() ? `?${searchParams.toString()}` : '';

    return parsed.toString();
  } catch (err) {
    // If URL parsing fails (e.g. custom deep links like myapp://screen), fallback to clean trim and lowercase protocol/domain if possible
    return trimmed;
  }
}

/**
 * Generates SHA-256 hash string from normalized URL
 */
export function computeLinkHash(rawUrl: string): string {
  const normalized = normalizeUrl(rawUrl);
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}
