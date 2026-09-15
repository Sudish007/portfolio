// /api/config — live site configuration, stored in Netlify Blobs.
// GET  -> { config: <object|null> }   (null = no live config yet; site falls back to assets/config.js defaults)
// PUT  -> { ok: true }                (owner only; body = { config: {...} }; applies instantly, no redeploy)
import { isOwner, json, store } from '../lib/shared.mjs';

export default async (req) => {
  if (req.method === 'GET') {
    let cfg = null;
    try { cfg = await store('sk-site').get('config', { type: 'json' }); } catch { /* blob store unavailable -> defaults */ }
    return json({ config: cfg ?? null });
  }

  if (req.method === 'PUT') {
    if (!(await isOwner(req))) return json({ error: 'unauthorized' }, 401);
    let body;
    try { body = await req.json(); } catch { return json({ error: 'invalid JSON' }, 400); }
    const cfg = body?.config;
    if (!cfg || typeof cfg !== 'object' || !cfg.github || !cfg.liveProjects) {
      return json({ error: 'config must be an object with github and liveProjects' }, 400);
    }
    if (JSON.stringify(cfg).length > 400_000) return json({ error: 'config too large' }, 413);
    await store('sk-site').setJSON('config', cfg);
    return json({ ok: true });
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/config' };
