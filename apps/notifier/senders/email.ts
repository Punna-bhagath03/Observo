export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log('[email skipped — RESEND_API_KEY not set]', {
      to: input.to,
      subject: input.subject,
    });
    return;
  }

  const from =
    process.env.NOTIFICATION_FROM_EMAIL ?? 'Observo <onboarding@resend.dev>';

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    let message = body || `Email send failed (${response.status})`;

    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) {
        message = parsed.message;
      }
    } catch {
      // keep raw body
    }

    throw new Error(message);
  }
}
