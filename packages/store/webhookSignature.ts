import { createHmac, timingSafeEqual } from 'node:crypto';

const SIGNATURE_HEADER = /^t=(\d+),v1=([a-f0-9]{64})$/;

export function generateWebhookSecret(): string {
  return crypto.getRandomValues(new Uint8Array(32)).reduce(
    (hex, byte) => hex + byte.toString(16).padStart(2, '0'),
    ''
  );
}

export function signWebhookPayload(
  secret: string,
  timestamp: number,
  body: string
): string {
  return createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex');
}

export function formatWebhookSignatureHeader(
  timestamp: number,
  signature: string
): string {
  return `t=${timestamp},v1=${signature}`;
}

export function verifyWebhookSignature(input: {
  secret: string;
  signatureHeader: string;
  body: string;
  toleranceSeconds?: number;
  now?: number;
}): boolean {
  const match = SIGNATURE_HEADER.exec(input.signatureHeader.trim());
  if (!match) {
    return false;
  }

  const timestamp = Number(match[1]);
  const provided = match[2];
  if (!Number.isFinite(timestamp) || !provided) {
    return false;
  }

  const now = input.now ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? 300;
  if (Math.abs(now - timestamp) > tolerance) {
    return false;
  }

  const expected = signWebhookPayload(input.secret, timestamp, input.body);
  return timingSafeEqualHex(provided, expected);
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
