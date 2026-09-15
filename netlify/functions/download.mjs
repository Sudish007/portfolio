// GET /api/download?t=<signed token> — deliver a purchased digital product.
// Token = { o: orderId, p: productId, e: expiryMs } signed with DOWNLOAD_SECRET (falls back to the Razorpay key secret).
import { json, verifyToken, store } from '../lib/shared.mjs';
import { getOrder, saveOrder, downloadSecret } from '../lib/orders.mjs';

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'method not allowed' }, 405);
  const secret = downloadSecret();
  if (!secret) return json({ error: 'downloads_not_configured' }, 503);

  const t = new URL(req.url).searchParams.get('t') || '';
  const p = verifyToken(t, secret);
  if (!p?.o || !p?.p || !p?.e) return json({ error: 'invalid link' }, 403);
  if (Date.now() > Number(p.e)) return json({ error: 'link expired — reply to your confirmation email for a fresh one' }, 410);

  const order = await getOrder(String(p.o));
  if (!order || order.status !== 'paid' || order.serviceId !== p.p) return json({ error: 'no paid order for this link' }, 403);

  const file = await store('sk-products').getWithMetadata(String(p.p), { type: 'arrayBuffer' });
  if (!file?.data) return json({ error: 'file not uploaded yet — I will email it to you shortly' }, 404);
  const meta = file.metadata || {};

  order.downloads = (order.downloads || 0) + 1;
  saveOrder(order).catch(() => {});                 // best-effort counter

  const filename = String(meta.filename || `${p.p}.bin`).replace(/[^\w.\- ]/g, '_');
  return new Response(file.data, {
    status: 200,
    headers: {
      'Content-Type': String(meta.contentType || 'application/octet-stream'),
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(file.data.byteLength),
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex'
    }
  });
};

export const config = { path: '/api/download' };
