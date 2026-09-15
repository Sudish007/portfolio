// /api/messages — owner-only inbox for contact-form messages (Netlify Blobs).
// GET              -> { messages: [{ key, name, contact, message, at, ip, ua }] } (newest first, max 100)
// DELETE ?key=...  -> { ok: true }
import { isOwner, json, store } from '../lib/shared.mjs';

export default async (req) => {
  if (!(await isOwner(req))) return json({ error: 'unauthorized' }, 401);
  const s = store('sk-messages');

  if (req.method === 'GET') {
    const { blobs } = await s.list();
    const keys = blobs.map(b => b.key).sort().reverse().slice(0, 100);   // ISO-based keys: lexicographic = chronological
    const messages = (await Promise.all(keys.map(async key => {
      try { return { key, ...(await s.get(key, { type: 'json' })) }; } catch { return null; }
    }))).filter(Boolean);
    return json({ messages });
  }

  if (req.method === 'DELETE') {
    const key = new URL(req.url).searchParams.get('key') || '';
    if (!/^[\w-]{10,80}$/.test(key)) return json({ error: 'bad key' }, 400);
    await s.delete(key);
    return json({ ok: true });
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/messages' };
