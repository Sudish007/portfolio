// POST /api/rzp/verify — called by the browser after Razorpay Checkout succeeds.
// Verifies the payment signature (HMAC-SHA256 of "order_id|payment_id" with the key secret),
// marks the order paid and fulfils it. The webhook does the same independently as a safety net.
import { json, hmacHex, safeEqual } from '../lib/shared.mjs';
import { getOrder, markPaid, fulfil, ORDER_ID_RE, PAYMENT_ID_RE } from '../lib/orders.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return json({ error: 'payments_not_configured' }, 503);

  let b;
  try { b = await req.json(); } catch { return json({ error: 'invalid JSON' }, 400); }
  const orderId = String(b?.orderId ?? ''), paymentId = String(b?.paymentId ?? ''), signature = String(b?.signature ?? '');
  if (!ORDER_ID_RE.test(orderId) || !PAYMENT_ID_RE.test(paymentId) || !/^[a-f0-9]{64}$/.test(signature)) {
    return json({ error: 'bad parameters' }, 400);
  }
  if (!safeEqual(hmacHex(keySecret, `${orderId}|${paymentId}`), signature)) {
    return json({ error: 'signature mismatch' }, 400);
  }

  const order = await getOrder(orderId);
  if (!order) return json({ error: 'order not found' }, 404);

  await markPaid(order, { paymentId, via: 'checkout' });
  const { next } = await fulfil(order);
  return json({ ok: true, paymentId, serviceName: order.serviceName, amount: order.amount, next });
};

export const config = { path: '/api/rzp/verify' };
