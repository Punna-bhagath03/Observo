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

const emailSettingsSchema = z.object({
  address: z.string().email(),
  rules: rulesSchema,
});

const webhookSettingsSchema = z.object({
  url: z.string().url(),
  rules: rulesSchema,
  regenerateSecret: z.boolean().optional(),
});

export const NotificationSettingsInput = z
  .object({
    email: emailSettingsSchema.optional(),
    webhook: webhookSettingsSchema.optional(),
    disableWebhook: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.email !== undefined ||
      value.webhook !== undefined ||
      value.disableWebhook === true,
    { message: 'No notification settings provided' }
  );
