import { describe, it, expect } from 'bun:test';
import { validateWebhookUrl } from 'store/webhookUrl';

describe('validateWebhookUrl', () => {
  it('accepts public https urls', () => {
    expect(validateWebhookUrl('https://example.com/hooks/observo')).toBe(
      'https://example.com/hooks/observo'
    );
  });

  it('accepts localhost http for development', () => {
    expect(validateWebhookUrl('http://localhost:3000/webhook')).toBe(
      'http://localhost:3000/webhook'
    );
  });

  it('rejects non-https public urls', () => {
    expect(() => validateWebhookUrl('http://example.com/webhook')).toThrow(
      'Webhook URL must use HTTPS'
    );
  });

  it('rejects private network targets', () => {
    expect(() => validateWebhookUrl('https://192.168.1.10/webhook')).toThrow(
      'Webhook URL is not allowed'
    );
  });

  it('rejects urls with credentials', () => {
    expect(() =>
      validateWebhookUrl('https://user:pass@example.com/webhook')
    ).toThrow('Webhook URL must not include credentials');
  });
});
