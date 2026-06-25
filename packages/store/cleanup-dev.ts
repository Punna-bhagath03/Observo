import { prismaClient } from './index';

const OWNER_ANCHOR_URL = 'https://webmeet-ai.bhagath.site/';

export async function cleanupDevDatabase() {
  const ownerWebsite = await prismaClient.website.findFirst({
    where: { url: OWNER_ANCHOR_URL },
    select: { user_id: true },
  });

  if (!ownerWebsite) {
    return;
  }

  const keepWebsites = await prismaClient.website.findMany({
    where: { user_id: ownerWebsite.user_id },
    select: { id: true },
  });

  const keepWebsiteIds = keepWebsites.map((website) => website.id);

  await prismaClient.website_tick.deleteMany({
    where: { website_id: { notIn: keepWebsiteIds } },
  });

  await prismaClient.incident.deleteMany({
    where: { website_id: { notIn: keepWebsiteIds } },
  });

  await prismaClient.website.deleteMany({
    where: { id: { notIn: keepWebsiteIds } },
  });

  await prismaClient.user.deleteMany({
    where: { websites: { none: {} } },
  });
}

async function main() {
  await cleanupDevDatabase();

  const keepWebsites = await prismaClient.website.findMany({
    select: { url: true },
  });

  console.log('Kept websites:');
  keepWebsites.forEach((website) => console.log(`- ${website.url}`));
}

if (import.meta.main) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prismaClient.$disconnect();
    });
}
