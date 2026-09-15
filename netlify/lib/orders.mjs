// Order storage + fulfilment shared by the Razorpay endpoints.
// Blob store 'sk-orders': key = Razorpay order id -> order JSON.
import { store, getConfig, signToken, sendEmail, notifyTelegram, escHtml, inr, SITE_URL, OWNER_NAME, OWNER_EMAIL } from './shared.mjs';

export const orders = () => store('sk-orders');
export const DOWNLOAD_TTL_MS = 7 * 24 * 3600 * 1000;
export const downloadSecret = () => process.env.DOWNLOAD_SECRET || process.env.RAZORPAY_KEY_SECRET || '';

export const ORDER_ID_RE = /^order_[A-Za-z0-9]{6,40}$/;
export const PAYMENT_ID_RE = /^pay_[A-Za-z0-9]{6,40}$/;
export const SERVICE_ID_RE = /^[a-z0-9-]{2,60}$/;

/** Purchasable service from the live config (hidden and quote-only items are not purchasable). */
export async function findPurchasable(serviceId) {
  const cfg = await getConfig();
  const svc = cfg.services;
  if (!svc || svc.enabled === false) return { error: 'services_disabled' };
  const item = (svc.items || []).find(i => i && i.id === serviceId);
  if (!item) return { error: 'unknown_service' };
  if (item.hidden || item.type === 'quote') return { error: 'not_purchasable' };
  const price = Number(item.price);
  if (!Number.isInteger(price) || price < 1 || price > 1_000_000) return { error: 'bad_price' };
  return { item, cfg };
}

export async function getOrder(id) {
  if (!ORDER_ID_RE.test(id || '')) return null;
  try { return await orders().get(id, { type: 'json' }); } catch { return null; }
}
export const saveOrder = o => orders().setJSON(o.id, o);

/** Idempotently mark an order paid. Returns { order, changed }. */
export async function markPaid(order, { paymentId, via, extra = {} }) {
  if (order.status === 'paid') return { order, changed: false };
  Object.assign(order, { status: 'paid', paymentId, via, paidAt: new Date().toISOString(), ...extra });
  await saveOrder(order);
  return { order, changed: true };
}

/** What the customer should do next; computed from config so admin edits take effect immediately. */
export function nextSteps(order, cfg) {
  const svc = cfg.services || {};
  const item = (svc.items || []).find(i => i && i.id === order.serviceId) || {};
  const next = { type: item.type || 'fixed', after: item.after || '' };
  if (item.type === 'digital' && downloadSecret()) {
    const token = signToken({ o: order.id, p: order.serviceId, e: Date.now() + DOWNLOAD_TTL_MS }, downloadSecret());
    next.downloadUrl = `${SITE_URL}/api/download?t=${token}`;
  }
  if (item.booking) {
    if (svc.bookingUrl) next.bookingUrl = svc.bookingUrl;
    else next.after = "I'll email you within 24 hours to schedule your session.";
  }
  return next;
}

/** Fulfil a paid order: email the customer (once, unless forced) and ping the owner. */
export async function fulfil(order, { force = false } = {}) {
  const cfg = await getConfig();
  const next = nextSteps(order, cfg);
  order.next = { type: next.type, bookingUrl: next.bookingUrl || '', hasDownload: !!next.downloadUrl };
  let emailed = false;
  if (force || !order.notified) {
    emailed = await sendEmail({
      to: order.email, toName: order.name,
      subject: `Payment received — ${order.serviceName}`,
      html: receiptHtml(order, next), text: receiptText(order, next)
    });
    if (emailed) order.notified = true;
    if (!order.ownerPinged) {
      order.ownerPinged = await notifyTelegram(
        `💰 Paid ${inr(order.amount)} — ${order.serviceName}\n${order.name} · ${order.email}${order.phone ? ' · ' + order.phone : ''}\n${order.paymentId || ''}\n${SITE_URL}/admin.html`);
    }
    await saveOrder(order);
  }
  return { next, emailed };
}

function receiptText(o, next) {
  const lines = [
    `Hi ${o.name},`, '',
    `Thanks — your payment of ${inr(o.amount)} for "${o.serviceName}" is confirmed.`,
    `Payment ID: ${o.paymentId || '-'}   Order: ${o.id}`, '',
    'Next steps:', next.after || 'I will be in touch within 24 hours.'
  ];
  if (next.bookingUrl) lines.push('', `Book your slot: ${next.bookingUrl}`);
  if (next.downloadUrl) lines.push('', `Download (valid 7 days): ${next.downloadUrl}`);
  lines.push('', `Questions? Reply to this email or WhatsApp +91 98701 76701.`, '', `— ${OWNER_NAME}`, SITE_URL);
  return lines.join('\n');
}
function receiptHtml(o, next) {
  const btn = (href, label) => `<p style="margin:18px 0"><a href="${escHtml(href)}" style="background:#06b6d4;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600;display:inline-block">${escHtml(label)}</a></p>`;
  return `<!doctype html><html><body style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#12131c;line-height:1.6;max-width:560px;margin:0 auto;padding:24px">
<h2 style="margin:0 0 12px">Payment received ✓</h2>
<p>Hi ${escHtml(o.name)},</p>
<p>Thanks — your payment of <b>${inr(o.amount)}</b> for <b>${escHtml(o.serviceName)}</b> is confirmed.</p>
<table style="font-size:14px;color:#4b5063;border-collapse:collapse"><tr><td style="padding:2px 12px 2px 0">Payment ID</td><td><code>${escHtml(o.paymentId || '-')}</code></td></tr><tr><td style="padding:2px 12px 2px 0">Order</td><td><code>${escHtml(o.id)}</code></td></tr></table>
<h3 style="margin:22px 0 6px">Next steps</h3>
<p>${escHtml(next.after || 'I will be in touch within 24 hours.')}</p>
${next.bookingUrl ? btn(next.bookingUrl, 'Book your slot') : ''}
${next.downloadUrl ? btn(next.downloadUrl, 'Download your files') + '<p style="font-size:12px;color:#858a9c">Link valid for 7 days.</p>' : ''}
<p style="margin-top:26px;font-size:14px;color:#4b5063">Questions? Reply to this email or WhatsApp <a href="https://wa.me/919870176701">+91 98701 76701</a>.</p>
<p style="font-size:14px">— ${escHtml(OWNER_NAME)}<br><a href="${SITE_URL}">${SITE_URL.replace('https://', '')}</a> · <a href="mailto:${OWNER_EMAIL}">${OWNER_EMAIL}</a></p>
</body></html>`;
}
