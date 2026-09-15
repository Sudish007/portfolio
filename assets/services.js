/* sudish.dev — services storefront (assets/services.js)
   Renders the catalog from the live config, runs Razorpay Checkout via the site's own API,
   and degrades to WhatsApp booking when payments aren't configured or a blocker eats checkout.js. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const WA = 'https://wa.me/919870176701?text=';
const inr = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

/* ---------- theme / nav (shared behaviour with the main page) ---------- */
const themeBtn = $('#themeBtn'), themeIcon = $('#themeIcon');
const curTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';
const applyTheme = t => { document.documentElement.setAttribute('data-theme', t); try { localStorage.setItem('sk-theme', t); } catch {} if (themeIcon) themeIcon.textContent = t === 'dark' ? '🌙' : '☀️'; };
applyTheme(curTheme());
themeBtn?.addEventListener('click', e => {
  const next = curTheme() === 'dark' ? 'light' : 'dark';
  if (!document.startViewTransition || reduced.matches) return applyTheme(next);
  const x = e.clientX || innerWidth - 60, y = e.clientY || 32, r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(() => applyTheme(next)).ready.then(() => document.documentElement.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
});
const burger = $('#burger'), links = $('#navLinks');
burger?.addEventListener('click', () => { const o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', String(o)); links.classList.toggle('open', o); });
addEventListener('scroll', () => $('.nav')?.classList.toggle('scrolled', scrollY > 8), { passive: true });
if (!CSS.supports('animation-timeline: scroll()')) addEventListener('scroll', () => { const h = document.documentElement.scrollHeight - innerHeight; $('.progress')?.style.setProperty('--sp', h > 0 ? (scrollY / h).toFixed(4) : '0'); }, { passive: true });
if (matchMedia('(hover: hover)').matches) document.addEventListener('pointermove', e => { const c = e.target.closest?.('.card'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });

const toastEl = $('#toast'); let toastT = 0;
const toast = m => { if (!toastEl) return; toastEl.textContent = m; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2600); };

/* ---------- config ---------- */
const DEFAULTS = globalThis.SK_CONFIG || {};
let CFG = DEFAULTS;
async function loadConfig() {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch('/api/config', { signal: ctl.signal, cache: 'no-store' }); clearTimeout(t);
    if (r.ok) {
      const j = await r.json();
      // Live config wins, but sections it doesn't know about yet (added in code later) fall back to the committed defaults.
      if (j?.config?.github && j?.config?.liveProjects) CFG = { ...DEFAULTS, ...j.config };
    }
  } catch { /* defaults */ }
}

/* ---------- catalog ---------- */
let ITEMS = [];
function priceHtml(it) {
  const p = inr(it.price);
  if (it.unit === 'from') return `<b>from ${p}</b><small>quoted per project</small>`;
  return `<b>${p}</b><small>${esc(it.unit || 'one-time')}</small>`;
}
function render() {
  const svc = CFG.services, root = $('#catalog');
  if (!svc || svc.enabled === false) { root.innerHTML = '<p class="empty" style="padding:60px 0">Services are paused right now. <a href="./#contact">Get in touch</a> instead.</p>'; root.removeAttribute('aria-busy'); return; }
  if (svc.eyebrow) $('#svcEyebrow').textContent = svc.eyebrow;
  if (svc.title) { $('#svcTitle').textContent = svc.title; document.title = `${svc.title} | Sudish Kumar — ML Engineer`; }
  if (svc.lede) $('#svcLede').textContent = svc.lede;
  ITEMS = (svc.items || []).filter(i => i && i.id && !i.hidden);
  const groups = (svc.groups || []).filter(g => ITEMS.some(i => i.group === g.id));
  const orphan = ITEMS.filter(i => !groups.some(g => g.id === i.group));
  if (orphan.length) groups.push({ id: '_other', title: 'More', items: orphan });
  root.innerHTML = groups.map(g => {
    const items = g.items || ITEMS.filter(i => i.group === g.id);
    return `<section class="svc-group" id="g-${esc(g.id)}" aria-labelledby="gh-${esc(g.id)}">
<div class="svc-group-head"><h2 id="gh-${esc(g.id)}">${esc(g.title)}</h2>${g.blurb ? `<p>${esc(g.blurb)}</p>` : ''}</div>
<div class="svc-grid">${items.map(card).join('')}</div></section>`;
  }).join('');
  root.removeAttribute('aria-busy');
}
function card(it) {
  const cta = it.type === 'quote' ? 'Request a quote' : it.type === 'digital' ? `Buy & download · ${inr(it.price)}` : `Pay ${inr(it.price)} & book`;
  return `<article class="card svc" data-id="${esc(it.id)}">
<div class="svc-top"><div><h3>${esc(it.name)}</h3>${it.meta ? `<div class="meta">${esc(it.meta)}</div>` : ''}</div><div class="price">${priceHtml(it)}</div></div>
${it.desc ? `<p class="desc">${esc(it.desc)}</p>` : ''}
${(it.bullets || []).length ? `<ul>${it.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
<div class="svc-cta"><button type="button" class="btn ${it.type === 'quote' ? 'btn-ghost' : 'btn-primary'}" data-buy="${esc(it.id)}">${cta}</button>${it.type === 'digital' ? '<span class="badge-digital">instant delivery</span>' : ''}</div>
</article>`;
}

/* ---------- dialogs ---------- */
const buyDlg = $('#buyDlg'), quoteDlg = $('#quoteDlg'), doneDlg = $('#doneDlg');
$$('[data-close]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
[buyDlg, quoteDlg, doneDlg].forEach(d => d?.addEventListener('click', e => { if (e.target === d) d.close(); }));
let current = null;

function openFor(id) {
  const it = ITEMS.find(i => i.id === id); if (!it) return;
  current = it;
  if (it.type === 'quote') {
    $('#quoteTitle').textContent = it.name;
    $('#quotePrice').textContent = `from ${inr(it.price)} · ${it.meta || ''}`.replace(/ · $/, '');
    $('#qMsg').value = `Hi Sudish, I'm interested in "${it.name}". Here's what I need:\n`;
    $('#quoteWa').href = WA + encodeURIComponent(`Hi Sudish, I'd like a quote for "${it.name}".`);
    $('#quoteErr').textContent = ''; $('#quoteDone').hidden = true; $('#quoteSend').disabled = false;
    quoteDlg.dataset.t0 = String(Date.now());
    quoteDlg.showModal(); $('#qName').focus();
  } else {
    $('#buyTitle').textContent = it.name;
    $('#buyPrice').textContent = `${inr(it.price)} · ${it.unit || 'one-time'}${it.meta ? ' · ' + it.meta : ''}`;
    $('#payBtn').innerHTML = `<svg fill="none" aria-hidden="true"><use href="#i-lock"/></svg> Pay ${inr(it.price)} securely`;
    $('#buyErr').textContent = ''; $('#buyFallback').hidden = true; $('#payBtn').disabled = false; $('#payBtn').hidden = false;
    $('#fallbackWa').href = WA + encodeURIComponent(`Hi Sudish, I'd like to book "${it.name}" (${inr(it.price)}). Please send me a payment link.`);
    buyDlg.showModal(); $('#bName').focus();
  }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-buy]'); if (b) openFor(b.dataset.buy); });

/* ---------- quote request -> /api/contact ---------- */
$('#quoteForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#qName').value.trim(), contact = $('#qContact').value.trim(), msg = $('#qMsg').value.trim();
  const err = $('#quoteErr');
  if (!name || !contact) return err.textContent = 'Name and a way to reach you, please.';
  if (msg.length < 10) return err.textContent = 'Add a few details about the project.';
  err.textContent = ''; $('#quoteSend').disabled = true; $('#quoteSend').textContent = 'Sending…';
  try {
    const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, contact, message: `[Quote: ${current?.name}] ${msg}`, website: $('#qHp').value, t0: Number(quoteDlg.dataset.t0) }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.error || 'failed');
    $('#quoteDone').hidden = false; $('#quoteSend').hidden = true; toast('Request sent ✓');
    setTimeout(() => { quoteDlg.close(); $('#quoteSend').hidden = false; $('#quoteForm').reset(); }, 2200);
  } catch { err.textContent = 'Could not send right now — use the WhatsApp button.'; }
  $('#quoteSend').disabled = false; $('#quoteSend').textContent = 'Send request →';
});

/* ---------- checkout -> /api/rzp/order -> Razorpay -> /api/rzp/verify ---------- */
function ensureRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise(res => {                       // checkout.js may have been blocked; try once more
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => res(!!window.Razorpay); s.onerror = () => res(false); document.head.append(s);
    setTimeout(() => res(!!window.Razorpay), 6000);
  });
}
$('#buyForm').addEventListener('submit', async e => {
  e.preventDefault();
  const it = current; if (!it) return;
  const name = $('#bName').value.trim(), email = $('#bEmail').value.trim(), phone = $('#bPhone').value.trim();
  const err = $('#buyErr'), btn = $('#payBtn');
  if (!name) return err.textContent = 'Your name, please.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err.textContent = 'A valid email is needed for your confirmation.';
  err.textContent = ''; btn.disabled = true; btn.textContent = 'Preparing secure checkout…';
  const reset = () => { btn.disabled = false; btn.innerHTML = `<svg fill="none" aria-hidden="true"><use href="#i-lock"/></svg> Pay ${inr(it.price)} securely`; };

  let order;
  try {
    const r = await fetch('/api/rzp/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serviceId: it.id, name, email, phone }) });
    order = await r.json().catch(() => ({}));
    if (r.status === 503 || (r.status === 404 && !order.orderId)) { $('#buyFallback').hidden = false; btn.hidden = true; return; }
    if (!r.ok || !order.orderId) throw new Error(order.error || `HTTP ${r.status}`);
  } catch (ex) { reset(); err.textContent = `Could not start checkout (${ex.message}). Try again or use WhatsApp.`; $('#buyFallback').hidden = false; return; }

  if (!(await ensureRazorpay())) { reset(); err.textContent = 'Razorpay checkout is blocked in this browser (ad blocker?). Book on WhatsApp instead.'; $('#buyFallback').hidden = false; return; }

  // A modal <dialog> lives in the browser's top layer, which would sit ABOVE Razorpay's iframe.
  // Close ours while Razorpay is open; bring it back (with the typed details intact) on cancel/failure.
  const reopen = () => { reset(); if (!buyDlg.open) buyDlg.showModal(); };
  buyDlg.close();

  const rzp = new window.Razorpay({
    key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
    name: 'Sudish Kumar', description: order.description, image: location.origin + '/profile.jpg',
    prefill: order.prefill, notes: { serviceId: it.id }, theme: { color: '#06b6d4' },
    modal: { ondismiss: () => { reopen(); toast('Payment cancelled — nothing was charged.'); } },
    handler: async resp => {
      try {
        toast('Verifying payment…');
        const v = await fetch('/api/rzp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: resp.razorpay_order_id, paymentId: resp.razorpay_payment_id, signature: resp.razorpay_signature }) });
        const j = await v.json().catch(() => ({}));
        if (!v.ok || !j.ok) throw new Error(j.error || `HTTP ${v.status}`);
        reset(); $('#buyForm').reset(); showDone(j);
      } catch (ex) {
        reopen();
        err.textContent = `Payment went through (ID ${resp.razorpay_payment_id}) but confirmation failed: ${ex.message}. Don't pay again — email me this ID and I'll confirm manually.`;
      }
    }
  });
  rzp.on?.('payment.failed', r => { reopen(); err.textContent = `Payment failed: ${r?.error?.description || 'declined'}. Nothing was charged — try another method.`; });
  rzp.open();
});

function showDone(j) {
  const n = j.next || {};
  let next = `<p>${esc(n.after || "I'll be in touch within 24 hours.")}</p>`;
  if (n.bookingUrl) next += `<a class="btn btn-primary" href="${esc(n.bookingUrl)}" target="_blank" rel="noopener"><svg fill="none" aria-hidden="true"><use href="#i-cal"/></svg> Book your slot</a>`;
  if (n.downloadUrl) next += `<a class="btn btn-primary" href="${esc(n.downloadUrl)}"><svg fill="none" aria-hidden="true"><use href="#i-dl"/></svg> Download now</a><p class="fine">Link valid for 7 days — it's also in your email.</p>`;
  $('#doneBody').innerHTML = `<p>Your payment for <b>${esc(j.serviceName)}</b> is confirmed.</p>
<div class="kv">Payment ID <b>${esc(j.paymentId)}</b> · ${esc(inr((j.amount || 0) / 100))}</div>
<div class="next"><b>What happens next</b>${next}</div>`;
  doneDlg.showModal();
}

/* ---------- boot ---------- */
loadConfig().then(() => {
  render();
  const want = new URLSearchParams(location.search).get('service') || (location.hash.startsWith('#buy-') ? location.hash.slice(5) : '');
  if (want) { const el = $(`.svc[data-id="${CSS.escape(want)}"]`); el?.scrollIntoView({ block: 'center' }); setTimeout(() => openFor(want), 350); }
});
})();
