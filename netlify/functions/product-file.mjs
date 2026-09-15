// /api/product-file — owner-only storage for digital products (served to buyers via /api/download).
// GET                                       -> { products: [{ id, filename, contentType, size, uploadedAt }] }
// PUT { id, filename, contentType, data }   -> { ok, size }   (data = base64; max ~4.5 MB)
// DELETE ?id=...                            -> { ok }
import { isOwner, json, store } from '../lib/shared.mjs';
import { SERVICE_ID_RE } from '../lib/orders.mjs';

const MAX_BYTES = 4.5 * 1024 * 1024;

export default async (req) => {
  if (!(await isOwner(req))) return json({ error: 'unauthorized' }, 401);
  const s = store('sk-products');

  if (req.method === 'GET') {
    const { blobs } = await s.list();
    const products = (await Promise.all(blobs.map(async ({ key }) => {
      try { const m = await s.getMetadata(key); return m ? { id: key, ...(m.metadata || {}) } : null; } catch { return null; }
    }))).filter(Boolean);
    return json({ products });
  }

  if (req.method === 'PUT') {
    let b;
    try { b = await req.json(); } catch { return json({ error: 'invalid JSON' }, 400); }
    const id = String(b?.id ?? '');
    const filename = String(b?.filename ?? '').replace(/[^\w.\- ()]/g, '_').slice(0, 120);
    const contentType = /^[\w.+-]+\/[\w.+-]+$/.test(String(b?.contentType ?? '')) ? String(b.contentType) : 'application/octet-stream';
    if (!SERVICE_ID_RE.test(id)) return json({ error: 'bad product id (use the service id)' }, 400);
    if (!filename) return json({ error: 'filename required' }, 400);
    let bytes;
    try { bytes = Buffer.from(String(b?.data ?? ''), 'base64'); } catch { return json({ error: 'bad base64' }, 400); }
    if (!bytes.length) return json({ error: 'empty file' }, 400);
    if (bytes.length > MAX_BYTES) return json({ error: `file too large (max ${Math.floor(MAX_BYTES / 1024 / 1024 * 10) / 10} MB)` }, 413);
    await s.set(id, bytes, { metadata: { filename, contentType, size: bytes.length, uploadedAt: new Date().toISOString() } });
    return json({ ok: true, size: bytes.length });
  }

  if (req.method === 'DELETE') {
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!SERVICE_ID_RE.test(id)) return json({ error: 'bad id' }, 400);
    await s.delete(id);
    return json({ ok: true });
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/product-file' };
