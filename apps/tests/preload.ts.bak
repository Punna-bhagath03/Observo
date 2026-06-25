import { afterAll } from 'bun:test';
import { cleanupTestUsers } from './testUtils';

afterAll(async () => {
  await cleanupTestUsers();
  const { cleanupDevDatabase } = await import('store/cleanup-dev');
  await cleanupDevDatabase();
});
