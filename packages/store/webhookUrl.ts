const BLOCKED_HOSTNAMES = new Set(['metadata.google.internal']);

function isPrivateIpv4(part: string): boolean {
  const octets = part.split('.').map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value))) {
    return false;
  }

  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, '');

  if (BLOCKED_HOSTNAMES.has(normalized) || normalized.endsWith('.internal')) {
    return true;
  }

  if (normalized === 'localhost' || normalized.endsWith('.localhost')) {
    return false;
  }

  if (normalized.includes(':')) {
    return normalized === '::1';
  }

  return isPrivateIpv4(normalized);
}

export function validateWebhookUrl(rawUrl: string): string {
  let url: URL;

  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new Error('Webhook URL is invalid');
  }

  if (url.username || url.password) {
    throw new Error('Webhook URL must not include credentials');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Webhook URL must use HTTP or HTTPS');
  }

  const hostname = url.hostname.toLowerCase();
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1';

  if (url.protocol === 'http:' && !isLocalhost) {
    throw new Error('Webhook URL must use HTTPS');
  }

  if (isBlockedHostname(hostname)) {
    throw new Error('Webhook URL is not allowed');
  }

  return url.toString();
}
