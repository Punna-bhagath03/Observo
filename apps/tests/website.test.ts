import { describe, it, expect } from 'bun:test';
import axios from 'axios';

let BASE_URL = 'http://localhost:3000';

describe('Website gets created', () => {
  it('Website not created if url is not present', async () => {
    try {
      await axios.post(`${BASE_URL}/website`, {});
      expect(false, "Website created when it shouldn't");
    } catch (e) {}
  });

  it.todo('Website is created if url is  present', async () => {
    const resposne = await axios.post(`${BASE_URL}/website`, {
      url: 'https://google.com',
    });
    expect(resposne.data.id).not.toBeNull();
  });
});
