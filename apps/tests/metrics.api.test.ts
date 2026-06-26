import { describe, it, expect, beforeAll } from 'bun:test';
import axios from 'axios';
import { BACKEND_URL, REGION_IDS } from './config';
import { createUser, seedTickAt, seedTickWithIncident } from './testUtils';

describe('Metrics API', () => {
  let token: string;
  let otherToken: string;
  let websiteId: string;

  beforeAll(async () => {
    const user = await createUser();
    const otherUser = await createUser();
    token = user.jwt;
    otherToken = otherUser.jwt;

    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://metrics-api.example.com' },
      { headers: { Authorization: token } }
    );
    websiteId = websiteResponse.data.id;

    const downAt = new Date(Date.now() - 45 * 60_000);
    const recoveredAt = new Date(Date.now() - 20 * 60_000);

    await seedTickAt(websiteId, REGION_IDS.India, 'Down', downAt, 150);
    await seedTickAt(websiteId, REGION_IDS.India, 'Up', recoveredAt, 200);
    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Down');
    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Down');
    await seedTickAt(websiteId, REGION_IDS.India, 'Up', new Date(), 180);
  });

  it('returns metrics for a preset range', async () => {
    const response = await axios.get(
      `${BACKEND_URL}/status/${websiteId}/metrics?regionId=${REGION_IDS.India}&range=day`,
      { headers: { Authorization: token } }
    );

    expect(response.data.monitor.status).toBe('Up');
    expect(response.data.monitor.upForMs).not.toBeNull();
    expect(response.data.monitor.checkIntervalMinutes).toBe(3);
    expect(response.data.graph.range).toBe('day');
    expect(response.data.graph.points.length).toBeGreaterThan(0);
    expect(response.data.periodStats.length).toBe(5);
    expect(response.data.customStats).toBeNull();
  });

  it('returns custom stats for a custom range', async () => {
    const from = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    const to = new Date().toISOString();

    const response = await axios.get(
      `${BACKEND_URL}/status/${websiteId}/metrics?regionId=${REGION_IDS.India}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { headers: { Authorization: token } }
    );

    expect(response.data.graph.range).toBe('custom');
    expect(response.data.periodStats.length).toBe(0);
    expect(response.data.customStats).not.toBeNull();
    expect(response.data.customStats.label).toMatch(/^Since .+ until today$/);
    expect(response.data.customStats.incidents).toBeGreaterThanOrEqual(1);
  });

  it('returns stats-only period row for custom range', async () => {
    const from = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    const to = new Date().toISOString();

    const response = await axios.get(
      `${BACKEND_URL}/status/${websiteId}/metrics?regionId=${REGION_IDS.India}&statsOnly=true&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { headers: { Authorization: token } }
    );

    expect(response.data.periodStat).toBeDefined();
    expect(response.data.periodStat.label).toMatch(/^Since .+ until today$/);
    expect(response.data.periodStat.availability).toBeGreaterThanOrEqual(0);
    expect(response.data.graph).toBeUndefined();
  });

  it('returns empty graph buckets when no ticks exist in range', async () => {
    const user = await createUser();
    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://metrics-empty.example.com' },
      { headers: { Authorization: user.jwt } }
    );

    const response = await axios.get(
      `${BACKEND_URL}/status/${websiteResponse.data.id}/metrics?regionId=${REGION_IDS.India}&range=hour`,
      { headers: { Authorization: user.jwt } }
    );

    expect(response.data.monitor.status).toBe('checking');
    expect(response.data.graph.points.length).toBeGreaterThan(0);
    expect(response.data.periodStats[0].availability).toBe(100);
  });

  it('rejects invalid range parameters', async () => {
    try {
      await axios.get(
        `${BACKEND_URL}/status/${websiteId}/metrics?regionId=${REGION_IDS.India}&range=year`,
        { headers: { Authorization: token } }
      );
      expect(false, 'invalid range should fail');
    } catch (e) {}
  });

  it('rejects invalid regionId', async () => {
    try {
      await axios.get(
        `${BACKEND_URL}/status/${websiteId}/metrics?regionId=00000000-0000-0000-0000-000000000000&range=day`,
        { headers: { Authorization: token } }
      );
      expect(false, 'invalid region should fail');
    } catch (e) {}
  });

  it('blocks access for another user', async () => {
    try {
      await axios.get(
        `${BACKEND_URL}/status/${websiteId}/metrics?regionId=${REGION_IDS.India}&range=day`,
        { headers: { Authorization: otherToken } }
      );
      expect(false, 'other user should not access metrics');
    } catch (e) {}
  });
});
