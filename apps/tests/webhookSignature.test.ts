import { describe, it, expect } from 'bun:test';
import {
  formatWebhookSignatureHeader,
  generateWebhookSecret,
  signWebhookPayload,
  verifyWebhookSignature,
} from 'store/webhookSignature';

describe('webhookSignature', () => {
  it('generates a 64 character hex secret', () => {
    const secret = generateWebhookSecret();
    expect(secret).toMatch(/^[a-f0-9]{64}$/);
  });

  it('signs and verifies payload with timestamp tolerance', () => {
    const secret = generateWebhookSecret();
    const body = JSON.stringify({ id: 'evt-1', type: 'incident.opened' });
    const timestamp = 1_700_000_000;
    const signature = signWebhookPayload(secret, timestamp, body);
    const header = formatWebhookSignatureHeader(timestamp, signature);

    expect(
      verifyWebhookSignature({
        secret,
        signatureHeader: header,
        body,
        now: timestamp,
      })
    ).toBe(true);
  });

  it('rejects tampered body', () => {
    const secret = generateWebhookSecret();
    const body = JSON.stringify({ id: 'evt-1' });
    const timestamp = 1_700_000_000;
    const signature = signWebhookPayload(secret, timestamp, body);

    expect(
      verifyWebhookSignature({
        secret,
        signatureHeader: formatWebhookSignatureHeader(timestamp, signature),
        body: JSON.stringify({ id: 'evt-2' }),
        now: timestamp,
      })
    ).toBe(false);
  });

  it('rejects stale timestamps', () => {
    const secret = generateWebhookSecret();
    const body = JSON.stringify({ id: 'evt-1' });
    const timestamp = 1_700_000_000;
    const signature = signWebhookPayload(secret, timestamp, body);

    expect(
      verifyWebhookSignature({
        secret,
        signatureHeader: formatWebhookSignatureHeader(timestamp, signature),
        body,
        now: timestamp + 600,
        toleranceSeconds: 300,
      })
    ).toBe(false);
  });
});
