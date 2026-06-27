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

    expect(response.data.email).toBeNull();
    expect(response.data.rules['incident.opened']).toBe(true);
    expect(response.data.rules['incident.acknowledged']).toBe(false);
    expect(response.data.rules['incident.resolved']).toBe(true);
  });

  it('updates email notification preferences', async () => {
    const response = await axios.patch(
      `${BACKEND_URL}/notifications/settings`,
      {
        email: 'alerts@example.com',
        rules: {
          'incident.opened': true,
          'incident.acknowledged': true,
          'incident.resolved': false,
        },
      },
      { headers: { Authorization: token } }
    );

    expect(response.data.email).toBe('alerts@example.com');
    expect(response.data.rules['incident.acknowledged']).toBe(true);
    expect(response.data.rules['incident.resolved']).toBe(false);
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
