import { createClient, type RedisClientType } from 'redis';

const STREAM_NAME = 'observo:incident-events';
const CONSUMER_GROUP = 'notifier';

export type StreamIncidentEvent = {
  id: string;
  type: string;
  incidentId: string;
  source: string;
  occurredAt: string;
};

export type StreamIncidentMessage = {
  id: string;
  message: StreamIncidentEvent;
};

let client: RedisClientType | null = null;

async function getClient() {
  if (!client) {
    client = createClient().on('error', (err) => {
      console.error('Redis Client Error', err);
    });
    await client.connect();
  }

  return client;
}

export async function publishIncidentEvent(event: StreamIncidentEvent) {
  const redis = await getClient();
  await redis.xAdd(STREAM_NAME, '*', event);
}

export async function ensureNotifierConsumerGroup() {
  const redis = await getClient();

  try {
    await redis.xGroupCreate(STREAM_NAME, CONSUMER_GROUP, '0', {
      MKSTREAM: true,
    });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('BUSYGROUP')) {
      throw error;
    }
  }
}

export async function readIncidentEvents(
  consumerId: string
): Promise<StreamIncidentMessage[] | undefined> {
  const redis = await getClient();
  const response = await redis.xReadGroup(
    CONSUMER_GROUP,
    consumerId,
    { key: STREAM_NAME, id: '>' },
    { COUNT: 10, BLOCK: 5000 }
  );

  return response?.[0]?.messages.map((entry) => ({
    id: entry.id,
    message: entry.message as StreamIncidentEvent,
  }));
}

export async function ackIncidentEvents(eventIds: string[]) {
  if (eventIds.length === 0) {
    return;
  }

  const redis = await getClient();
  await redis.xAck(STREAM_NAME, CONSUMER_GROUP, eventIds);
}
