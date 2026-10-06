/* =====================================================================
   sudish.dev — main.js
   Vanilla ES2020+. No dependencies, no build step. Everything degrades:
   view transitions, popover, scroll-driven animations and the Clipboard
   / Share APIs are all feature-detected.
   Content knobs live in assets/config.js (window.SK_CONFIG).
   ===================================================================== */
(() => {
'use strict';

/* ---------- helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
let CFG = window.SK_CONFIG || {};   // committed defaults; may be replaced by the live config from /api/config
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const supportsView   = CSS.supports('animation-timeline: view()');
const supportsScroll = CSS.supports('animation-timeline: scroll()');
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || '') || /mac/i.test(navigator.userAgentData?.platform || '');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const openUrl = u => window.open(u, '_blank', 'noopener');

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
function rel(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  const units = [['year', 31536e3], ['month', 2592e3], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [u, sec] of units) if (Math.abs(s) >= sec) return rtf.format(-Math.round(s / sec), u);
  return 'just now';
}

/* ---------- toast ---------- */
const toastEl = $('#toast'); let toastT = 0;
function toast(msg) {
  if (!toastEl) return;
  toastEl.textContent = msg; toastEl.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

function copyText(v) {
  const ok = () => toast('Copied to clipboard ✓');
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(v).then(ok).catch(() => legacy());
  legacy();
  function legacy() {
    const ta = document.createElement('textarea'); ta.value = v; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.append(ta); ta.select();
    try { document.execCommand('copy'); ok(); } catch { toast('Copy failed — long-press to select'); }
    ta.remove();
  }
}
function share() {
  if (!navigator.share) return;
  navigator.share({ title: document.title, text: 'Sudish Kumar — ML Engineer & AI Specialist', url: location.origin + '/' }).catch(() => {});
}
function jump(el, flash) {
  el.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
  if (flash) { el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1600); }
}

/* ---------- config-driven sections: enable / disable ---------- */
function applySectionToggles() {
  // fitCheck is deliberately absent: its CTA only appears once /api/fit confirms the server has an LLM key (see initFit).
  for (const key of ['liveProjects', 'github', 'services', 'recommendations', 'certifications']) {
    const on = CFG[key]?.enabled !== false;
    $$(`[data-config="${key}"]`).forEach(el => {
      const target = el.tagName === 'A' && el.closest('li') ? el.closest('li') : el;
      target.toggleAttribute('hidden', !on);
    });
  }
}

/* ---------- Live Projects (from config) ---------- */
function renderLive() {
  const c = CFG.liveProjects, grid = $('#liveGrid');
  if (!c || c.enabled === false || !grid) return;
  if (c.eyebrow) $('#liveEyebrow').textContent = c.eyebrow;
  if (c.title) $('#liveTitle').textContent = c.title;
  $('#liveLede').textContent = c.lede || '';
  const items = (c.items || []).filter(p => p && p.name && p.hidden !== true);
  if (!items.length) { $$('[data-config="liveProjects"]').forEach(el => (el.closest('li') || el).setAttribute('hidden', '')); return; }

  grid.innerHTML = items.map((p, i) => {
    const type = String(p.type || 'web');
    const isApp = type.includes('android'), isWeb = type.includes('web');
    const plats = [];
    if (isApp) plats.push('<span class="plat"><svg fill="currentColor" aria-hidden="true"><use href="#i-android"/></svg>Android</span>');
    if (isWeb) plats.push('<span class="plat"><svg aria-hidden="true"><use href="#i-globe"/></svg>Web</span>');
    const isLive = /\b(live|running|production)\b/i.test(p.status || '');
    const acts = [];
    if (p.playStore) acts.push(`<a class="act main" href="${esc(p.playStore)}" target="_blank" rel="noopener"><svg fill="currentColor" aria-hidden="true"><use href="#i-play"/></svg>Get it on Google Play</a>`);
    if (p.apk) acts.push(`<a class="act${p.playStore ? '' : ' main'}" href="${esc(p.apk)}" download><svg fill="currentColor" aria-hidden="true"><use href="#i-android"/></svg>Download APK</a>`);
    if (p.website) acts.push(`<a class="act${(!p.playStore && !p.apk) ? ' main' : ''}" href="${esc(p.website)}" target="_blank" rel="noopener"><svg aria-hidden="true"><use href="#i-ext"/></svg>${isWeb && !isApp ? 'Open site' : 'Website'}</a>`);
    if (p.repo) acts.push(`<a class="act" href="${esc(p.repo)}" target="_blank" rel="noopener"><svg fill="currentColor" aria-hidden="true"><use href="#i-gh"/></svg>Source</a>`);
    if (isApp && !p.playStore && !p.apk) acts.push('<span class="act soon"><svg fill="currentColor" aria-hidden="true"><use href="#i-play"/></svg>Play Store — coming soon</span>');
    return `<article class="card lp reveal d${(i % 5) + 1}" style="--c:${esc(p.color || '#06b6d4')}">
<div class="lp-top"><div class="lp-ico" aria-hidden="true">${esc(p.icon || '🚀')}</div><div><h3>${esc(p.name)}</h3>
<div class="lp-meta">${plats.join('')}${p.status ? `<span class="status${isLive ? ' live' : ''}">${esc(p.status)}</span>` : ''}</div></div></div>
<p>${esc(p.tagline || '')}</p>
${(p.tags || []).length ? `<div class="tech">${p.tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
<div class="lp-actions">${acts.join('')}</div></article>`;
  }).join('');
}

/* ---------- Availability (from config): hero pill, status chip, Hire Me facts, Book-a-call ---------- */
const DEFAULT_PILL = 'Open to AI/ML Engineering Roles';
const httpUrl = u => (/^https?:\/\//i.test(String(u || '')) ? String(u) : '');
const bookingUrl = () => httpUrl(CFG.availability?.bookingUrl);
const bookingLabel = () => CFG.availability?.bookingLabel || 'Book a 20-min intro call';
function renderAvailability() {
  const a = CFG.availability; if (!a) return;
  const pill = $('#pill'), pt = $('#pillText');
  if (pill) pill.dataset.status = ['open', 'interviewing', 'closed'].includes(a.status) ? a.status : 'open';
  // A customised pill is shown as written in every language; the stock English pill keeps its translations.
  if (pt && a.pill && a.pill !== DEFAULT_PILL) { pt.removeAttribute('data-i18n'); pt.textContent = a.pill; }
  const hud = $('#hudAvail');
  if (hud) { hud.textContent = a.available ? `Available: ${a.available}` : ''; hud.closest('span').hidden = !a.available; }
  for (const [id, v] of [['#avRoles', a.roles], ['#avLocation', a.location], ['#avNotice', a.notice], ['#avAvailable', a.available]]) {
    const el = $(id); if (!el) continue;
    el.textContent = v || ''; el.parentElement.hidden = !v;
  }
  const url = bookingUrl(), btn = $('#bookCall'), card = $('#bookCard');
  if (btn) { btn.hidden = !url; if (url) { btn.href = url; btn.querySelector('span').textContent = bookingLabel(); } }
  if (card) { card.hidden = !url; if (url) { card.href = url; $('#bookCardText').textContent = bookingLabel(); } }
}

/* ---------- Recommendations (from config): hidden until it has at least one quote ---------- */
function renderRecommendations() {
  const c = CFG.recommendations, sec = $('#recommendations'), grid = $('#recGrid');
  if (!sec || !grid) return;
  const items = (c?.enabled === false ? [] : (c?.items || [])).filter(r => r && r.name && r.text && r.hidden !== true);
  if (!items.length) { sec.hidden = true; return; }
  sec.hidden = false;
  if (c.eyebrow) $('#recEyebrow').textContent = c.eyebrow;
  if (c.title) $('#recTitle').textContent = c.title;
  $('#recLede').textContent = c.lede || '';
  const initials = n => String(n).trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  grid.innerHTML = items.map((r, i) => {
    const url = httpUrl(r.url), who = [r.role, r.company].filter(Boolean).join(' · ');
    return `<figure class="card rec reveal d${(i % 5) + 1}">
<blockquote><p>${esc(r.text)}</p></blockquote>
<figcaption><span class="rec-av" aria-hidden="true">${httpUrl(r.avatar) ? `<img src="${esc(r.avatar)}" alt="" loading="lazy">` : esc(initials(r.name))}</span>
<div class="rec-who"><b>${esc(r.name)}</b>${who ? `<small>${esc(who)}</small>` : ''}</div>
${url ? `<a class="rec-in" href="${esc(url)}" target="_blank" rel="noopener" aria-label="${esc(r.name)} on LinkedIn"><svg aria-hidden="true"><use href="#i-in"/></svg>LinkedIn</a>` : ''}</figcaption></figure>`;
  }).join('');
}

/* ---------- Certifications (from config): a card with a verifyUrl is a link to the credential ---------- */
function renderCerts() {
  const c = CFG.certifications, sec = $('#certifications'), grid = $('#certGrid');
  if (!sec || !grid) return;
  const items = (c?.enabled === false ? [] : (c?.items || [])).filter(x => x && x.name && x.hidden !== true);
  if (!items.length) { sec.hidden = true; return; }
  grid.innerHTML = items.map((x, i) => {
    const url = httpUrl(x.verifyUrl);
    const inner = `<div class="ico" aria-hidden="true">${esc(x.icon || '🏅')}</div><div>${x.issuer ? `<div class="issuer">${esc(x.issuer)}</div>` : ''}<h3>${esc(x.name)}</h3><p>${esc(x.blurb || '')}</p><div class="when">${esc(x.when || '')}${url ? '<span class="verify">Verify ↗</span>' : ''}</div></div>`;
    return url
      ? `<a class="card cert reveal d${(i % 5) + 1}" href="${esc(url)}" target="_blank" rel="noopener" aria-label="${esc(x.name)}: verify credential">${inner}</a>`
      : `<div class="card cert reveal d${(i % 5) + 1}">${inner}</div>`;
  }).join('');
}

/* ---------- JD fit check (/api/fit): a recruiter pastes a job description, gets a constrained LLM report ---------- */
let paletteAdd = null;          // set by initPalette so late features (fit check) can register commands
let openFit = null;
async function initFit() {
  const cta = $('#fitCta'), dlg = $('#fitDlg'), btn = $('#fitBtn'), form = $('#fitForm');
  if (!cta || !dlg || !btn || !form || typeof dlg.showModal !== 'function') return;
  const c = CFG.fitCheck || {};
  if (c.enabled === false) return;
  try {                                                       // server decides: only offer it when an LLM key is configured
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch('/api/fit', { signal: ctl.signal, cache: 'no-store' }); clearTimeout(t);
    if (!r.ok || !(await r.json()).enabled) return;
  } catch { return; }

  const jd = $('#fitJd'), count = $('#fitCount'), err = $('#fitErr'), go = $('#fitGo'), out = $('#fitOut');
  if (c.label) $('#fitLabel').textContent = c.label;
  if (c.title) $('#fitTitle').textContent = c.title;
  $('#fitBlurb').textContent = c.blurb || '';
  cta.hidden = false;
  let t0 = 0, last = null;                                    // last = { jd, company, role, report }

  const open = () => { if (dlg.open) return; t0 = t0 || Date.now(); dlg.showModal(); document.body.style.overflow = 'hidden'; jd.focus(); };
  const close = () => { if (dlg.open) dlg.close(); };
  openFit = open;
  dlg.addEventListener('close', () => { document.body.style.overflow = ''; });
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  $('#fitClose').addEventListener('click', close);
  btn.addEventListener('click', open);
  jd.addEventListener('input', () => { count.textContent = `${jd.value.length} / 8000`; err.textContent = ''; });

  const li = (arr, f) => arr.map(x => `<li>${f(x)}</li>`).join('');
  const plain = (rep, meta) => [
    `JD fit check: ${rep.verdict.toUpperCase()} (${rep.score}/100)${meta.role || meta.company ? ` for ${[meta.role, meta.company].filter(Boolean).join(' at ')}` : ''}`,
    rep.headline, '',
    'Matched: ' + (rep.matched.map(m => m.skill).join(', ') || 'nothing specific'),
    'Gaps: ' + (rep.gaps.map(g => g.skill).join(', ') || 'none flagged'),
    'Talking points: ' + rep.talking_points.join(' | '),
    'Ask Sudish about: ' + rep.questions.join(' | ')
  ].join('\n');

  const render = (rep, meta, cached) => {
    last = { ...meta, report: rep };
    out.dataset.v = rep.verdict;
    out.innerHTML = `
<div class="fit-head"><div class="fit-score" style="--p:${rep.score}"><span>${rep.score}</span></div>
<div><div class="fit-verdict">${esc(rep.verdict)} match</div><div class="fit-headline">${esc(rep.headline)}</div></div>${cached ? '<span class="fit-cached">cached</span>' : ''}</div>
<div class="fit-cols">
<div class="fit-col"><h4>Matched</h4><ul>${li(rep.matched, m => `<b>${esc(m.skill)}</b>${m.evidence ? ` — ${esc(m.evidence)}` : ''}`) || '<li>Nothing specific matched.</li>'}</ul></div>
<div class="fit-col gaps"><h4>Honest gaps</h4><ul>${li(rep.gaps, g => `<b>${esc(g.skill)}</b>${g.note ? ` — ${esc(g.note)}` : ''}`) || '<li>No material gaps found in the description.</li>'}</ul></div>
<div class="fit-col talk"><h4>Talking points</h4><ul>${li(rep.talking_points, esc) || '<li>—</li>'}</ul></div>
<div class="fit-col ask"><h4>Worth asking me</h4><ul>${li(rep.questions, esc) || '<li>—</li>'}</ul></div>
</div>
<div class="fit-actions">
<button type="button" class="btn btn-primary" id="fitSendBtn">Send this report to Sudish →</button>
${bookingUrl() ? `<a class="btn btn-ghost" href="${esc(bookingUrl())}" target="_blank" rel="noopener">📅 ${esc(bookingLabel())}</a>` : ''}
<a class="btn btn-ghost" href="https://wa.me/919870176701?text=${encodeURIComponent(`Hi Sudish, I ran a JD fit check (${rep.verdict}, ${rep.score}/100)${meta.role ? ` for ${meta.role}` : ''}${meta.company ? ` at ${meta.company}` : ''}. Can we talk?`)}" target="_blank" rel="noopener">WhatsApp</a>
<button type="button" class="mini" id="fitCopy">Copy as text</button>
</div>
<div class="fit-send" id="fitSend" hidden>
<div class="f2"><label>Your name<input type="text" id="fitName" maxlength="100" autocomplete="name" placeholder="Priya Sharma"></label>
<label>Email / phone / LinkedIn<input type="text" id="fitContact" maxlength="200" autocomplete="email" placeholder="priya@company.com"></label></div>
<div class="dlg-foot"><span class="err" id="fitSendErr"></span><button type="button" class="btn btn-primary" id="fitSendGo">Send →</button></div>
</div>`;
    out.hidden = false;
    out.scrollIntoView({ behavior: reduced.matches ? 'auto' : 'smooth', block: 'start' });
    $('#fitCopy').addEventListener('click', () => copyText(plain(rep, meta)));
    $('#fitSendBtn').addEventListener('click', () => { const s = $('#fitSend'); s.hidden = false; $('#fitSendBtn').disabled = true; $('#fitName').focus(); });
    $('#fitSendGo').addEventListener('click', async () => {
      const name = $('#fitName').value.trim(), contact = $('#fitContact').value.trim(), se = $('#fitSendErr'), b = $('#fitSendGo');
      if (!name || !contact) { se.textContent = 'Name and a way to reach you, please.'; return; }
      b.disabled = true; b.textContent = 'Sending…'; se.textContent = '';
      const message = `${plain(rep, meta)}\n\n--- Job description ---\n${last.jd.slice(0, 3000)}`;
      try {
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, contact, message, website: $('#fitHp').value, t0 }) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error();
        $('#fitSend').innerHTML = '<p class="fine ok">Sent ✓ I usually reply within a day.</p>';
        toast('Report sent ✓');
      } catch { se.textContent = 'Could not send right now. WhatsApp or email me instead.'; b.disabled = false; b.textContent = 'Send →'; }
    });
  };

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = jd.value.trim(), company = $('#fitCompany').value.trim(), role = $('#fitRole').value.trim();
    if (text.length < 200) { err.textContent = 'Paste the full description (at least 200 characters) so the comparison means something.'; jd.focus(); return; }
    if (last && last.jd === text && last.company === company && last.role === role) { out.hidden = false; return; }
    go.disabled = true; go.innerHTML = '<span class="fit-busy">Reading the JD…</span>'; err.textContent = ''; out.hidden = true;
    try {
      const r = await fetch('/api/fit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jd: text, company, role, website: $('#fitHp').value, t0 }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 429) throw new Error('That is enough checks for this hour from your network. Email me the JD instead and I will reply personally.');
      if (!r.ok || !j.report) throw new Error(j.error === 'disabled' ? 'The fit check is switched off right now.' : 'The model did not answer in time. Try once more, or just send me the JD.');
      render(j.report, { jd: text, company, role }, !!j.cached);
    } catch (ex) { err.textContent = ex.message || 'Something went wrong.'; }
    go.disabled = false; go.textContent = 'Check fit →';
  });

  paletteAdd?.('Actions', '🧭', 'Check a job description against my profile', open, 'fit', 'jd fit match recruiter hire role');
  if (new URLSearchParams(location.search).has('fit')) setTimeout(open, 600);
}

/* ---------- Live from GitHub (from config) ---------- */
const LANG_COLORS = { Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26', CSS: '#663399', SCSS: '#c6538c',
  'Jupyter Notebook': '#DA5B0B', Shell: '#89e051', PowerShell: '#012456', Kotlin: '#A97BFF', Java: '#b07219', TeX: '#3D6117',
  Dockerfile: '#384d54', SQL: '#e38c00', PLpgSQL: '#336790', Go: '#00ADD8', Rust: '#dea584', 'C++': '#f34b7d', C: '#555555',
  Swift: '#F05138', Dart: '#00B4AB', Vue: '#41b883', Ruby: '#701516', PHP: '#4F5D95' };

async function github() {
  const c = CFG.github, reposEl = $('#repos'), statsEl = $('#ghStats');
  if (!c || c.enabled === false || !reposEl) return;
  const user = c.user || 'Sudish007', KEY = 'sk-gh-' + user, ttl = (c.cacheMinutes ?? 60) * 60e3;

  let data = null;
  try { const cached = JSON.parse(localStorage.getItem(KEY) || 'null'); if (cached && cached.v === 2 && Date.now() - cached.t < ttl) data = cached.d; } catch { /* ignore */ }
  if (!data) {
    try {
      const h = { Accept: 'application/vnd.github+json' };
      const [u, r] = await Promise.all([
        fetch(`https://api.github.com/users/${user}`, { headers: h }),
        fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=50&type=owner`, { headers: h })
      ]);
      if (!u.ok || !r.ok) throw new Error(`GitHub API ${u.status}/${r.status}`);
      const uj = await u.json(), rj = await r.json();
      data = {
        user: { public_repos: uj.public_repos, followers: uj.followers },
        repos: rj.map(x => ({ name: x.name, url: x.html_url, desc: x.description, lang: x.language, stars: x.stargazers_count, pushed: x.pushed_at, fork: !!x.fork, archived: !!x.archived }))
      };
      try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v: 2, d: data })); } catch { /* quota */ }
    } catch {
      reposEl.innerHTML = `<p class="empty">GitHub's anonymous API limit is busy right now — <a href="https://github.com/${esc(user)}" target="_blank" rel="noopener">open the profile directly →</a></p>`;
      reposEl.removeAttribute('aria-busy');
      return;
    }
  }

  // Filtering happens at render time, so editing hideRepos/pinRepos works even with a warm cache.
  const hide = new Set((c.hideRepos || []).map(s => String(s).toLowerCase()));
  const pins = (c.pinRepos || []).map(s => String(s).toLowerCase());
  const rank = r => { const i = pins.indexOf(r.name.toLowerCase()); return i < 0 ? 1e9 : i; };
  let repos = data.repos.filter(r =>
    !hide.has(r.name.toLowerCase()) &&
    !(c.hideForks !== false && r.fork) &&
    !(c.hideArchived !== false && r.archived));
  repos.sort((a, b) => rank(a) - rank(b) || (new Date(b.pushed) - new Date(a.pushed)));
  repos = repos.slice(0, c.maxRepos ?? 6);
  const latest = data.repos.reduce((m, r) => (!m || new Date(r.pushed) > new Date(m.pushed)) ? r : m, null);

  if (statsEl) statsEl.innerHTML =
    `<span class="gh-stat"><b>${data.user.public_repos}</b> public repos</span>` +
    (data.user.followers > 4 ? `<span class="gh-stat"><b>${data.user.followers}</b> followers</span>` : '') +
    (latest ? `<span class="gh-stat">last push <b>${esc(rel(latest.pushed))}</b></span>` : '');

  reposEl.innerHTML = repos.map(r =>
    `<a class="card repo" href="${esc(r.url)}" target="_blank" rel="noopener">
<div class="rn"><svg fill="currentColor" aria-hidden="true"><use href="#i-gh"/></svg>${esc(r.name)}</div>
<div class="rd">${esc(r.desc || 'No description yet.')}</div>
<div class="rm">${r.lang ? `<span><i style="--lang:${LANG_COLORS[r.lang] || 'var(--muted)'}"></i>${esc(r.lang)}</span>` : ''}${r.stars ? `<span>★ ${r.stars}</span>` : ''}<span>pushed ${esc(rel(r.pushed))}</span></div></a>`
  ).join('') || '<p class="empty">Nothing to show — loosen <code>hideRepos</code> in config.js.</p>';
  reposEl.removeAttribute('aria-busy');

  const pf = data.repos.find(r => r.name.toLowerCase() === 'portfolio'), up = $('#updated');
  if (pf && up) up.textContent = ` · updated ${rel(pf.pushed)}`;
}

/* ---------- theme (with circular view-transition reveal) ---------- */
// assets/theme.js applied the theme before first paint (saved choice > page default > IST clock).
// The toggle records an EXPLICIT choice via SKTheme.choose, which stops the clock-following.
const themeBtn = $('#themeBtn'), themeIcon = $('#themeIcon');
const curTheme = () => (window.SKTheme ? SKTheme.current() : document.documentElement.getAttribute('data-theme') || 'dark');
function applyTheme(t) {
  if (window.SKTheme) { SKTheme.choose(t); return; }
  document.documentElement.setAttribute('data-theme', t);
  if (themeIcon) themeIcon.textContent = t === 'dark' ? '🌙' : '☀️';
  $$('meta[name="theme-color"]').forEach(m => m.setAttribute('content', t === 'dark' ? '#07070d' : '#f6f7fb'));
}
function initTheme() {
  if (themeIcon) themeIcon.textContent = curTheme() === 'dark' ? '🌙' : '☀️';
  themeBtn?.addEventListener('click', e => {
    const next = curTheme() === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduced.matches) return applyTheme(next);
    const x = e.clientX || innerWidth - 60, y = e.clientY || 32;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(root)' }
    )).catch(() => {});
  });
}

/* ---------- i18n ---------- */
const T = {
en:{hero_badge:"Open to AI/ML Engineering Roles",hero_desc:"I build AI systems that actually ship to production — not just notebooks that collect dust. Currently at Amazon deploying agentic AI and benchmarking LLMs. Two AWS certifications, 99%+ accuracy across 10+ initiatives, and tools that save my team 150+ hours daily. Looking for my next challenge."},
hi:{hero_badge:"AI/ML इंजीनियरिंग भूमिकाओं के लिए उपलब्ध",hero_desc:"मैं ऐसे AI सिस्टम बनाता हूं जो सच में production में चलते हैं — सिर्फ notebooks में पड़े नहीं रहते। फिलहाल Amazon में agentic AI deploy कर रहा हूं और LLMs benchmark कर रहा हूं। दो AWS certifications, 10+ initiatives में 99%+ accuracy, और tools जो team के 150+ hours daily बचाते हैं।"},
bho:{hero_badge:"AI/ML इंजीनियरिंग के काम खातिर तइयार बानी",hero_desc:"हम अइसन AI सिस्टम बनावत बानी जे सच में production में चलेला — बस notebook में धूल ना खाला। अभी Amazon में agentic AI deploy करत बानी। दू गो AWS certifications बा, 10+ initiatives में 99%+ accuracy, आ tools जे team के 150+ hours रोज बचावेला।"},
de:{hero_badge:"Offen für AI/ML Engineering Positionen",hero_desc:"Ich baue AI-Systeme, die tatsächlich in Produktion laufen — nicht nur Notebooks. Derzeit bei Amazon: agentic AI deployen und LLMs benchmarken. Zwei AWS-Zertifizierungen, 99%+ Genauigkeit in 10+ Initiativen, Tools die meinem Team 150+ Stunden täglich sparen."},
fr:{hero_badge:"Ouvert aux postes d'ingénieur AI/ML",hero_desc:"Je construis des systèmes AI qui vont réellement en production — pas des notebooks qui prennent la poussière. Actuellement chez Amazon à déployer de l'AI agentique et benchmarker des LLMs. Deux certifications AWS, 99%+ de précision sur 10+ initiatives, des outils qui économisent 150+ heures par jour à mon équipe."},
es:{hero_badge:"Abierto a posiciones de Ingeniería AI/ML",hero_desc:"Construyo sistemas AI que realmente llegan a producción — no solo notebooks juntando polvo. Actualmente en Amazon desplegando AI agéntica y benchmarking de LLMs. Dos certificaciones AWS, 99%+ precisión en 10+ iniciativas, herramientas que ahorran 150+ horas diarias a mi equipo."}
};
const langMenu = $('#langMenu'), langBtn = $('#langBtn');
function setLang(lang) {
  const t = T[lang] || T.en;
  try { localStorage.setItem('sk-lang', lang); } catch { /* ignore */ }
  document.documentElement.lang = lang === 'bho' ? 'bho' : lang;
  $$('[data-i18n]').forEach(el => { const k = el.dataset.i18n; if (t[k]) el.textContent = t[k]; });
  $$('button[data-lang]', langMenu).forEach(b => b.setAttribute('aria-checked', String(b.dataset.lang === lang)));
  hideLangMenu();
}
function positionLangMenu() {
  if (!langBtn || !langMenu) return;
  const r = langBtn.getBoundingClientRect(), w = langMenu.offsetWidth || 190;
  langMenu.style.top = (r.bottom + 8) + 'px';
  langMenu.style.left = Math.max(8, Math.min(r.right - w, innerWidth - w - 8)) + 'px';
}
const hasPopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype;
function hideLangMenu() {
  if (!langMenu) return;
  if (hasPopover) { if (langMenu.matches(':popover-open')) langMenu.hidePopover(); }
  else { langMenu.hidden = true; langMenu.classList.remove('open'); }
}
function initI18n() {
  if (langMenu) {
    langMenu.addEventListener('click', e => { const b = e.target.closest('button[data-lang]'); if (b) setLang(b.dataset.lang); });
    if (hasPopover) langMenu.addEventListener('toggle', e => { if (e.newState === 'open') positionLangMenu(); });
    else {
      langMenu.hidden = true; langBtn?.removeAttribute('popovertarget');
      langBtn?.addEventListener('click', () => { const open = langMenu.hidden; langMenu.hidden = !open; langMenu.classList.toggle('open', open); if (open) positionLangMenu(); });
      document.addEventListener('click', e => { if (!e.target.closest('#langMenu, #langBtn')) hideLangMenu(); });
    }
  }
  let saved = 'en'; try { saved = localStorage.getItem('sk-lang') || 'en'; } catch { /* ignore */ }
  if (saved !== 'en' && T[saved]) setLang(saved);
}

/* ---------- nav: burger, active section, scroll effects ---------- */
function initNav() {
  const b = $('#burger'), links = $('#navLinks');
  if (b && links) {
    const set = o => { b.setAttribute('aria-expanded', String(o)); links.classList.toggle('open', o); };
    b.addEventListener('click', () => set(b.getAttribute('aria-expanded') !== 'true'));
    links.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    document.addEventListener('click', e => { if (!e.target.closest('.nav')) set(false); });
  }
  // active link
  const anchors = $$('#navLinks a[href^="#"]');
  const map = new Map(anchors.map(a => [a.getAttribute('href').slice(1), a]));
  const targets = [...map.keys()].map(id => document.getElementById(id)).filter(Boolean);
  const hero = $('#top'); if (hero) targets.push(hero);
  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      anchors.forEach(a => a.removeAttribute('aria-current'));
      map.get(e.target.id)?.setAttribute('aria-current', 'true');
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  targets.forEach(t => io.observe(t));

  // scroll-linked effects (+ fallbacks for engines without scroll-driven animations)
  const nav = $('.nav'), prog = $('.progress'), tl = $('.tl-fill'), tlBox = $('.timeline');
  let ticking = false;
  const upd = () => {
    ticking = false;
    const y = scrollY;
    nav?.classList.toggle('scrolled', y > 8);
    if (!supportsScroll && prog) { const h = document.documentElement.scrollHeight - innerHeight; prog.style.setProperty('--sp', h > 0 ? (y / h).toFixed(4) : '0'); }
    if (!supportsView && tl && tlBox) { const r = tlBox.getBoundingClientRect(); tl.style.setProperty('--tl', Math.min(1, Math.max(0, (innerHeight * .7 - r.top) / r.height)).toFixed(3)); }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
}

/* ---------- reveal fallback (IntersectionObserver) ---------- */
let revealIO = null;
function observeReveals() {
  if (supportsView) return;                       // CSS scroll-driven animations handle it
  revealIO ||= new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
  }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal:not(.in):not([data-obs])').forEach(el => { el.dataset.obs = '1'; revealIO.observe(el); });
}

/* ---------- pointer spotlight on cards ---------- */
function initSpotlight() {
  if (!matchMedia('(hover: hover)').matches) return;
  document.addEventListener('pointermove', e => {
    const card = e.target.closest?.('.card'); if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });
}

/* ---------- hero: interactive neural network with signal pulses ---------- */
function initNeural() {
  const c = $('#neural'); if (!c || reduced.matches) return;
  const ctx = c.getContext('2d'); if (!ctx) return;
  const LINK = 120, LINK2 = LINK * LINK, REACH = 170;
  let W = 0, H = 0, nodes = [], pulses = [], last = 0, inView = true, pageVisible = !document.hidden;
  const ptr = { x: -1e4, y: -1e4, active: false };
  const isLight = () => document.documentElement.getAttribute('data-theme') === 'light';

  function resize() {
    const r = c.getBoundingClientRect(); W = Math.max(1, r.width | 0); H = Math.max(1, r.height | 0);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.max(30, Math.min(130, Math.round(W * H / 16000)));
    nodes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, r: Math.random() * 1.6 + .6 }));
    pulses = [];
  }
  function spawnPulse() {
    const a = nodes[(Math.random() * nodes.length) | 0]; let best = null, bd = LINK2;
    for (const b of nodes) { if (b === a) continue; const dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = b; } }
    if (best) pulses.push({ a, b: best, t: 0, s: .012 + Math.random() * .012 });
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!inView || !pageVisible) { last = ts; return; }
    const dt = Math.min(32, ts - last || 16) / 16; last = ts;
    ctx.clearRect(0, 0, W, H);
    // Light mode needs a darker ink and roughly double the alpha: the dark-mode cyan at .09–.14 is invisible on #f6f7fb.
    const L = isLight(), col = L ? '14,116,144' : '6,182,212', nodeCol = L ? '79,70,229' : '6,182,212';
    const linkA = L ? .22 : .14, nodeA = L ? .62 : .55, hoverA = L ? .42 : .28;
    for (const n of nodes) {
      n.x += n.vx * dt; n.y += n.vy * dt;
      if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
      if (ptr.active) {                      // gentle attraction toward the pointer
        const dx = ptr.x - n.x, dy = ptr.y - n.y, d2 = dx * dx + dy * dy;
        if (d2 < REACH * REACH && d2 > 1) { const d = Math.sqrt(d2), f = (1 - d / REACH) * .035; n.vx += dx / d * f; n.vy += dy / d * f; }
      }
      const sp = Math.hypot(n.vx, n.vy); if (sp > .9) { n.vx *= .9 / sp; n.vy *= .9 / sp; }
    }
    ctx.lineWidth = L ? .9 : .6;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 >= LINK2) continue;
        let al = (1 - Math.sqrt(d2) / LINK) * linkA;
        if (ptr.active) { const pd = Math.hypot((a.x + b.x) / 2 - ptr.x, (a.y + b.y) / 2 - ptr.y); if (pd < REACH) al += (1 - pd / REACH) * hoverA; }
        ctx.strokeStyle = `rgba(${col},${al})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.fillStyle = `rgba(${nodeCol},${nodeA})`;
    const nr = L ? 1.25 : 1;                 // slightly larger nodes on light so they survive anti-aliasing
    for (const n of nodes) { ctx.beginPath(); ctx.arc(n.x, n.y, n.r * nr, 0, Math.PI * 2); ctx.fill(); }
    for (let i = pulses.length - 1; i >= 0; i--) {   // signals travelling along edges
      const p = pulses[i]; p.t += p.s * dt; if (p.t >= 1) { pulses.splice(i, 1); continue; }
      const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
      const pr = L ? 8 : 7, g = ctx.createRadialGradient(x, y, 0, x, y, pr);
      g.addColorStop(0, L ? 'rgba(109,40,217,1)' : 'rgba(167,139,250,.95)'); g.addColorStop(1, L ? 'rgba(109,40,217,0)' : 'rgba(139,92,246,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, pr, 0, Math.PI * 2); ctx.fill();
    }
    if (pulses.length < 6 && Math.random() < .06) spawnPulse();
  }
  const hero = c.parentElement;
  hero.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.active = true; }, { passive: true });
  hero.addEventListener('pointerleave', () => { ptr.active = false; });
  new IntersectionObserver(es => { inView = es[0].isIntersecting; }).observe(c);
  document.addEventListener('visibilitychange', () => { pageVisible = !document.hidden; });
  let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); }, { passive: true });
  resize(); requestAnimationFrame(frame);
}

/* ---------- count-up numbers ---------- */
function initCountUps() {
  const els = $$('[data-count]'); if (!els.length) return;
  const run = el => {
    const end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
    if (reduced.matches || !isFinite(end)) { el.textContent = end + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const tick = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(end * e) + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: .4 });
  els.forEach(el => io.observe(el));
}

/* ---------- hero typewriter ---------- */
function initTypewriter() {
  const el = $('#typer'); if (!el) return;
  let roles = []; try { roles = JSON.parse(el.dataset.roles || '[]'); } catch { /* keep static */ }
  if (!roles.length || reduced.matches) return;
  const sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = el.textContent;   // static copy for screen readers
  const live = document.createElement('span'); live.setAttribute('aria-hidden', 'true');
  const caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
  el.textContent = ''; el.append(sr, live, caret);
  let i = 0, ch = 0, del = false;
  const step = () => {
    const w = roles[i];
    if (!del) { ch++; live.textContent = w.slice(0, ch); if (ch === w.length) { del = true; return setTimeout(step, 1800); } return setTimeout(step, 36 + Math.random() * 40); }
    ch--; live.textContent = w.slice(0, ch);
    if (ch === 0) { del = false; i = (i + 1) % roles.length; return setTimeout(step, 320); }
    setTimeout(step, 22);
  };
  setTimeout(step, 500);
}

/* ---------- IST clock ---------- */
function initClock() {
  const el = $('#clock'); if (!el) return;
  const f = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => { el.textContent = f.format(new Date()); };
  tick(); setInterval(tick, 15000);
}

/* ---------- project filters (View Transitions) ---------- */
function initFilters() {
  const chips = $$('.chip[data-filter]'), cards = $$('#projectGrid .proj'), empty = $('#projectEmpty');
  if (!chips.length || !cards.length) return;
  cards.forEach((c, i) => { c.style.viewTransitionName = 'proj-' + i; });
  const apply = f => {
    let n = 0;
    cards.forEach(c => { const show = f === 'all' || (c.dataset.cat || '').split(/\s+/).includes(f); c.hidden = !show; if (show) n++; });
    if (empty) empty.hidden = n > 0;
  };
  chips.forEach(ch => ch.addEventListener('click', () => {
    chips.forEach(x => x.setAttribute('aria-pressed', String(x === ch)));
    const f = ch.dataset.filter;
    if (document.startViewTransition && !reduced.matches) document.startViewTransition(() => apply(f)); else apply(f);
  }));
}

/* ---------- command palette ---------- */
function score(q, text) {
  if (!q) return 1;
  q = q.toLowerCase(); text = text.toLowerCase();
  const idx = text.indexOf(q); if (idx >= 0) return 1000 - idx;
  let ti = 0, s = 0;
  for (const ch of q) {
    const i = text.indexOf(ch, ti); if (i < 0) return 0;
    s += (i === ti ? 4 : 1) + ((i === 0 || /[\s\-—/(]/.test(text[i - 1])) ? 3 : 0); ti = i + 1;
  }
  return s;
}
function initPalette() {
  const dlg = $('#cmdk'), input = $('#cmdkInput'), list = $('#cmdkList'), btn = $('#cmdkBtn');
  if (!dlg || !input || !list || typeof dlg.showModal !== 'function') { btn?.setAttribute('hidden', ''); return; }
  const key = $('#cmdkKey'); if (key) key.textContent = isMac ? '⌘' : 'Ctrl';

  const items = [];
  const add = (g, i, l, run, h = '', k = '') => items.push({ g, i, l, run, h, k });
  paletteAdd = add;
  [['#top', '🏠', 'Top'], ['#numbers', '📊', 'Impact — By the Numbers'], ['#skills', '🧠', 'Skills'], ['#experience', '💼', 'Experience'],
   ['#projects', '🧪', 'Projects'], ['#live', '🚀', 'Live Projects'], ['#github', '🐙', 'Live from GitHub'], ['#why-hire', '🎯', 'Why Hire Me'],
   ['#recommendations', '💬', 'Recommendations'], ['#hire-me', '🔥', 'Hire Me'], ['#certifications', '🏅', 'Certifications'], ['#awards', '🏆', 'Awards'], ['#contact', '✉️', 'Contact']
  ].forEach(([h, i, l]) => { const el = $(h); if (el && !el.hidden) add('Go to', i, l, () => jump(el), 'section', 'go jump'); });
  if (bookingUrl()) add('Actions', '📅', bookingLabel(), () => openUrl(bookingUrl()), '↗', 'book call meeting schedule calendar interview recruiter');
  $$('#projectGrid .proj').forEach(p => add('Projects', '📦', p.querySelector('h3')?.textContent || '', () => { if (p.hidden) $('.chip[data-filter="all"]')?.click(); jump(p, true); }, 'project', p.querySelector('.cat')?.textContent || ''));
  if (CFG.liveProjects?.enabled !== false) (CFG.liveProjects?.items || []).forEach(p => { const u = p.playStore || p.website || p.apk; if (p?.name && u) add('Live projects', p.icon || '🚀', p.name, () => openUrl(u), 'open ↗', p.tagline || ''); });
  if (CFG.services?.enabled !== false) {
    add('Services', '💼', 'All services & pricing', () => { location.href = 'services.html'; }, 'page', 'hire buy price rates');
    (CFG.services?.items || []).filter(s => s && s.id && !s.hidden).forEach(s => {
      const price = s.unit === 'from' ? `from ₹${Number(s.price).toLocaleString('en-IN')}` : `₹${Number(s.price).toLocaleString('en-IN')}`;
      add('Services', s.type === 'quote' ? '📝' : '🛒', s.name, () => { location.href = `services.html?service=${encodeURIComponent(s.id)}`; }, price, `${s.meta || ''} ${s.group || ''} buy book`);
    });
  }
  add('Actions', '📄', 'Download resume (PDF)', () => { const a = document.createElement('a'); a.href = 'Sudish-Kumar-Resume-2026.pdf'; a.download = ''; document.body.append(a); a.click(); a.remove(); }, 'pdf', 'cv resume');
  add('Actions', '💬', 'WhatsApp Sudish', () => openUrl('https://wa.me/919870176701?text=Hi%20Sudish!'), '↗', 'chat message');
  add('Actions', '✉️', 'Email Sudish', () => { location.href = 'mailto:sudishnit@gmail.com'; }, 'mailto', 'contact');
  add('Actions', '📋', 'Copy email address', () => copyText('sudishnit@gmail.com'), 'clipboard', 'contact');
  add('Actions', '📮', 'Send me a message (form)', () => { const f = $('#msgForm'); if (f) jump(f, true); }, 'form', 'contact message recruiter hire');
  add('Actions', '🔗', 'LinkedIn profile', () => openUrl('https://linkedin.com/in/simplysudish'), '↗');
  add('Actions', '🐙', 'GitHub profile', () => openUrl('https://github.com/Sudish007'), '↗');
  if (navigator.share) add('Actions', '📤', 'Share this page', share, 'share');
  add('Preferences', '🧭', 'Take the site tour', () => startTour(), 'guide', 'walkthrough help onboarding tour guide intro');
  add('Preferences', '🌗', 'Toggle dark / light theme', () => themeBtn?.click(), 'theme', 'dark light mode');
  if (window.SKTheme) add('Preferences', '🕙', 'Theme: follow the clock again', () => { SKTheme.reset(); toast('Automatic theme ✓ light 10:00–18:00 IST, dark otherwise'); }, 'auto', 'theme automatic reset time ist default');
  [['en', '🇬🇧', 'English'], ['hi', '🇮🇳', 'हिन्दी (Hindi)'], ['bho', '🇮🇳', 'भोजपुरी (Bhojpuri)'], ['de', '🇩🇪', 'Deutsch'], ['fr', '🇫🇷', 'Français'], ['es', '🇪🇸', 'Español']]
    .forEach(([c, i, l]) => add('Language', i, l, () => setLang(c), c, 'language lang translate'));
  // Owner shortcuts only appear on devices where the admin token is stored (i.e. the owner's own browser).
  let isOwner = false; try { isOwner = !!localStorage.getItem('sk-admin-token'); } catch { /* private mode */ }
  if (isOwner) {
    add('Owner', '⚙️', 'Open admin editor', () => openUrl('admin.html'), '↗', 'admin edit config hide repos live projects');
    add('Owner', '📝', 'Edit config.js on GitHub (raw)', () => openUrl('https://github.com/Sudish007/portfolio/edit/master/assets/config.js'), '↗', 'config raw github');
  }

  let view = [], sel = 0;
  const paint = () => { $$('.cmdk-it', list).forEach(b => b.setAttribute('aria-selected', String(+b.dataset.idx === sel))); const b = list.querySelector(`[data-idx="${sel}"]`); b?.scrollIntoView({ block: 'nearest' }); input.setAttribute('aria-activedescendant', b?.id || ''); };
  const render = () => {
    const q = input.value.trim();
    view = q ? items.map(it => ({ it, s: score(q, `${it.l} ${it.k} ${it.g}`) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).map(x => x.it) : items.slice();
    sel = 0;
    if (!view.length) { list.innerHTML = '<p class="empty">No matches. Try "resume", "projects" or "theme".</p>'; return; }
    let html = '', g = null;
    view.forEach((it, idx) => {
      if (!q && it.g !== g) { html += `<div class="cmdk-g">${esc(it.g)}</div>`; g = it.g; }
      html += `<button type="button" class="cmdk-it" role="option" id="cmdk-opt-${idx}" data-idx="${idx}" aria-selected="${idx === sel}"><span class="i">${it.i}</span><span>${esc(it.l)}</span><span class="h">${esc(it.h)}</span></button>`;
    });
    list.innerHTML = html;
  };
  const move = d => { if (!view.length) return; sel = (sel + d + view.length) % view.length; paint(); };
  const run = idx => { const it = view[idx]; if (!it) return; close(); setTimeout(() => it.run(), 40); };
  const open = () => { if (dlg.open) return; input.value = ''; render(); dlg.showModal(); document.body.style.overflow = 'hidden'; input.focus(); };
  const close = () => { if (dlg.open) dlg.close(); };
  dlg.addEventListener('close', () => { document.body.style.overflow = ''; });
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
  list.addEventListener('click', e => { const b = e.target.closest('.cmdk-it'); if (b) run(+b.dataset.idx); });
  list.addEventListener('pointermove', e => { const b = e.target.closest('.cmdk-it'); if (b && +b.dataset.idx !== sel) { sel = +b.dataset.idx; paint(); } });
  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    else if (e.key === 'Home') { e.preventDefault(); sel = 0; paint(); }
    else if (e.key === 'End') { e.preventDefault(); sel = Math.max(0, view.length - 1); paint(); }
  });
  btn?.addEventListener('click', open);
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'k') { e.preventDefault(); dlg.open ? close() : open(); return; }
    const typing = /^(input|textarea|select)$/i.test(document.activeElement?.tagName || '');
    if (k === '/' && !dlg.open && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); }
  });
}

/* ---------- contact extras ---------- */
function initContact() {
  $('#copyEmail')?.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); copyText(e.currentTarget.dataset.copy || 'sudishnit@gmail.com'); });
  const sb = $('#shareBtn'); if (sb && navigator.share) { sb.hidden = false; sb.addEventListener('click', share); }
}

/* ---------- contact form (/api/contact) ---------- */
function initContactForm() {
  const f = $('#msgForm'); if (!f) return;
  const t0 = Date.now();                    // bot time-trap: server rejects submissions faster than 3 s
  f.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#msgSend');
    const data = {
      name: $('#mfName').value.trim(),
      contact: $('#mfContact').value.trim(),
      message: $('#mfBody').value.trim(),
      website: $('#mfHp').value,            // honeypot: humans never see this field
      t0
    };
    if (!data.name || !data.contact) return toast('Name and a way to reach you, please.');
    if (data.message.length < 10) return toast('Message is a bit short — add a few details.');
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || 'send failed');
      f.reset();
      $('#mfDone').hidden = false;
      toast('Sent ✓ I usually reply within a day.');
    } catch {
      toast('Could not send right now — WhatsApp or email me instead.');
    }
    btn.disabled = false; btn.textContent = 'Send message →';
  });
}

/* ---------- first-visit walkthrough (spotlight tour) ---------- */
// Nothing is in the DOM until the tour starts. A visitor sees it once (localStorage 'sk-tour' = 'done');
// afterwards it stays one command away ("Take the site tour") or via ?tour in the URL.
const TOUR_KEY = 'sk-tour';
const tourSeen = () => { try { return localStorage.getItem(TOUR_KEY) === 'done'; } catch { return true; } };
const tourMark = () => { try { localStorage.setItem(TOUR_KEY, 'done'); } catch { /* private mode */ } };
let tourOpen = false;

const touchOnly = () => matchMedia('(hover: none) and (pointer: coarse)').matches;
const cmdkHint = () => (touchOnly() ? 'the search icon' : `${isMac ? '⌘' : 'Ctrl'} K`);

function tourSteps() {
  const vis = el => !!el && !el.hidden && el.getClientRects().length > 0;   // rendered on this viewport
  const defs = [
    { title: 'Welcome to sudish.dev 👋', cta: 'Start the tour →', scroll: 'top',
      body: `A 30-second walkthrough of what this site can do: the command menu, live products in production and the fastest ways to reach me. ${touchOnly() ? 'Skip it any time.' : 'Esc skips it any time.'}` },
    { targets: ['#cmdkBtn'], title: 'Command menu', scroll: 'top',
      body: touchOnly()
        ? 'Tap the search icon to jump to any section, download the resume, open my live apps or switch theme and language. Everything on this site is one search away.'
        : `Press ${isMac ? '⌘' : 'Ctrl'} K or / anywhere. Jump to a section, download the resume, open my live apps or switch theme and language without leaving the keyboard.` },
    { targets: ['#langBtn', '#themeBtn'], title: 'Theme & language', scroll: false,
      body: 'The theme follows Indian working hours: light from 10:00 to 18:00 IST, dark otherwise. Tap the moon or sun to pick your own and it sticks. The globe switches language, Hindi and Bhojpuri included.' },
    { targets: ['#liveGrid > *:first-child'], alt: ['#live .head'], anchor: '#live .head', title: 'Live products',
      body: 'Not demos. Real apps and sites running in production for real users. Each card opens the Play Store listing, the website or the APK.' },
    { targets: ['#hire-me .hire-btns'], anchor: '#hire-me .hire-layout', title: 'Hiring? One tap',
      body: 'WhatsApp, a pre-filled email or LinkedIn, whichever your process prefers. Fixed-price services and freelance work live on the Services page.' },
    { targets: ['#msgForm'], title: 'Or write to me right here', cta: 'Finish ✓',
      body: 'This form posts to the site\u2019s own API and lands in my inbox and on my phone within seconds. Thanks for visiting, enjoy the site.' }
  ];
  const steps = [];
  for (const d of defs) {
    if (!d.targets) { steps.push({ ...d, els: [] }); continue; }
    let els = d.targets.map(s => $(s)).filter(vis);
    if (!els.length && d.alt) els = d.alt.map(s => $(s)).filter(vis);
    if (els.length) steps.push({ ...d, els });                               // a missing target just drops its step
  }
  return steps;
}

function buildTour() {
  const root = document.createElement('div');
  root.className = 'tour'; root.id = 'tour'; root.hidden = true;
  root.innerHTML = `
    <div class="tour-dim"></div>
    <div class="tour-ring" aria-hidden="true"></div>
    <section class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourTitle" aria-describedby="tourBody" tabindex="-1">
      <div class="tour-top"><span class="tour-n" id="tourN"></span><button type="button" class="tour-x" aria-label="Skip the tour" title="Skip (Esc)">✕</button></div>
      <div class="tour-txt" aria-live="polite"><h3 id="tourTitle"></h3><p id="tourBody"></p></div>
      <div class="tour-foot">
        <div class="tour-dots" aria-hidden="true"></div>
        <div class="tour-btns"><button type="button" class="btn btn-ghost tour-back">Skip</button><button type="button" class="btn btn-primary tour-next">Next →</button></div>
      </div>
      <p class="tour-kbd"><kbd>←</kbd><kbd>→</kbd> steps <span>·</span> <kbd>esc</kbd> skip</p>
    </section>`;
  document.body.append(root);
  return root;
}

function startTour() {
  if (tourOpen) return;
  const steps = tourSteps();
  if (steps.length < 2) return;                                              // nothing worth touring
  const root = $('#tour') || buildTour();
  const ring = $('.tour-ring', root), card = $('.tour-card', root), nTxt = $('#tourN'), title = $('#tourTitle'), body = $('#tourBody');
  const dots = $('.tour-dots', root), back = $('.tour-back', root), next = $('.tour-next', root), x = $('.tour-x', root);
  const prevFocus = document.activeElement;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), Math.max(a, b));
  // Elements still waiting for their scroll-driven .reveal sit 26px lower than where they settle; `settled` removes
  // that offset so scroll targets are computed for the final layout, while the ring itself follows the live rect.
  const revealShift = el => {
    let dy = 0;
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      if (!n.classList.contains('reveal')) continue;
      const m = getComputedStyle(n).transform.match(/matrix\(([^)]+)\)/);
      if (m) dy += parseFloat(m[1].split(',')[5]) || 0;
    }
    return dy;
  };
  const union = (els, settled = false) => {
    let l = 1e9, t = 1e9, r = -1e9, b = -1e9;
    els.forEach(el => {
      const q = el.getBoundingClientRect(), dy = settled ? revealShift(el) : 0;
      l = Math.min(l, q.left); t = Math.min(t, q.top - dy); r = Math.max(r, q.right); b = Math.max(b, q.bottom - dy);
    });
    return { left: l, top: t, width: r - l, height: b - t };
  };
  let i = 0, raf = 0;
  tourOpen = true;
  $('#cmdk')?.close?.();
  root.hidden = false;

  const place = () => {
    raf = 0;
    const st = steps[i], vw = innerWidth, vh = innerHeight, m = 12, gap = 14, narrow = vw < 640;
    if (!st.els.length) {                                                    // welcome: centred card over a dimmed page
      root.dataset.mode = 'center'; card.dataset.pos = 'center';
      card.style.left = `${Math.round((vw - card.offsetWidth) / 2)}px`;
      card.style.top = `${Math.round(Math.max(m, (vh - card.offsetHeight) / 2))}px`;
      return;
    }
    root.dataset.mode = 'spot';
    const r = union(st.els), pad = 8;
    const rt = { left: r.left - pad, top: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
    Object.assign(ring.style, { left: `${rt.left}px`, top: `${rt.top}px`, width: `${rt.w}px`, height: `${rt.h}px` });
    const cw = card.offsetWidth, ch = card.offsetHeight, cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let left, top, pos;
    if (narrow) { pos = 'sheet'; left = m; top = vh - ch - m; }
    else if (rt.top + rt.h + gap + ch <= vh - m) { pos = 'below'; top = rt.top + rt.h + gap; }
    else if (rt.top - gap - ch >= m) { pos = 'above'; top = rt.top - gap - ch; }
    else if (rt.left + rt.w + gap + cw <= vw - m) { pos = 'right'; left = rt.left + rt.w + gap; top = clamp(cy - ch / 2, m, vh - ch - m); }
    else if (rt.left - gap - cw >= m) { pos = 'left'; left = rt.left - gap - cw; top = clamp(cy - ch / 2, m, vh - ch - m); }
    else { pos = 'over'; top = vh - ch - m; }                                // target fills the screen: pin the card to the bottom
    if (left === undefined) left = clamp(cx - cw / 2, m, vw - cw - m);
    card.dataset.pos = pos;
    card.style.left = `${Math.round(left)}px`; card.style.top = `${Math.round(top)}px`;
    if (pos === 'below' || pos === 'above') card.style.setProperty('--ax', `${Math.round(clamp(cx - left, 22, cw - 22))}px`);
    if (pos === 'right' || pos === 'left') card.style.setProperty('--ay', `${Math.round(clamp(cy - top, 22, ch - 22))}px`);
  };
  const onScroll = () => { raf ||= requestAnimationFrame(place); };

  const scrollFor = st => {                                                  // returns true when the page will move
    const behavior = reduced.matches ? 'auto' : 'smooth';
    let want = null;
    if (st.scroll === 'top') want = 0;
    else if (st.scroll !== false && st.els.length) {
      const r = union(st.els, true), vh = innerHeight, top = 84;            // 84 = fixed nav + breathing room
      const avail = innerWidth < 640 ? vh - card.offsetHeight - 24 : vh;    // keep the bottom sheet clear on phones
      const a = st.anchor ? $(st.anchor) : null, aTop = a ? union([a], true).top : r.top;
      // Prefer showing the section heading above the target; fall back to centring when that would push the target off-screen.
      want = (a && r.top + r.height - aTop + top <= avail - 12) ? aTop + scrollY - top : r.top + scrollY - Math.max(top, (avail - r.height) / 2);
      want = Math.max(0, want);
    }
    if (want === null || Math.abs(want - scrollY) < 2) return false;
    scrollTo({ top: want, behavior });
    return true;
  };

  const show = k => {
    i = clamp(k, 0, steps.length - 1);
    const st = steps[i];
    nTxt.textContent = `${i + 1} / ${steps.length}`;
    title.textContent = st.title; body.textContent = st.body;
    dots.innerHTML = steps.map((_, d) => `<i${d === i ? ' class="on"' : ''}></i>`).join('');
    back.textContent = i === 0 ? 'Skip' : '← Back';
    next.textContent = st.cta || 'Next →';
    root.dataset.step = String(i);
    const moving = scrollFor(st);
    ring.classList.toggle('glide', !moving);                                 // glide between fixed targets, follow the page otherwise
    place();
    next.focus({ preventScroll: true });
  };
  const end = () => {
    if (!tourOpen) return;
    tourOpen = false; tourMark();
    document.removeEventListener('keydown', onKey, true);
    removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll);
    if (raf) cancelAnimationFrame(raf);
    root.hidden = true;
    prevFocus?.focus?.({ preventScroll: true });
  };
  const finish = () => { end(); toast(`Tour done ✓ ${cmdkHint()} opens the command menu any time.`); };
  const goNext = () => (i >= steps.length - 1 ? finish() : show(i + 1));
  const goBack = () => (i === 0 ? end() : show(i - 1));
  const onKey = e => {
    if (e.key === 'Escape') { e.preventDefault(); end(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); goBack(); }
    else if (e.key === 'Tab') {                                              // keep focus inside the card
      const f = $$('button', card), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!card.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
    e.stopPropagation();                                                     // modal: no palette / menu shortcuts underneath
  };

  next.onclick = goNext; back.onclick = goBack; x.onclick = end;
  document.addEventListener('keydown', onKey, true);
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll);
  show(0);
}

function initTour() {
  const q = new URLSearchParams(location.search);
  if (q.has('tour')) { setTimeout(startTour, 600); return; }               // explicit link always works
  if (tourSeen() || q.has('notour')) return;
  if (location.hash && location.hash !== '#top') return;                     // deep link: don't get in the way
  setTimeout(() => { if (scrollY < 240 && !$('#cmdk')?.open) startTour(); }, 1400);   // already exploring? try next visit
}

/* ---------- live config from /api/config (Netlify Blobs) ---------- */
async function loadRemoteConfig() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch('/api/config', { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!r.ok) return;                       // static hosting / API down -> keep committed defaults
    const j = await r.json();
    // Live config wins, but sections it doesn't know about yet (added in code later) fall back to the committed defaults.
    if (j?.config?.github && j?.config?.liveProjects) CFG = { ...(window.SK_CONFIG || {}), ...j.config };
  } catch { /* offline or timeout -> defaults */ }
}

/* ---------- boot ---------- */
initTheme();
initI18n();
initNav();
observeReveals();
initSpotlight();
initNeural();
initCountUps();
initTypewriter();
initClock();
initFilters();
initContact();
initContactForm();
// Config-driven sections render once the live config answers (or immediately on fallback).
loadRemoteConfig().then(() => {
  applySectionToggles();
  renderAvailability();
  renderLive();
  renderRecommendations();
  renderCerts();
  initPalette();
  observeReveals();
  initTour();
  initFit();                                   // async; registers its palette command once /api/fit says it is configured
  github().then(observeReveals).catch(() => {});
});
})();
