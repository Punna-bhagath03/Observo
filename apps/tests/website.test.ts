import { describe, it, expect, beforeAll } from 'bun:test';
import axios from 'axios';
import { createUser, seedTick } from './testUtils';
import { BACKEND_URL, REGION_IDS } from './config';

describe('Website gets created', () => {
  let token: string;

  beforeAll(async () => {
    const data = await createUser();
    token = data.jwt;
  });

  it('Website not created if url is not present', async () => {
    try {
      await axios.post(
        `${BACKEND_URL}/website`,
        {},
        {
          headers: {
            Authorization: token,
          },
        }
      );
      expect(false, "Website created when it shouldn't");
    } catch (e) {}
  });

  it('Website is created if url is  present', async () => {
    const resposne = await axios.post(
      `${BACKEND_URL}/website`,
      {
        url: 'https://google.com',
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );
    expect(resposne.data.id).not.toBeNull();
  });

  it('Website is not created if header  is not  present', async () => {
    try {
      const resposne = await axios.post(`${BACKEND_URL}/website`, {
        url: 'https://google.com',
      });
      expect(false, 'Website shouldnt be created if no auth header');
    } catch (e) {}
  });
});

describe('Can fetch website', () => {
  let token1: string, userId1: string;
  let token2: string, userId2: string;

  beforeAll(async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    token1 = user1.jwt;
    userId1 = user1.id;
    token2 = user2.jwt;
    userId2 = user2.id;
  });

  it('is able to fetch a website that the user created', async () => {
    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      {
        url: 'http://blob.100xdevs.com/',
      },
      {
        headers: {
          Authorization: token1,
        },
      }
    );

    const getWebsiteResponse = await axios.get(
      `${BACKEND_URL}/status/${websiteResponse.data.id}`,
      {
        headers: {
          Authorization: token1,
        },
      }
    );

    expect(getWebsiteResponse.data.website.id).toBe(websiteResponse.data.id);
    expect(getWebsiteResponse.data.website.user_id).toBe(userId1);
  });

  it('cant access website created by other user', async () => {
    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      {
        url: 'http://blob.100xdevs.com/',
      },
      {
        headers: {
          Authorization: token1,
        },
      }
    );

    try {
      await axios.get(`${BACKEND_URL}/status/${websiteResponse.data.id}`, {
        headers: {
          Authorization: token2,
        },
      });
      expect(false, 'shouldnt be able to access website of diff user');
    } catch (e) {}
  });
});

describe('should be able to get all websites', () => {
  let token: string, userId: string;

  beforeAll(async () => {
    const user1 = await createUser();
    token = user1.jwt;
    userId = user1.id;
  });

  it('Can fetch its own set of websites', async () => {
    await axios.post(
      `${BACKEND_URL}/website`,
      {
        url: 'http://google.com/',
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );
    await axios.post(
      `${BACKEND_URL}/website`,
      {
        url: 'https://facebook.com/',
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );
    const response = await axios.get(`${BACKEND_URL}/websites`, {
      headers: {
        Authorization: token,
      },
    });
    expect(
      response.data.websites.length == 2,
      'incorrect number of websites created'
    );
  });
});

describe('Website aggregation stats', () => {
  let token: string;
  let websiteId: string;

  beforeAll(async () => {
    const user = await createUser();
    token = user.jwt;

    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      {
        url: 'https://aggregation-test.example.com',
      },
      {
        headers: {
          Authorization: token,
        },
      }
    );

    websiteId = websiteResponse.data.id;
    await seedTick(websiteId, REGION_IDS.India, 'Up', 100);
    await seedTick(websiteId, REGION_IDS.India, 'Up', 200);
    await seedTick(websiteId, REGION_IDS.India, 'Down', 150);
    await seedTick(websiteId, REGION_IDS.India, 'Up', 300);
  });

  it('returns stats on /status for the selected region', async () => {
    const response = await axios.get(
      `${BACKEND_URL}/status/${websiteId}?regionId=${REGION_IDS.India}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    expect(response.data.website.stats.uptimePercentage).toBe(75);
    expect(response.data.website.stats.avgResponseTimeMs).toBe(200);
    expect(response.data.website.stats.failures).toBe(1);
    expect(response.data.website.stats.totalChecks).toBe(4);
    expect(response.data.website.stats.lastOutageAt).not.toBeNull();
  });

  it('returns stats on /websites for the selected region', async () => {
    const response = await axios.get(
      `${BACKEND_URL}/websites?regionId=${REGION_IDS.India}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    const website = response.data.websites.find(
      (item: { id: string }) => item.id === websiteId
    );

    expect(website.stats.uptimePercentage).toBe(75);
    expect(website.stats.avgResponseTimeMs).toBe(200);
    expect(website.stats.failures).toBe(1);
    expect(website.stats.totalChecks).toBe(4);
  });

  it('returns empty stats when no ticks exist for a region', async () => {
    const response = await axios.get(
      `${BACKEND_URL}/status/${websiteId}?regionId=${REGION_IDS.USA}`,
      {
        headers: {
          Authorization: token,
        },
      }
    );

    expect(response.data.website.stats.uptimePercentage).toBe(0);
    expect(response.data.website.stats.avgResponseTimeMs).toBe(0);
    expect(response.data.website.stats.failures).toBe(0);
    expect(response.data.website.stats.totalChecks).toBe(0);
    expect(response.data.website.stats.lastOutageAt).toBeNull();
  });
});
