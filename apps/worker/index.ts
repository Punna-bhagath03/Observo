import axios from 'axios';
import { ensureConsumerGroup, xAckBulk, xReadGroup } from 'redisstream/client';
import { handleIncident } from 'store/incidents';
import { publishIncidentAction } from 'store/publishIncidentEvent';
import { prismaClient } from 'store/client';

const REGION_ID = process.env.REGION_ID!;
const WORKER_ID = process.env.WORKER_ID!;
const PROBE_TIMEOUT_MS = 10_000;

if (!REGION_ID) {
  throw new Error('region id  not provided');
}
if (!WORKER_ID) {
  throw new Error('worker id  not provided');
}

async function main() {
  while (1) {
    const response = await xReadGroup(REGION_ID, WORKER_ID);

    if (!response) {
      continue;
    }

    const promises = response.map(({ message }) =>
      fetchWebsite(message.url, message.id)
    );
    await Promise.all(promises);

    await xAckBulk(
      REGION_ID,
      response.map(({ id }) => id)
    );
  }
}

async function saveTick(
  websiteId: string,
  status: 'Up' | 'Down',
  responseTimeMs: number
) {
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
