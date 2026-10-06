// /api/fit — JD fit check. A recruiter pastes a job description; an LLM compares it with the structured
// public profile (netlify/lib/profile.mjs) and returns a schema-constrained report (netlify/lib/fit.mjs).
//   GET  -> { enabled }                enabled = FIT_API_KEY present AND config.fitCheck.enabled !== false
//   POST -> { report, cached? }        body: { jd, company?, role?, website (honeypot), t0 }
// Provider: any OpenAI-compatible chat-completions endpoint.
//   FIT_API_KEY        required (the browser never sees it)
//   FIT_API_URL        default: Gemini's OpenAI-compatible endpoint (free tier). Groq / OpenAI / OpenRouter work too.
//   FIT_MODEL          default: gemini-2.5-flash
//   FIT_HOURLY_LIMIT   checks per IP per hour (default 6)
// Guardrails: 200-8000 char JD, honeypot + time trap, per-IP hourly limit, 7-day cache keyed by JD hash,
// 8.5 s model timeout (Netlify synchronous functions stop at 10 s), output coerced to a fixed shape.
import { createHash } from 'node:crypto';
import { json, store, getConfig, notifyTelegram } from '../lib/shared.mjs';
import { askModel, MODEL } from '../lib/fit.mjs';

const LIMIT = () => Math.max(1, parseInt(process.env.FIT_HOURLY_LIMIT || '6', 10) || 6);
const CACHE_MS = 7 * 86_400_000;
const sha = s => createHash('sha256').update(s).digest('hex');

export default async (req, context) => {
  const cfg = await getConfig();
  const enabled = !!process.env.FIT_API_KEY && cfg.fitCheck?.enabled !== false;
  if (req.method === 'GET') return json({ enabled });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
  if (!enabled) return json({ error: 'disabled' }, 503);

  let b;
  try { b = await req.json(); } catch { return json({ error: 'invalid JSON' }, 400); }
  const jd = String(b?.jd ?? '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 8000);
  const company = String(b?.company ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const role = String(b?.role ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  if (jd.length < 200) return json({ error: 'jd too short' }, 400);
  // Bot traps: the hidden field must be empty and the dialog must have been open for at least 2 s.
  const t0 = Number(b?.t0);
  if (String(b?.website ?? '') !== '' || !Number.isFinite(t0) || Date.now() - t0 < 2000 || Date.now() - t0 > 86_400_000) return json({ error: 'rejected' }, 400);

  const st = store('sk-fit');
  const key = 'c:' + sha(`${MODEL()}|${role.toLowerCase()}|${company.toLowerCase()}|${jd.toLowerCase()}`);
  const hit = await st.get(key, { type: 'json' }).catch(() => null);
  if (hit?.report && Date.now() - (hit.at || 0) < CACHE_MS) return json({ report: hit.report, cached: true });

  // Per-IP hourly limit (the IP is stored hashed). Not atomic, which is fine for abuse-limiting.
  const ip = context?.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  const rk = `rl:${sha(ip).slice(0, 16)}:${Math.floor(Date.now() / 3_600_000)}`;
  const n = (await st.get(rk, { type: 'json' }).catch(() => null))?.n || 0;
  if (n >= LIMIT()) return json({ error: 'rate limited' }, 429);
  await st.setJSON(rk, { n: n + 1 });

  const report = await askModel({ jd, company, role, availability: cfg.availability || {} });
  if (!report) return json({ error: 'model error' }, 502);
  await st.setJSON(key, { at: Date.now(), report });
  const tag = [role, company].filter(Boolean).join(' @ ');
  notifyTelegram(`🧭 sudish.dev JD fit check: ${report.verdict} ${report.score}/100${tag ? ` — ${tag}` : ''}\n${report.headline}`).catch(() => {});
  return json({ report });
};

export const config = { path: '/api/fit' };
