import 'dotenv/config';

import {
  ackIncidentEvents,
  ensureNotifierConsumerGroup,
  readIncidentEvents,
} from 'redisstream/incident-events';

import { handleIncidentStreamMessage } from './handleEvent';

const CONSUMER_ID = process.env.NOTIFIER_ID ?? 'notifier-1';

async function main() {
  await ensureNotifierConsumerGroup();

  while (true) {
    const messages = await readIncidentEvents(CONSUMER_ID);
    if (!messages?.length) {
      continue;
    }

    const ackIds: string[] = [];

    for (const message of messages) {
      try {
        await handleIncidentStreamMessage(message);
        ackIds.push(message.id);
      } catch (error) {
        console.error('Failed to process incident event', {
          streamId: message.id,
          eventId: message.message.id,
          error,
        });
      }
    }

    await ackIncidentEvents(ackIds);
  }
}

main();
