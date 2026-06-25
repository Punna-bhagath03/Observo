import { describe, it, expect, beforeAll } from 'bun:test';
import axios from 'axios';
import { BACKEND_URL, REGION_IDS } from './config';
import {
  createUser,
  getIncidents,
  seedTickWithIncident,
} from './testUtils';

describe('Incident detection', () => {
  let websiteId: string;

  beforeAll(async () => {
    const user = await createUser();
    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://incident-detect.example.com' },
      { headers: { Authorization: user.jwt } }
    );
    websiteId = websiteResponse.data.id;
  });

  it('does not open incident after one Down tick', async () => {
    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Down');

    const incidents = await getIncidents(websiteId, REGION_IDS.India);
    expect(incidents.length).toBe(0);
  });

  it('opens incident after two consecutive Down ticks', async () => {
    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Down');

    const incidents = await getIncidents(websiteId, REGION_IDS.India);
    expect(incidents.length).toBe(1);
    expect(incidents[0]?.resolved_at).toBeNull();
  });

  it('keeps a single open incident on additional Down ticks', async () => {
    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Down');

    const incidents = await getIncidents(websiteId, REGION_IDS.India);
    expect(incidents.length).toBe(1);
    expect(incidents[0]?.resolved_at).toBeNull();
  });

  it('resolves incident on Up tick', async () => {
    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Up');

    const incidents = await getIncidents(websiteId, REGION_IDS.India);
    expect(incidents.length).toBe(1);
    expect(incidents[0]?.resolved_at).not.toBeNull();
    expect(incidents[0]?.started_at.getTime()).toBeLessThan(
      incidents[0]!.resolved_at!.getTime()
    );
  });

  it('does not create incidents in another region', async () => {
    const usaIncidents = await getIncidents(websiteId, REGION_IDS.USA);
    expect(usaIncidents.length).toBe(0);
  });
});

describe('Incident detection isolation', () => {
  let websiteId: string;

  beforeAll(async () => {
    const user = await createUser();
    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://incident-flap.example.com' },
      { headers: { Authorization: user.jwt } }
    );
    websiteId = websiteResponse.data.id;
  });

  it('does not open incident on a single Down followed by Up', async () => {
    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Down');
    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Up');

    const incidents = await getIncidents(websiteId, REGION_IDS.India);
    expect(incidents.length).toBe(0);
  });
});

describe('Incident API', () => {
  let token: string;
  let otherToken: string;
  let websiteId: string;
  let incidentId: string;

  beforeAll(async () => {
    const user = await createUser();
    const otherUser = await createUser();
    token = user.jwt;
    otherToken = otherUser.jwt;

    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://incident-api.example.com' },
      { headers: { Authorization: token } }
    );
    websiteId = websiteResponse.data.id;

    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Down');
    await seedTickWithIncident(websiteId, REGION_IDS.India, 'Down');

    const incidents = await getIncidents(websiteId, REGION_IDS.India);
    incidentId = incidents[0]!.id;
  });

  it('returns ongoing incident for owned website', async () => {
    const response = await axios.get(
      `${BACKEND_URL}/status/${websiteId}/incidents?regionId=${REGION_IDS.India}`,
      { headers: { Authorization: token } }
    );

    expect(response.data.incidents.length).toBe(1);
    expect(response.data.incidents[0].ongoing).toBe(true);
    expect(response.data.incidents[0].resolved_at).toBeNull();
    expect(response.data.incidents[0].duration_ms).toBeNull();
    expect(response.data.incidents[0].acknowledged_by).toBeNull();
  });

  it('acknowledges an ongoing incident', async () => {
    const response = await axios.post(
      `${BACKEND_URL}/status/${websiteId}/incidents/${incidentId}/acknowledge`,
      {},
      { headers: { Authorization: token } }
    );

    expect(response.data.incident.acknowledged_at).not.toBeNull();
    expect(response.data.incident.acknowledged_by).not.toBeNull();
    expect(response.data.incident.ongoing).toBe(true);
  });

  it('manually resolves an ongoing incident', async () => {
    const response = await axios.post(
      `${BACKEND_URL}/status/${websiteId}/incidents/${incidentId}/resolve`,
      {},
      { headers: { Authorization: token } }
    );

    expect(response.data.incident.ongoing).toBe(false);
    expect(response.data.incident.resolved_at).not.toBeNull();
    expect(response.data.incident.resolved_by).not.toBeNull();
  });

  it('returns resolved incident with duration after recovery', async () => {
    const user = await createUser();
    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://incident-auto-resolve.example.com' },
      { headers: { Authorization: user.jwt } }
    );
    const autoWebsiteId = websiteResponse.data.id;

    await seedTickWithIncident(autoWebsiteId, REGION_IDS.India, 'Down');
    await seedTickWithIncident(autoWebsiteId, REGION_IDS.India, 'Down');
    await seedTickWithIncident(autoWebsiteId, REGION_IDS.India, 'Up');

    const response = await axios.get(
      `${BACKEND_URL}/status/${autoWebsiteId}/incidents?regionId=${REGION_IDS.India}`,
      { headers: { Authorization: user.jwt } }
    );

    expect(response.data.incidents.length).toBe(1);
    expect(response.data.incidents[0].ongoing).toBe(false);
    expect(response.data.incidents[0].resolved_at).not.toBeNull();
    expect(response.data.incidents[0].duration_ms).toBeGreaterThan(0);
    expect(response.data.incidents[0].resolved_by).toBeNull();
  });

  it('blocks access to another users website incidents', async () => {
    try {
      await axios.get(
        `${BACKEND_URL}/status/${websiteId}/incidents?regionId=${REGION_IDS.India}`,
        { headers: { Authorization: otherToken } }
      );
      expect(false, 'should not access another users incidents');
    } catch (e) {}
  });

  it('blocks another user from acknowledging an incident', async () => {
    const user = await createUser();
    const websiteResponse = await axios.post(
      `${BACKEND_URL}/website`,
      { url: 'https://incident-ack-block.example.com' },
      { headers: { Authorization: user.jwt } }
    );
    const ackWebsiteId = websiteResponse.data.id;

    await seedTickWithIncident(ackWebsiteId, REGION_IDS.India, 'Down');
    await seedTickWithIncident(ackWebsiteId, REGION_IDS.India, 'Down');

    const incidents = await getIncidents(ackWebsiteId, REGION_IDS.India);
    const openIncidentId = incidents[0]!.id;

    try {
      await axios.post(
        `${BACKEND_URL}/status/${ackWebsiteId}/incidents/${openIncidentId}/acknowledge`,
        {},
        { headers: { Authorization: otherToken } }
      );
      expect(false, 'should not acknowledge another users incident');
    } catch (e) {}
  });
});
