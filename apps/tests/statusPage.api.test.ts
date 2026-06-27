import { describe, it, expect, beforeAll } from 'bun:test';
import axios from 'axios';
import { createUser, seedTickWithIncident } from './testUtils';
import { BACKEND_URL, REGION_IDS } from './config';

describe('Public status page API', () => {
  let token: string;
  let websiteId: string;

  beforeAll(async () => {
    const user = await createUser();
    token = user.jwt;

    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://status-example.test' },
      { headers: { Authorization: token } }
    );

    websiteId = websiteResponse.data.id;

    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Up');
  });

  it('returns 404 when page is disabled', async () => {
    try {
      await axios.get(`${BACKEND_URL}/public/status/example`);
      expect(false, 'Expected 404');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        expect(error.response?.status).toBe(404);
      }
    }
  });

  it('enables a public status page for the owner', async () => {
    const patchResponse = await axios.patch(
      `${BACKEND_URL}/website/${websiteId}/status-page`,
      { enabled: true, slug: 'status-example-test' },
      { headers: { Authorization: token } }
    );

    expect(patchResponse.data.status_page_enabled).toBe(true);
    expect(patchResponse.data.status_page_slug).toBe('status-example-test');

    const publicResponse = await axios.get(
      `${BACKEND_URL}/public/status/status-example-test`
    );

    expect(publicResponse.data.url).toBe('https://status-example.test');
    expect(publicResponse.data.slug).toBe('status-example-test');
    expect(publicResponse.data.monitor.status).toBeDefined();
    expect(publicResponse.data.periodStats.length).toBeGreaterThan(0);
    expect(publicResponse.data.incidents[0]).not.toHaveProperty(
      'acknowledged_by'
    );
  });

  it('returns region-specific monitor data', async () => {
    await axios.patch(
      `${BACKEND_URL}/website/${websiteId}/status-page`,
      { enabled: true, slug: 'status-example-test' },
      { headers: { Authorization: token } }
    );

    await seedTickWithIncident(websiteId, REGION_IDS.Europe, 'Down');

    const indiaResponse = await axios.get(
      `${BACKEND_URL}/public/status/status-example-test?regionId=${REGION_IDS.India}`
    );
    const europeResponse = await axios.get(
      `${BACKEND_URL}/public/status/status-example-test?regionId=${REGION_IDS.Europe}`
    );

    expect(indiaResponse.data.region).toBe('India');
    expect(europeResponse.data.region).toBe('Europe');
    expect(indiaResponse.data.monitor.status).toBe('Up');
    expect(europeResponse.data.monitor.status).toBe('Down');
  });

  it('rejects invalid slug updates', async () => {
    try {
      await axios.patch(
        `${BACKEND_URL}/website/${websiteId}/status-page`,
        { enabled: true, slug: '-invalid-' },
        { headers: { Authorization: token } }
      );
      expect(false, 'Expected invalid slug rejection');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        expect(error.response?.status).toBe(403);
      }
    }
  });

  it('requires auth to update status page settings', async () => {
    try {
      await axios.patch(`${BACKEND_URL}/website/${websiteId}/status-page`, {
        enabled: false,
      });
      expect(false, 'Expected auth failure');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        expect(error.response?.status).toBe(403);
      }
    }
  });
});
