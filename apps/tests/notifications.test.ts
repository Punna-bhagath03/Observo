import { describe, it, expect } from 'bun:test';
import {
  buildNotification,
  claimDelivery,
  processIncidentEvent,
} from 'store/notifications';
import type { IncidentEvent } from 'store/events';

describe('buildNotification', () => {
  it('includes website, region, and event label', () => {
    const message = buildNotification({
      eventId: 'evt-1',
      eventType: 'incident.opened',
      incidentId: 'inc-1',
      websiteUrl: 'https://example.com',
      regionName: 'India',
      userId: 'user-1',
      startedAt: new Date('2026-06-26T12:00:00Z'),
      resolvedAt: null,
      acknowledgedBy: null,
      resolvedBy: null,
      occurredAt: new Date('2026-06-26T12:06:00Z'),
    });

    expect(message.subject).toContain('https://example.com');
    expect(message.subject).toContain('India');
    expect(message.text).toContain('Incident opened');
    expect(message.text).toContain('Ongoing');
  });
});

describe('processIncidentEvent', () => {
  it('sends email only for enabled rules and deduplicates delivery', async () => {
    const { prismaClient } = await import('store/client');
    const { createUser } = await import('./testUtils');
    const { REGION_IDS } = await import('./config');
    const { handleIncident } = await import('store/incidents');
    const { seedTickAt } = await import('./testUtils');

    const user = await createUser();
    const website = await prismaClient.website.create({
      data: {
        url: 'https://notify.example.com',
        user_id: user.id,
        time_added: new Date(),
      },
    });

    const channel = await prismaClient.notification_channel.create({
      data: {
        user_id: user.id,
        type: 'email',
        config: { email: 'owner@example.com' },
        rules: {
          create: [
            { event_type: 'incident_opened', enabled: true },
            { event_type: 'incident_acknowledged', enabled: false },
            { event_type: 'incident_resolved', enabled: true },
          ],
        },
      },
    });

    const tick = await seedTickAt(
      website.id,
      REGION_IDS.India,
      'Down',
      new Date('2026-06-26T12:00:00Z')
    );
    await handleIncident(tick);
    const action = await handleIncident(
      await seedTickAt(
        website.id,
        REGION_IDS.India,
        'Down',
        new Date('2026-06-26T12:03:00Z')
      )
    );

    expect(action.type).toBe('opened');

    const event: IncidentEvent = {
      id: crypto.randomUUID(),
      type: 'incident.opened',
      incidentId: action.incidentId,
      source: 'monitor',
      occurredAt: new Date().toISOString(),
    };

    const sent: string[] = [];
    await processIncidentEvent(prismaClient, event, async (input) => {
      sent.push(input.to);
    });
    await processIncidentEvent(prismaClient, event, async () => {
      throw new Error('should not send twice');
    });

    expect(sent).toEqual(['owner@example.com']);

    const deliveries = await prismaClient.notification_delivery.findMany({
      where: { channel_id: channel.id },
    });
    expect(deliveries.length).toBe(1);
    expect(deliveries[0]?.status).toBe('sent');
  });

  it('claims delivery once per channel and incident', async () => {
    const { prismaClient } = await import('store/client');
    const { createUser } = await import('./testUtils');

    const user = await createUser();
    const website = await prismaClient.website.create({
      data: {
        url: 'https://claim.example.com',
        user_id: user.id,
        time_added: new Date(),
      },
    });
    const region = await prismaClient.region.findFirst();
    const incident = await prismaClient.incident.create({
      data: {
        website_id: website.id,
        region_id: region!.id,
        started_at: new Date(),
      },
    });
    const channel = await prismaClient.notification_channel.create({
      data: {
        user_id: user.id,
        type: 'email',
        config: { email: 'a@b.com' },
      },
    });

    expect(
      await claimDelivery(prismaClient, {
        channelId: channel.id,
        incidentId: incident.id,
        eventType: 'incident.opened',
      })
    ).toBe(true);
    expect(
      await claimDelivery(prismaClient, {
        channelId: channel.id,
        incidentId: incident.id,
        eventType: 'incident.opened',
      })
    ).toBe(false);

    await prismaClient.notification_delivery.update({
      where: {
        channel_id_incident_id_event_type: {
          channel_id: channel.id,
          incident_id: incident.id,
          event_type: 'incident_opened',
        },
      },
      data: { status: 'failed', error: 'test failure' },
    });

    expect(
      await claimDelivery(prismaClient, {
        channelId: channel.id,
        incidentId: incident.id,
        eventType: 'incident.opened',
      })
    ).toBe(true);
  });
});
