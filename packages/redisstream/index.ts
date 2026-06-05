import { createClient } from 'redis';

const client = await createClient()
  .on('error', (err) => console.log('Redis Client Error', err))
  .connect();

type WebsiteEvent = { url: string; id: string };

async function xAdd({ url, id }: WebsiteEvent) {
  await client.xAdd('betteruptime:website', '*', {
    url,
    id,
  });
}

export async function xAddBulk(websites: WebsiteEvent[]) {
  for (let i = 0; i < websites.length; i++) {
    await xAdd({
      url: websites[i]?.url,
      id: websites[i]?.id,
    });
  }
}
