import axios from 'axios';
import { BACKEND_URL } from './config';

export async function seedTick(
  websiteId: string,
  regionId: string,
  status: 'Up' | 'Down',
  responseTimeMs = 100
) {
  const { prismaClient } = await import('store/client');

  await prismaClient.website_tick.create({
    data: {
      website_id: websiteId,
      region_id: regionId,
      response_time_ms: responseTimeMs,
      status,
    },
  });
}

export async function createUser(): Promise<{
  id: string;
  jwt: string;
}> {
  const USER_NAME = Math.random().toString();
  const res = await axios.post(`${BACKEND_URL}/user/signup`, {
    username: USER_NAME,
    password: '234543234',
  });

  const signinRes = await axios.post(`${BACKEND_URL}/user/signin`, {
    username: USER_NAME,
    password: '234543234',
  });

  return {
    id: res.data.id,
    jwt: signinRes.data.jwt,
  };
}
