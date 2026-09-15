// /api/orders — owner-only order management.
// GET                          -> { orders: [...newest first], totals: { paidCount, paidAmount } }
// PATCH { id, fulfilled?, note? } -> { order }
// POST  { id, action: 'resend' } -> { ok, emailed }   (re-send the customer's confirmation email)
import { isOwner, json } from '../lib/shared.mjs';
import { orders, getOrder, saveOrder, fulfil } from '../lib/orders.mjs';

export default async (req) => {
  if (!(await isOwner(req))) return json({ error: 'unauthorized' }, 401);

  if (req.method === 'GET') {
    const { blobs } = await orders().list();
    const keys = blobs.map(b => b.key).slice(0, 300);
    const list = (await Promise.all(keys.map(async k => { try { return await orders().get(k, { type: 'json' }); } catch { return null; } }))).filter(Boolean);
    list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const paid = list.filter(o => o.status === 'paid');
    return json({ orders: list, totals: { paidCount: paid.length, paidAmount: paid.reduce((s, o) => s + (o.amount || 0), 0) } });
  }

  let b;
  try { b = await req.json(); } catch { return json({ error: 'invalid JSON' }, 400); }
  const order = await getOrder(String(b?.id ?? ''));
  if (!order) return json({ error: 'order not found' }, 404);

  if (req.method === 'PATCH') {
    if (typeof b.fulfilled === 'boolean') { order.fulfilled = b.fulfilled; order.fulfilledAt = b.fulfilled ? new Date().toISOString() : undefined; }
    if (typeof b.note === 'string') order.note = b.note.slice(0, 2000);
    await saveOrder(order);
    return json({ order });
  }

  if (req.method === 'POST' && b.action === 'resend') {
    if (order.status !== 'paid') return json({ error: 'order is not paid' }, 400);
    const { emailed } = await fulfil(order, { force: true });
    return json({ ok: true, emailed });
  }

  return json({ error: 'method not allowed' }, 405);
};

export const config = { path: '/api/orders' };
