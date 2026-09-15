// POST /api/rzp/order — create a Razorpay Order for a purchasable service.
// The price always comes from the server-side config; the browser only sends the service id + customer details.
import { json } from '../lib/shared.mjs';
import { findPurchasable, saveOrder, SERVICE_ID_RE } from '../lib/orders.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s-]{5,19}$/;

export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  const keyId = process.env.RAZORPAY_KEY_ID, keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return json({ error: 'payments_not_configured' }, 503);

  let b;
  try { b = await req.json(); } catch { return json({ error: 'invalid JSON' }, 400); }
  const serviceId = String(b?.serviceId ?? '').trim();
  const name = String(b?.name ?? '').trim().slice(0, 100);
  const email = String(b?.email ?? '').trim().slice(0, 200);
  const phone = String(b?.phone ?? '').trim().slice(0, 20);
  if (!SERVICE_ID_RE.test(serviceId)) return json({ error: 'bad service id' }, 400);
  if (!name) return json({ error: 'name is required' }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: 'a valid email is required' }, 400);
  if (phone && !PHONE_RE.test(phone)) return json({ error: 'phone looks invalid' }, 400);

  const found = await findPurchasable(serviceId);
  if (found.error) return json({ error: found.error }, found.error === 'unknown_service' ? 404 : 400);
  const { item, cfg } = found;
  const amount = item.price * 100;                                   // paise
  const currency = cfg.services?.currency || 'INR';
  const receipt = `sk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  let rz;
  try {
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, receipt, notes: { serviceId, service: item.name, name, email } })
    });
    rz = await r.json().catch(() => ({}));
    if (!r.ok || !rz?.id) return json({ error: 'razorpay_error', detail: rz?.error?.description || `HTTP ${r.status}` }, 502);
  } catch {
    return json({ error: 'razorpay_unreachable' }, 502);
  }

  await saveOrder({
    id: rz.id, receipt, serviceId, serviceName: item.name, amount, currency,
    name, email, phone, status: 'created', createdAt: new Date().toISOString(),
    ip: context?.ip || req.headers.get('x-nf-client-connection-ip') || ''
  });

  return json({
    orderId: rz.id, amount, currency, keyId,
    description: item.name,
    prefill: { name, email, contact: phone }
  });
};

export const config = { path: '/api/rzp/order' };
