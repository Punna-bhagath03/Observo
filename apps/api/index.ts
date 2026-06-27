import jwt from 'jsonwebtoken';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

import { prismaClient } from 'store/client';
import {
  acknowledgeIncident,
  formatIncident,
  incidentInclude,
  resolveIncidentManually,
} from 'store/incidents';
import {
  buildIncidentTimeline,
  formatTimelineEvent,
} from 'store/timeline';
import {
  buildWebsiteMetrics,
  computePeriodStats,
  formatCustomPeriodLabel,
  parseMetricsQuery,
} from 'store/metrics';
import {
  generateUniqueSlug,
  isValidStatusPageSlug,
  loadPublicStatusPage,
  resolveMonitorStreakStartAt,
  slugBaseFromUrl,
} from 'store/statusPage';
import { AuthInput } from './types';
import { authMiddleware } from './middleware';
import { buildWebsiteStats, getStatsWindowStart } from './aggregation';

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

app.get('/public/status/:slug', async (req, res) => {
  const regionId = await resolveRegionId(
    typeof req.query.regionId === 'string' ? req.query.regionId : undefined
  );
  if (!regionId) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  const page = await loadPublicStatusPage(
    prismaClient,
    req.params.slug as string,
    regionId
  );

  if (!page) {
    res.status(404).json({ message: 'Not found' });
    return;
  }

  res.json(page);
});

app.patch('/website/:id/status-page', authMiddleware, async (req, res) => {
  const website = await prismaClient.website.findFirst({
    where: {
      id: req.params.id,
      user_id: req.userId!,
    },
  });

  if (!website) {
    res.status(409).json({ message: 'Not found' });
    return;
  }

  const enabled = req.body.enabled;
  const slugInput =
    typeof req.body.slug === 'string'
      ? req.body.slug.trim().toLowerCase()
      : undefined;

  if (typeof enabled !== 'boolean') {
    res.status(403).send('');
    return;
  }

  if (!enabled) {
    const updated = await prismaClient.website.update({
      where: { id: website.id },
      data: { status_page_enabled: false },
      select: {
        status_page_enabled: true,
        status_page_slug: true,
      },
    });
    res.json(updated);
    return;
  }

  let slug = slugInput ?? website.status_page_slug;

  if (!slug) {
    slug = await generateUniqueSlug(
      prismaClient,
      slugBaseFromUrl(website.url)
    );
  }

  if (!isValidStatusPageSlug(slug)) {
    res.status(403).json({ message: 'Invalid slug' });
    return;
  }

  const taken = await prismaClient.website.findFirst({
    where: {
      status_page_slug: slug,
      id: { not: website.id },
    },
    select: { id: true },
  });

  if (taken) {
    res.status(409).json({ message: 'Slug already taken' });
    return;
  }

  const updated = await prismaClient.website.update({
    where: { id: website.id },
    data: {
      status_page_enabled: true,
      status_page_slug: slug,
    },
    select: {
      status_page_enabled: true,
      status_page_slug: true,
    },
  });

  res.json(updated);
});

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
  const windowEnd = new Date();
  const [ticks, incidents] = await Promise.all([
    prismaClient.website_tick.findMany({
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
    }),
    prismaClient.incident.findMany({
      where: {
        website_id: website.id,
        region_id: regionId,
      },
      select: {
        started_at: true,
        resolved_at: true,
      },
    }),
  ]);

  const tickStats = buildWebsiteStats(ticks, incidents, windowStart, windowEnd);

  res.json({
    website: {
      url: website.url,
      id: website.id,
      user_id: website.user_id,
      ticks: ticks.slice(0, 10),
      stats: tickStats,
    },
  });
});

app.get('/status/:websiteId/incidents', authMiddleware, async (req, res) => {
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

  const incidents = await prismaClient.incident.findMany({
    where: {
      website_id: website.id,
      region_id: regionId,
    },
    orderBy: {
      started_at: 'desc',
    },
    take: 20,
    include: incidentInclude,
  });

  res.json({
    incidents: incidents.map(formatIncident),
  });
});

app.post(
  '/status/:websiteId/incidents/:incidentId/acknowledge',
  authMiddleware,
  async (req, res) => {
    const incident = await acknowledgeIncident(
      req.params.incidentId,
      req.params.websiteId,
      req.userId!
    );

    if (!incident) {
      res.status(409).json({ message: 'Not found' });
      return;
    }

    res.json({ incident: formatIncident(incident) });
  }
);

app.post(
  '/status/:websiteId/incidents/:incidentId/resolve',
  authMiddleware,
  async (req, res) => {
    const incident = await resolveIncidentManually(
      req.params.incidentId,
      req.params.websiteId,
      req.userId!
    );

    if (!incident) {
      res.status(409).json({ message: 'Not found' });
      return;
    }

    res.json({ incident: formatIncident(incident) });
  }
);

app.get('/status/:websiteId/timeline', authMiddleware, async (req, res) => {
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
    res.status(409).json({ message: 'Not found' });
    return;
  }

  const incidents = await prismaClient.incident.findMany({
    where: {
      website_id: website.id,
      region_id: regionId,
    },
    orderBy: { started_at: 'desc' },
    take: 20,
    include: incidentInclude,
  });

  const ticks = await prismaClient.website_tick.findMany({
    where: {
      website_id: website.id,
      region_id: regionId,
      createdAt: { gte: website.time_added },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  const events = buildIncidentTimeline(website, incidents, ticks).map((event) =>
    formatTimelineEvent(event, website.url)
  );

  res.json({ events });
});

app.get('/status/:websiteId/metrics', authMiddleware, async (req, res) => {
  const regionId = await resolveRegionId(
    typeof req.query.regionId === 'string' ? req.query.regionId : undefined
  );
  if (!regionId) {
    res.status(403).send('');
    return;
  }

  const parsed = parseMetricsQuery({
    range:
      typeof req.query.range === 'string' ? req.query.range : undefined,
    from: typeof req.query.from === 'string' ? req.query.from : undefined,
    to: typeof req.query.to === 'string' ? req.query.to : undefined,
  });

  if (!parsed.ok) {
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
    res.status(409).json({ message: 'Not found' });
    return;
  }

  if (req.query.statsOnly === 'true') {
    if (parsed.includePresetPeriodStats) {
      res.status(403).send('');
      return;
    }

    const incidents = await prismaClient.incident.findMany({
      where: {
        website_id: website.id,
        region_id: regionId,
      },
      select: {
        started_at: true,
        resolved_at: true,
      },
    });

    const { from, to } = parsed.window;

    res.json({
      periodStat: computePeriodStats(
        formatCustomPeriodLabel(from, to),
        from,
        to,
        incidents
      ),
    });
    return;
  }

  const [windowTicks, latestTick, incidents] = await Promise.all([
    prismaClient.website_tick.findMany({
      where: {
        website_id: website.id,
        region_id: regionId,
        createdAt: {
          gte: parsed.window.from,
          lte: parsed.window.to,
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        status: true,
        response_time_ms: true,
        createdAt: true,
      },
    }),
    prismaClient.website_tick.findFirst({
      where: {
        website_id: website.id,
        region_id: regionId,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        status: true,
        response_time_ms: true,
        createdAt: true,
      },
    }),
    prismaClient.incident.findMany({
      where: {
        website_id: website.id,
        region_id: regionId,
      },
      select: {
        started_at: true,
        resolved_at: true,
      },
    }),
  ]);

  let monitorStreakStartAt: Date | null = null;

  if (latestTick?.status === 'Up') {
    monitorStreakStartAt = await resolveMonitorStreakStartAt(
      prismaClient,
      website.id,
      regionId,
      website.time_added,
      latestTick
    );
  }

  res.json(
    buildWebsiteMetrics({
      windowTicks,
      monitorLatest: latestTick,
      monitorStreakStartAt,
      incidents,
      websiteAddedAt: website.time_added,
      window: parsed.window,
      includePresetPeriodStats: parsed.includePresetPeriodStats,
    })
  );
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
  const windowEnd = new Date();
  const [ticks, incidents] = await Promise.all([
    websiteIds.length > 0
      ? prismaClient.website_tick.findMany({
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
      : Promise.resolve([]),
    websiteIds.length > 0
      ? prismaClient.incident.findMany({
          where: {
            website_id: { in: websiteIds },
            region_id: regionId,
          },
          select: {
            website_id: true,
            started_at: true,
            resolved_at: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const ticksByWebsite = new Map<string, typeof ticks>();
  for (const tick of ticks) {
    const websiteTicks = ticksByWebsite.get(tick.website_id) ?? [];
    websiteTicks.push(tick);
    ticksByWebsite.set(tick.website_id, websiteTicks);
  }

  const incidentsByWebsite = new Map<
    string,
    { started_at: Date; resolved_at: Date | null }[]
  >();
  for (const incident of incidents) {
    const websiteIncidents = incidentsByWebsite.get(incident.website_id) ?? [];
    websiteIncidents.push({
      started_at: incident.started_at,
      resolved_at: incident.resolved_at,
    });
    incidentsByWebsite.set(incident.website_id, websiteIncidents);
  }

  const ongoingIncidents =
    websiteIds.length > 0
      ? await prismaClient.incident.findMany({
          where: {
            website_id: { in: websiteIds },
            region_id: regionId,
            resolved_at: null,
          },
          select: { website_id: true },
        })
      : [];

  const ongoingByWebsite = new Set(
    ongoingIncidents.map((incident) => incident.website_id)
  );

  res.json({
    websites: websites.map((website) => {
      const websiteTicks = ticksByWebsite.get(website.id) ?? [];
      const websiteIncidents = incidentsByWebsite.get(website.id) ?? [];

      return {
        id: website.id,
        url: website.url,
        user_id: website.user_id,
        time_added: website.time_added,
        status_page_enabled: website.status_page_enabled,
        status_page_slug: website.status_page_slug,
        ticks: websiteTicks.slice(0, 1),
        stats: buildWebsiteStats(
          websiteTicks,
          websiteIncidents,
          windowStart,
          windowEnd
        ),
        ongoingIncident: ongoingByWebsite.has(website.id),
      };
    }),
  });
});

app.listen(process.env.PORT || 3000);
