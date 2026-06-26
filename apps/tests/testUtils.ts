import axios from 'axios';
import { BACKEND_URL } from './config';

const testUserIds = new Set<string>();

export function trackTestUser(userId: string) {
  testUserIds.add(userId);
}

export async function seedTick(
  websiteId: string,
  regionId: string,
  status: 'Up' | 'Down',
  responseTimeMs = 100
) {
  return seedTickAt(websiteId, regionId, status, new Date(), responseTimeMs);
}

export async function seedTickAt(
  websiteId: string,
  regionId: string,
  status: 'Up' | 'Down',
  createdAt: Date,
  responseTimeMs = 100
) {
  const { prismaClient } = await import('store/client');

  return prismaClient.website_tick.create({
    data: {
      website_id: websiteId,
      region_id: regionId,
      response_time_ms: responseTimeMs,
      status,
      createdAt,
    },
  });
}

export async function seedTickWithIncident(
  websiteId: string,
  regionId: string,
  status: 'Up' | 'Down',
  responseTimeMs = 100
) {
  const { handleIncident } = await import('store/incidents');
  const tick = await seedTick(websiteId, regionId, status, responseTimeMs);
  await handleIncident(tick);
  return tick;
}

export async function getIncidents(websiteId: string, regionId: string) {
  const { prismaClient } = await import('store/client');

  return prismaClient.incident.findMany({
    where: {
      website_id: websiteId,
      region_id: regionId,
    },
    orderBy: {
      started_at: 'desc',
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

  trackTestUser(res.data.id);

  return {
    id: res.data.id,
    jwt: signinRes.data.jwt,
  };
}

export async function cleanupTestUsers() {
  if (testUserIds.size === 0) {
    return;
  }

  const { prismaClient } = await import('store/client');
  const userIds = [...testUserIds];

  await prismaClient.website_tick.deleteMany({
    where: {
      website: {
        user_id: {
          in: userIds,
        },
      },
    },
  });

  await prismaClient.incident.deleteMany({
    where: {
      website: {
        user_id: {
          in: userIds,
        },
      },
    },
  });

  await prismaClient.website.deleteMany({
    where: {
      user_id: {
        in: userIds,
      },
    },
  });

  await prismaClient.user.deleteMany({
    where: {
      id: {
        in: userIds,
      },
    },
  });

  testUserIds.clear();
}
