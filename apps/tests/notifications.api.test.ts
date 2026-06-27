import { describe, it, expect, beforeAll } from 'bun:test';
import axios from 'axios';
import { createUser } from './testUtils';
import { BACKEND_URL } from './config';

describe('Notification settings API', () => {
  let token: string;

  beforeAll(async () => {
    const user = await createUser();
    token = user.jwt;
  });

  it('returns default notification settings', async () => {
    const response = await axios.get(`${BACKEND_URL}/notifications/settings`, {
      headers: { Authorization: token },
    });

    expect(response.data.email.address).toBeNull();
    expect(response.data.email.rules['incident.opened']).toBe(true);
    expect(response.data.webhook.url).toBeNull();
    expect(response.data.webhook.enabled).toBe(false);
    expect(response.data.webhook.hasSecret).toBe(false);
  });

  it('updates email notification preferences', async () => {
    const response = await axios.patch(
      `${BACKEND_URL}/notifications/settings`,
      {
        email: {
          address: 'alerts@example.com',
          rules: {
            'incident.opened': true,
            'incident.acknowledged': true,
            'incident.resolved': false,
          },
        },
      },
      { headers: { Authorization: token } }
    );

    expect(response.data.email.address).toBe('alerts@example.com');
    expect(response.data.email.rules['incident.acknowledged']).toBe(true);
    expect(response.data.email.rules['incident.resolved']).toBe(false);
  });

  it('updates webhook notification preferences and returns secret once', async () => {
    const response = await axios.patch(
      `${BACKEND_URL}/notifications/settings`,
      {
        webhook: {
          url: 'https://example.com/observo/webhook',
          rules: {
            'incident.opened': true,
            'incident.acknowledged': false,
            'incident.resolved': true,
          },
        },
      },
      { headers: { Authorization: token } }
    );

    expect(response.data.webhook.url).toBe(
      'https://example.com/observo/webhook'
    );
    expect(response.data.webhook.enabled).toBe(true);
    expect(response.data.webhook.hasSecret).toBe(true);
    expect(response.data.webhookSecret).toMatch(/^[a-f0-9]{64}$/);

    const followUp = await axios.get(`${BACKEND_URL}/notifications/settings`, {
      headers: { Authorization: token },
    });

    expect(followUp.data.webhook.hasSecret).toBe(true);
    expect(followUp.data.webhookSecret).toBeUndefined();
  });

  it('rejects insecure webhook urls', async () => {
    try {
      await axios.patch(
        `${BACKEND_URL}/notifications/settings`,
        {
          webhook: {
            url: 'http://example.com/webhook',
            rules: {
              'incident.opened': true,
              'incident.acknowledged': false,
              'incident.resolved': true,
            },
          },
        },
        { headers: { Authorization: token } }
      );
      expect(false, 'Expected webhook validation failure');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        expect(error.response?.status).toBe(403);
      }
    }
  });

  it('requires auth', async () => {
    try {
      await axios.get(`${BACKEND_URL}/notifications/settings`);
      expect(false, 'Expected auth failure');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        expect(error.response?.status).toBe(403);
      }
    }
  });
});
