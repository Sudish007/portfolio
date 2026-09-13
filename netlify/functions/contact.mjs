// /api/contact — POST a message from the site's contact form.
// Always stored in Netlify Blobs (read via /api/messages or the admin inbox).
// Optionally notifies Telegram when TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID env vars are set.
import { getStore } from '@netlify/blobs';

const store = () => getStore({ name: 'sk-messages', consistency: 'strong' });

export default async (req, context) => {
  if (req.method !== 'POST') return Response.json({ error: 'method not allowed' }, { status: 405 });

  let b;
  try { b = await req.json(); } catch { return Response.json({ error: 'invalid JSON' }, { status: 400 }); }

  const name = String(b?.name ?? '').trim().slice(0, 100);
  const contact = String(b?.contact ?? '').trim().slice(0, 200);
  const message = String(b?.message ?? '').trim().slice(0, 4000);
  if (!name || !contact || message.length < 10) {
    return Response.json({ error: 'name, contact and a message of at least 10 characters are required' }, { status: 400 });
  }

  // Bot traps: hidden "website" field must stay empty, and the form must have been open >= 3 s.
  // Both fail silently with ok:true so bots get no signal.
  const honeypot = String(b?.website ?? '') !== '';
  const t0 = Number(b?.t0);
  const tooFast = !Number.isFinite(t0) || Date.now() - t0 < 3000 || Date.now() - t0 > 86_400_000;
  if (!honeypot && !tooFast) {
    const id = new Date().toISOString().replace(/[:.]/g, '-') + '-' + Math.random().toString(36).slice(2, 8);
    await store().setJSON(id, {
      name, contact, message,
      at: new Date().toISOString(),
      ip: context?.ip || req.headers.get('x-nf-client-connection-ip') || '',
      ua: (req.headers.get('user-agent') || '').slice(0, 200)
    });

    const bot = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
    if (bot && chat) {
      try {
        await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chat, text: `📮 sudish.dev message\nFrom: ${name}\nContact: ${contact}\n\n${message}`.slice(0, 3900) })
        });
      } catch { /* notification is best-effort; the message is already stored */ }
    }
  }

  return Response.json({ ok: true });
};

export const config = { path: '/api/contact' };
