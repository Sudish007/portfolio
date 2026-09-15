// POST /api/rzp/webhook — Razorpay webhook (events: payment.captured, payment.failed).
// Source of truth for payment state even if the customer closed the browser before /verify ran.
// Configure in Razorpay Dashboard → Webhooks with the same secret as RAZORPAY_WEBHOOK_SECRET.
import { json, hmacHex, safeEqual, notifyTelegram, inr } from '../lib/shared.mjs';
import { getOrder, markPaid, fulfil, saveOrder } from '../lib/orders.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return json({ error: 'webhook_not_configured' }, 503);

  const raw = await req.text();
  const sig = req.headers.get('x-razorpay-signature') || '';
  if (!/^[a-f0-9]{64}$/.test(sig) || !safeEqual(hmacHex(secret, raw), sig)) return json({ error: 'bad signature' }, 400);

  let evt;
  try { evt = JSON.parse(raw); } catch { return json({ error: 'invalid JSON' }, 400); }
  const pay = evt?.payload?.payment?.entity;
  const orderId = pay?.order_id;

  if (evt.event === 'payment.captured' && orderId) {
    const order = await getOrder(orderId);
    if (!order) {                                        // e.g. a Payment Link created outside this site
      await notifyTelegram(`💰 Razorpay payment ${inr(pay.amount || 0)} captured for unknown order ${orderId} (${pay.email || ''})`);
      return json({ ok: true, unknownOrder: true });
    }
    if (order.amount !== pay.amount) {
      order.flags = [...(order.flags || []), `amount mismatch: webhook ${pay.amount} vs order ${order.amount}`];
    }
    await markPaid(order, { paymentId: pay.id, via: 'webhook', extra: { method: pay.method || '' } });
    await fulfil(order);
    return json({ ok: true });
  }

  if (evt.event === 'payment.failed' && orderId) {
    const order = await getOrder(orderId);
    if (order && order.status === 'created') {
      order.status = 'failed';
      order.failure = { code: pay.error_code || '', reason: pay.error_description || pay.error_reason || '', at: new Date().toISOString() };
      await saveOrder(order);
    }
    return json({ ok: true });
  }

  return json({ ok: true, ignored: evt.event || 'unknown' });
};

export const config = { path: '/api/rzp/webhook' };
