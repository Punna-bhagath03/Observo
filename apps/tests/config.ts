import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(import.meta.dir, '../../packages/store/.env') });

export const BACKEND_URL = 'http://localhost:3000';

export const REGION_IDS = {
  India: '426aadc0-55e7-45b6-a928-ea98da7e0454',
  USA: 'c1df32e0-97cb-4577-835f-2aadb28bcc72',
  Africa: '44097c6b-bfa4-42b3-a72d-dfaf8ce05b37',
  Europe: '21120c33-270f-4b0d-bc68-162a6180b5a3',
};
