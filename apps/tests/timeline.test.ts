import { describe, it, expect } from 'bun:test';
import {
  buildIncidentTimeline,
  formatTimelineEvent,
} from 'store/timeline';

const website = {
  url: 'https://example.com',
  time_added: new Date('2026-06-25T10:00:00Z'),
};

function tick(
  id: string,
  status: 'Up' | 'Down',
  createdAt: Date
) {
  return { id, status, createdAt };
}

function chronologicalTypes(events: ReturnType<typeof buildIncidentTimeline>) {
  return [...events]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((event) => event.type);
}

describe('Incident timeline', () => {
  it('orders each incident as down, down, opened, up, auto-resolved', () => {
    const down1 = new Date('2026-06-25T11:00:00Z');
    const down2 = new Date('2026-06-25T11:03:00Z');
    const up = new Date('2026-06-25T11:10:00Z');

    const events = buildIncidentTimeline(
      website,
      [
        {
          id: 'inc-1',
          started_at: down1,
          resolved_at: up,
          acknowledged_at: null,
          acknowledged_by: null,
          resolved_by: null,
        },
      ],
      [
        tick('t1', 'Down', down1),
        tick('t2', 'Down', down2),
        tick('t3', 'Up', up),
      ]
    );

    expect(chronologicalTypes(events)).toEqual([
      'website_added',
      'check_down',
      'check_down',
      'incident_opened',
      'check_up',
      'incident_resolved_auto',
    ]);
  });

  it('orders acknowledge and manual resolve after incident opened', () => {
    const down1 = new Date('2026-06-25T12:00:00Z');
    const down2 = new Date('2026-06-25T12:03:00Z');
    const ack = new Date('2026-06-25T12:05:00Z');
    const resolved = new Date('2026-06-25T12:10:00Z');

    const events = buildIncidentTimeline(
      website,
      [
        {
          id: 'inc-2',
          started_at: down1,
          resolved_at: resolved,
          acknowledged_at: ack,
          acknowledged_by: { username: 'punna@123' },
          resolved_by: { username: 'punna@123' },
        },
      ],
      [
        tick('t1', 'Down', down1),
        tick('t2', 'Down', down2),
      ]
    );

    expect(chronologicalTypes(events)).toEqual([
      'website_added',
      'check_down',
      'check_down',
      'incident_opened',
      'incident_acknowledged',
      'incident_resolved_manual',
    ]);

    const ackEvent = formatTimelineEvent(
      events.find((event) => event.type === 'incident_acknowledged')!,
      website.url
    );
    expect(ackEvent.title).toContain('punna@123');
  });

  it('does not include down checks after incident is opened', () => {
    const down1 = new Date('2026-06-25T12:26:00Z');
    const down2 = new Date('2026-06-25T12:26:30Z');
    const resolved = new Date('2026-06-25T12:26:52Z');
    const laterDown = new Date('2026-06-25T12:29:00Z');

    const events = buildIncidentTimeline(
      website,
      [
        {
          id: 'inc-3',
          started_at: down1,
          resolved_at: resolved,
          acknowledged_at: new Date('2026-06-25T13:03:00Z'),
          acknowledged_by: { username: 'punna@123' },
          resolved_by: { username: 'punna@123' },
        },
      ],
      [
        tick('t1', 'Down', down1),
        tick('t2', 'Down', down2),
        tick('t3', 'Down', laterDown),
      ]
    );

    expect(events.filter((event) => event.type === 'check_down').length).toBe(2);
    expect(events.some((event) => event.id.includes('t3'))).toBe(false);
  });

  it('orders events newest first', () => {
    const events = buildIncidentTimeline(website, [], []);
    expect(events[0]?.type).toBe('website_added');
  });
});
