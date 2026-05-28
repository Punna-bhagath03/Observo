import { describe, it, expect, beforeAll } from 'bun:test';
import axios from 'axios';
import { createUser } from './testUtils';

let BASE_URL = 'http://localhost:3000';

describe('Website gets created', () => {
  let token: string;

  beforeAll(async () => {
    const data = await createUser();
    token = data.jwt;
  });

  it('Website not created if url is not present', async () => {
    try {
      await axios.post(
        `${BASE_URL}/website`,
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
      `${BASE_URL}/website`,
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
      const resposne = await axios.post(`${BASE_URL}/website`, {
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
      `${BASE_URL}/website`,
      {
        url: 'https://google.com',
      },
      {
        headers: {
          Authorization: token1,
        },
      }
    );
    const getWebsiteResponse = await axios.get(
      `${BASE_URL}/website/${websiteResponse.data.id}`,
      {
        headers: {
          Authorization: token1,
        },
      }
    );

    expect(getWebsiteResponse.data.id).toBe(websiteResponse.data.id);
    expect(getWebsiteResponse.data.userId).toBe(userId1);
  });
});
