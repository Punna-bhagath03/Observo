import { z } from 'zod';

export const AuthInput = z.object({
  username: z.string(),
  password: z.string(),
});

const rulesSchema = z.object({
  'incident.opened': z.boolean(),
  'incident.acknowledged': z.boolean(),
  'incident.resolved': z.boolean(),
});

export const NotificationSettingsInput = z.object({
  email: z.string().email(),
  rules: rulesSchema,
});
