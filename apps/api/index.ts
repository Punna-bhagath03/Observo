import jwt from 'jsonwebtoken';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

import { prismaClient } from 'store/client';
import { AuthInput } from './types';
import { authMiddleware } from './middleware';
import { computeStats, getStatsWindowStart } from './aggregation';

async function resolveRegionId(
  regionId: string | undefined
): Promise<string | null> {
  if (regionId) {
    const region = await prismaClient.region.findFirst({
      where: { id: regionId },
    });
    return region?.id ?? null;
  }

  const india = await prismaClient.region.findFirst({
    where: { name: 'India' },
  });
  return india?.id ?? null;
}

app.use(express.json());
app.use(cors());

app.get('/regions', async (req, res) => {
  const regions = await prismaClient.region.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  res.json({ regions });
});

app.post('/website', authMiddleware, async (req, res) => {
  if (!req.body.url) {
    res.status(411).json({});
    return;
  }

  const website = await prismaClient.website.create({
    data: {
      url: req.body.url,
      time_added: new Date(),
      user_id: req.userId!,
    },
  });

  res.json({
    id: website.id,
  });
});

app.get('/status/:websiteId', authMiddleware, async (req, res) => {
  const regionId = await resolveRegionId(
    typeof req.query.regionId === 'string' ? req.query.regionId : undefined
  );
  if (!regionId) {
    res.status(403).send('');
    return;
  }

  const website = await prismaClient.website.findFirst({
    where: {
      user_id: req.userId!,
      id: req.params.websiteId,
    },
  });
  if (!website) {
    res.status(409).json({
      message: 'Not found',
    });
    return;
  }

  const windowStart = getStatsWindowStart();
  const ticks = await prismaClient.website_tick.findMany({
    where: {
      website_id: website.id,
      region_id: regionId,
      createdAt: {
        gte: windowStart,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({
    website: {
      url: website.url,
      id: website.id,
      user_id: website.user_id,
      ticks: ticks.slice(0, 10),
      stats: computeStats(ticks),
    },
  });
});

app.post('/user/signup', async (req, res) => {
  const data = AuthInput.safeParse(req.body);
  if (!data.success) {
    console.log(data.error.toString);
    res.status(403).send('');
    return;
  }
  try {
    let user = await prismaClient.user.create({
      data: {
        username: data.data.username,
        password: data.data.password,
      },
    });
    res.json({
      id: user.id,
    });
  } catch (e) {
    console.log(e);
    res.status(403).send('');
  }
});

app.post('/user/signin', async (req, res) => {
  const data = AuthInput.safeParse(req.body);
  if (!data.success) {
    res.status(403).send('');
    return;
  }
  let user = await prismaClient.user.findFirst({
    where: {
      username: data.data.username,
    },
  });
  if (user?.password !== data.data.password) {
    res.status(403).send('');
    return;
  }

  let token = jwt.sign(
    {
      sub: user.id,
    },
    process.env.JWT_SECRET!
  );

  res.json({
    jwt: token,
  });
});

app.get('/websites', authMiddleware, async (req, res) => {
  const regionId = await resolveRegionId(
    typeof req.query.regionId === 'string' ? req.query.regionId : undefined
  );
  if (!regionId) {
    res.status(403).send('');
    return;
  }

  const websites = await prismaClient.website.findMany({
    where: {
      user_id: req.userId,
    },
  });

  const websiteIds = websites.map((website) => website.id);
  const windowStart = getStatsWindowStart();
  const ticks =
    websiteIds.length > 0
      ? await prismaClient.website_tick.findMany({
          where: {
            website_id: {
              in: websiteIds,
            },
            region_id: regionId,
            createdAt: {
              gte: windowStart,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      : [];

  const ticksByWebsite = new Map<string, typeof ticks>();
  for (const tick of ticks) {
    const websiteTicks = ticksByWebsite.get(tick.website_id) ?? [];
    websiteTicks.push(tick);
    ticksByWebsite.set(tick.website_id, websiteTicks);
  }

  res.json({
    websites: websites.map((website) => {
      const websiteTicks = ticksByWebsite.get(website.id) ?? [];

      return {
        id: website.id,
        url: website.url,
        user_id: website.user_id,
        time_added: website.time_added,
        ticks: websiteTicks.slice(0, 1),
        stats: computeStats(websiteTicks),
      };
    }),
  });
});

app.listen(process.env.PORT || 3000);
