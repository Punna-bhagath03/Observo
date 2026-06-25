import axios from 'axios';
import { ensureConsumerGroup, xAckBulk, xReadGroup } from 'redisstream/client';
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
    //step 1
    const response = await xReadGroup(REGION_ID, WORKER_ID);

    if (!response) {
      continue;
    }
    //step 2
    let promises = response.map(({ message }) =>
      fetchWebsite(message.url, message.id)
    );
    await Promise.all(promises);
    console.log(promises.length);

    //step 3
    await xAckBulk(
      REGION_ID,
      response.map(({ id }) => id)
    );
  }
}
async function fetchWebsite(url: string, websiteId: string) {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    // console.log('Processing', url, websiteId);
    axios
      .get(url, { timeout: PROBE_TIMEOUT_MS })
      .then(async () => {
        // console.log('UP', url);
        const endTime = Date.now();
        await prismaClient.website_tick.create({
          data: {
            response_time_ms: endTime - startTime,
            status: 'Up',
            region_id: REGION_ID,
            website_id: websiteId,
          },
        });
        resolve();
      })
      .catch(async () => {
        // console.log('DOWN', url);
        const endTime = Date.now();
        await prismaClient.website_tick.create({
          data: {
            response_time_ms: endTime - startTime,
            status: 'Down',
            region_id: REGION_ID,
            website_id: websiteId,
          },
        });
        resolve();
      });
  });
}

await ensureConsumerGroup(REGION_ID);
main();
