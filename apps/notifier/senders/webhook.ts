import {
  formatWebhookSignatureHeader,
  signWebhookPayload,
} from 'store/webhookSignature';
import type { WebhookPayload } from 'store/notifications';

const WEBHOOK_TIMEOUT_MS = 10_000;

export async function sendWebhook(input: {
  url: string;
  secret: string;
  payload: WebhookPayload;
  eventId: string;
}) {
  const body = JSON.stringify(input.payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signWebhookPayload(input.secret, timestamp, body);

  const response = await fetch(input.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Observo-Notifier/1.0',
      'X-Observo-Event-Id': input.eventId,
      'X-Observo-Signature': formatWebhookSignatureHeader(
        timestamp,
        signature
      ),
    },
    body,
    signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      responseBody || `Webhook delivery failed (${response.status})`
    );
  }
}
