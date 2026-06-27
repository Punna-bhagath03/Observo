import axios from 'axios';
import { ensureConsumerGroup, xAckBulk, xReadGroup } from 'redisstream/client';
import { handleIncident } from 'store/incidents';
import { CHECK_INTERVAL_MINUTES } from 'store/metrics';
import { publishIncidentAction } from 'store/publishIncidentEvent';
import { prismaClient } from 'store/client';

const REGION_ID = process.env.REGION_ID!;
const WORKER_ID = process.env.WORKER_ID!;
const PROBE_TIMEOUT_MS = 10_000;
const MIN_TICK_GAP_MS = CHECK_INTERVAL_MINUTES * 60_000 * 0.8;

if (!REGION_ID) {
  throw new Error('region id  not provided');
}
if (!WORKER_ID) {
  throw new Error('worker id  not provided');
}

function uniqueWebsiteJobs(
  messages: Array<{ message: { id: string; url: string } }>
) {
  const seen = new Set<string>();
  return messages.filter(({ message }) => {
    if (seen.has(message.id)) {
      return false;
    }
    seen.add(message.id);
    return true;
  });
}

async function main() {
  while (1) {
    const response = await xReadGroup(REGION_ID, WORKER_ID)

    if (!response) {
      continue
    }

    const jobs = uniqueWebsiteJobs(response)

    await Promise.all(
      jobs.map(({ message }) => fetchWebsite(message.url, message.id))
    )

    await xAckBulk(
      REGION_ID,
      response.map(({ id }) => id)
    )
  }
}

async function saveTick(
  websiteId: string,
  status: 'Up' | 'Down',
  responseTimeMs: number
) {
  const recent = await prismaClient.website_tick.findFirst({
    where: {
      website_id: websiteId,
      region_id: REGION_ID,
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  if (
    recent &&
    Date.now() - recent.createdAt.getTime() < MIN_TICK_GAP_MS
  ) {
    return;
  }

  const tick = await prismaClient.website_tick.create({
    data: {
      response_time_ms: responseTimeMs,
      status,
      region_id: REGION_ID,
      website_id: websiteId,
    },
  });

  const action = await handleIncident(tick);
  await publishIncidentAction(action, 'monitor');
}

async function fetchWebsite(url: string, websiteId: string) {
  const startTime = Date.now();

  try {
    await axios.get(url, { timeout: PROBE_TIMEOUT_MS });
    await saveTick(websiteId, 'Up', Date.now() - startTime);
  } catch {
    await saveTick(websiteId, 'Down', Date.now() - startTime);
  }
}

await ensureConsumerGroup(REGION_ID);
main();
