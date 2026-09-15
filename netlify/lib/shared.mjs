// Shared helpers for sudish.dev Netlify Functions.
// Lives outside netlify/functions so it is bundled as a module, not deployed as an endpoint.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import '../../assets/config.js';                 // side effect: sets globalThis.SK_CONFIG (committed defaults)

export const OWNER_LOGIN = 'Sudish007';
export const SITE_URL = (process.env.URL || 'https://sudish.dev').replace(/\/$/, '');
export const OWNER_NAME = 'Sudish Kumar';
export const OWNER_EMAIL = 'sudishnit@gmail.com';

export const json = (body, status = 200, headers = {}) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });

export const store = name => getStore({ name, consistency: 'strong' });

/* ---------- identity: the owner's GitHub token is the credential ---------- */
export async function isOwner(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  // Local-test escape hatch; only honoured under `netlify dev` / the node harness, never in production.
  if (process.env.NETLIFY_DEV === 'true' && process.env.SK_DEV_FAKE_LOGIN) return process.env.SK_DEV_FAKE_LOGIN === OWNER_LOGIN;
  try {
    const r = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'sudish-dev-admin' }
    });
    if (!r.ok) return false;
    return (await r.json()).login === OWNER_LOGIN;
  } catch { return false; }
}

/* ---------- site config: live blob, else committed defaults ---------- */
export async function getConfig() {
  try {
    const live = await store('sk-site').get('config', { type: 'json' });
    if (live?.github && live?.liveProjects) return live;
  } catch { /* fall through */ }
  return globalThis.SK_CONFIG || {};
}

/* ---------- crypto ---------- */
export const hmacHex = (secret, data) => createHmac('sha256', secret).update(data).digest('hex');
export function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
const b64u = s => Buffer.from(s).toString('base64url');
const unb64u = s => Buffer.from(s, 'base64url').toString();
export function signToken(payload, secret) {
  const body = b64u(JSON.stringify(payload));
  return `${body}.${hmacHex(secret, body)}`;
}
export function verifyToken(token, secret) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig || !safeEqual(hmacHex(secret, body), sig)) return null;
  try { return JSON.parse(unb64u(body)); } catch { return null; }
}

/* ---------- notifications (all best-effort) ---------- */
export async function notifyTelegram(text) {
  const bot = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!bot || !chat) return false;
  try {
    const r = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: String(text).slice(0, 3900) })
    });
    return r.ok;
  } catch { return false; }
}

// Transactional email via Brevo's HTTP API. Requires BREVO_API_KEY and a Brevo-verified MAIL_FROM sender.
export async function sendEmail({ to, toName, subject, html, text }) {
  const key = process.env.BREVO_API_KEY, from = process.env.MAIL_FROM;
  if (!key || !from || !to) return false;
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: OWNER_NAME, email: from },
        replyTo: { name: OWNER_NAME, email: OWNER_EMAIL },
        to: [{ email: to, name: toName || to }],
        subject, htmlContent: html, textContent: text
      })
    });
    return r.ok;
  } catch { return false; }
}

export const escHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const inr = paise => '₹' + (paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
