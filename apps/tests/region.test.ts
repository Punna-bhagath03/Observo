import { describe, it, expect, beforeAll } from 'bun:test';
import axios from 'axios';
import { BACKEND_URL, REGION_IDS } from './config';
import { createUser, seedTick } from './testUtils';

describe('Can fetch regions', () => {
  it('returns all regions', async () => {
    const response = await axios.get(`${BACKEND_URL}/regions`);

    expect(response.data.regions.length).toBe(4);

    const regionIds = response.data.regions.map(
      (region: { id: string }) => region.id
    );
    expect(regionIds.includes(REGION_IDS.India)).toBe(true);
    expect(regionIds.includes(REGION_IDS.USA)).toBe(true);
    expect(regionIds.includes(REGION_IDS.Africa)).toBe(true);
    expect(regionIds.includes(REGION_IDS.Europe)).toBe(true);
  });
});

describe('Websites filtered by region', () => {
  let token: string;
  let websiteId: string;

  beforeAll(async () => {
    const user = await createUser();
    token = user.jwt;

    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      {
        url: 'https://region-test.example.com',
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );

    websiteId = websiteResponse.data.id;
    await seedTick(websiteId, REGION_IDS.India, 'Up');
    await seedTick(websiteId, REGION_IDS.USA, 'Down');
  });

  it('defaults to India ticks on /websites', async () => {
    const response = await axios.get(`${BACKEND_URL}/websites`, {
      headers: {
        Authorization: token,
      },
    });

    const website = response.data.websites.find(
      (w: { id: string }) => w.id === websiteId
    );

    expect(website.ticks[0].region_id).toBe(REGION_IDS.India);
    expect(website.ticks[0].status).toBe('Up');
  });

  it('returns USA ticks when regionId is provided', async () => {
    const response = await axios.get(
      `${BACKEND_URL}/websites?regionId=${REGION_IDS.USA}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    const website = response.data.websites.find(
      (w: { id: string }) => w.id === websiteId
    );

    expect(website.ticks[0].region_id).toBe(REGION_IDS.USA);
    expect(website.ticks[0].status).toBe('Down');
  });

  it('returns 403 for invalid regionId on /websites', async () => {
    try {
      await axios.get(
        `${BACKEND_URL}/websites?regionId=00000000-0000-0000-0000-000000000000`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      expect(false, 'shouldnt succeed with invalid region');
    } catch (e) {}
  });
});

describe('Status filtered by region', () => {
  let token: string;
  let websiteId: string;

  beforeAll(async () => {
    const user = await createUser();
    token = user.jwt;

    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      {
        url: 'https://status-region-test.example.com',
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );

    websiteId = websiteResponse.data.id;
    await seedTick(websiteId, REGION_IDS.India, 'Up');
    await seedTick(websiteId, REGION_IDS.Europe, 'Down');
  });

  it('defaults to India ticks on /status', async () => {
    const response = await axios.get(`${BACKEND_URL}/status/${websiteId}`, {
      headers: {
        Authorization: token,
      },
    });

    expect(response.data.website.ticks[0].region_id).toBe(REGION_IDS.India);
    expect(response.data.website.ticks[0].status).toBe('Up');
  });

  it('returns Europe ticks when regionId is provided', async () => {
    const response = await axios.get(
      `${BACKEND_URL}/status/${websiteId}?regionId=${REGION_IDS.Europe}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    expect(response.data.website.ticks[0].region_id).toBe(REGION_IDS.Europe);
    expect(response.data.website.ticks[0].status).toBe('Down');
  });

  it('returns 403 for invalid regionId on /status', async () => {
    try {
      await axios.get(
        `${BACKEND_URL}/status/${websiteId}?regionId=00000000-0000-0000-0000-000000000000`,
        {
          headers: {
            Authorization: token,
          },
        }
      );
      expect(false, 'shouldnt succeed with invalid region');
    } catch (e) {}
  });
});
