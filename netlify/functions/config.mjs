// /api/config — live site configuration, stored in Netlify Blobs.
// GET  -> { config: <object|null> }   (null = no live config yet; site falls back to assets/config.js defaults)
// PUT  -> { ok: true }                (owner only; body = { config: {...} }; applies instantly, no redeploy)
import { getStore } from '@netlify/blobs';

const OWNER_LOGIN = 'Sudish007';
const store = () => getStore({ name: 'sk-site', consistency: 'strong' });

// Ownership check: the bearer token must belong to the GitHub account that owns this site.
// No secrets are stored on Netlify for this — GitHub is the identity provider.
async function isOwner(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  // Local testing escape hatch: only active under `netlify dev`, never in production.
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
  if (req.method === 'GET') {
    let cfg = null;
    try { cfg = await store().get('config', { type: 'json' }); } catch { /* blob store unavailable -> defaults */ }
    return Response.json({ config: cfg ?? null }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (req.method === 'PUT') {
    if (!(await isOwner(req))) return Response.json({ error: 'unauthorized' }, { status: 401 });
    let body;
    try { body = await req.json(); } catch { return Response.json({ error: 'invalid JSON' }, { status: 400 }); }
    const cfg = body?.config;
    if (!cfg || typeof cfg !== 'object' || !cfg.github || !cfg.liveProjects) {
      return Response.json({ error: 'config must be an object with github and liveProjects' }, { status: 400 });
    }
    if (JSON.stringify(cfg).length > 200_000) return Response.json({ error: 'config too large' }, { status: 413 });
    await store().setJSON('config', cfg);
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'method not allowed' }, { status: 405 });
};

export const config = { path: '/api/config' };
