// /api/messages — owner-only inbox for contact-form messages (Netlify Blobs).
// GET              -> { messages: [{ key, name, contact, message, at, ip, ua }] } (newest first, max 100)
// DELETE ?key=...  -> { ok: true }
import { getStore } from '@netlify/blobs';

const OWNER_LOGIN = 'Sudish007';
const store = () => getStore({ name: 'sk-messages', consistency: 'strong' });

async function isOwner(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  if (process.env.NETLIFY_DEV === 'true' && process.env.SK_DEV_FAKE_LOGIN) {
    return process.env.SK_DEV_FAKE_LOGIN === OWNER_LOGIN;
  }
  try {
    const r = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'sudish-dev-admin' }
    });
    if (!r.ok) return false;
    return (await r.json()).login === OWNER_LOGIN;
  } catch {
    return false;
  }
}

export default async (req) => {
  if (!(await isOwner(req))) return Response.json({ error: 'unauthorized' }, { status: 401 });

  if (req.method === 'GET') {
    const { blobs } = await store().list();
    const keys = blobs.map(b => b.key).sort().reverse().slice(0, 100);   // ISO-based keys: lexicographic = chronological
    const messages = (await Promise.all(keys.map(async key => {
      try { return { key, ...(await store().get(key, { type: 'json' })) }; } catch { return null; }
    }))).filter(Boolean);
    return Response.json({ messages }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'DELETE') {
    const key = new URL(req.url).searchParams.get('key') || '';
    if (!/^[\w-]{10,80}$/.test(key)) return Response.json({ error: 'bad key' }, { status: 400 });
    await store().delete(key);
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'method not allowed' }, { status: 405 });
};

export const config = { path: '/api/messages' };
