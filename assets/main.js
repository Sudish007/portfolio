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
  for (const key of ['liveProjects', 'github']) {
    const on = CFG[key]?.enabled !== false;
    $$(`[data-config="${key}"]`).forEach(el => {
      const target = el.tagName === 'A' ? el.closest('li') || el : el;
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
const themeBtn = $('#themeBtn'), themeIcon = $('#themeIcon');
const curTheme = () => document.documentElement.getAttribute('data-theme') || 'dark';
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('sk-theme', t); } catch { /* private mode */ }
  if (themeIcon) themeIcon.textContent = t === 'dark' ? '🌙' : '☀️';
  $$('meta[name="theme-color"]').forEach(m => m.setAttribute('content', t === 'dark' ? '#07070d' : '#f6f7fb'));
}
function initTheme() {
  applyTheme(curTheme());
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
    const L = isLight(), col = L ? '8,145,178' : '6,182,212';
    for (const n of nodes) {
      n.x += n.vx * dt; n.y += n.vy * dt;
      if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
      if (ptr.active) {                      // gentle attraction toward the pointer
        const dx = ptr.x - n.x, dy = ptr.y - n.y, d2 = dx * dx + dy * dy;
        if (d2 < REACH * REACH && d2 > 1) { const d = Math.sqrt(d2), f = (1 - d / REACH) * .035; n.vx += dx / d * f; n.vy += dy / d * f; }
      }
      const sp = Math.hypot(n.vx, n.vy); if (sp > .9) { n.vx *= .9 / sp; n.vy *= .9 / sp; }
    }
    ctx.lineWidth = .6;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 >= LINK2) continue;
        let al = (1 - Math.sqrt(d2) / LINK) * (L ? .09 : .14);
        if (ptr.active) { const pd = Math.hypot((a.x + b.x) / 2 - ptr.x, (a.y + b.y) / 2 - ptr.y); if (pd < REACH) al += (1 - pd / REACH) * .28; }
        ctx.strokeStyle = `rgba(${col},${al})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.fillStyle = `rgba(${col},${L ? .35 : .55})`;
    for (const n of nodes) { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); }
    for (let i = pulses.length - 1; i >= 0; i--) {   // signals travelling along edges
      const p = pulses[i]; p.t += p.s * dt; if (p.t >= 1) { pulses.splice(i, 1); continue; }
      const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
      g.addColorStop(0, L ? 'rgba(124,58,237,.9)' : 'rgba(167,139,250,.95)'); g.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
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
  [['#top', '🏠', 'Top'], ['#numbers', '📊', 'Impact — By the Numbers'], ['#skills', '🧠', 'Skills'], ['#experience', '💼', 'Experience'],
   ['#projects', '🧪', 'Projects'], ['#live', '🚀', 'Live Projects'], ['#github', '🐙', 'Live from GitHub'], ['#why-hire', '🎯', 'Why Hire Me'],
   ['#hire-me', '🔥', 'Hire Me'], ['#certifications', '🏅', 'Certifications'], ['#awards', '🏆', 'Awards'], ['#contact', '✉️', 'Contact']
  ].forEach(([h, i, l]) => { const el = $(h); if (el && !el.hidden) add('Go to', i, l, () => jump(el), 'section', 'go jump'); });
  $$('#projectGrid .proj').forEach(p => add('Projects', '📦', p.querySelector('h3')?.textContent || '', () => { if (p.hidden) $('.chip[data-filter="all"]')?.click(); jump(p, true); }, 'project', p.querySelector('.cat')?.textContent || ''));
  if (CFG.liveProjects?.enabled !== false) (CFG.liveProjects?.items || []).forEach(p => { const u = p.playStore || p.website || p.apk; if (p?.name && u) add('Live projects', p.icon || '🚀', p.name, () => openUrl(u), 'open ↗', p.tagline || ''); });
  add('Actions', '📄', 'Download resume (PDF)', () => { const a = document.createElement('a'); a.href = 'Sudish-Kumar-Resume-2026.pdf'; a.download = ''; document.body.append(a); a.click(); a.remove(); }, 'pdf', 'cv resume');
  add('Actions', '💬', 'WhatsApp Sudish', () => openUrl('https://wa.me/919870176701?text=Hi%20Sudish!'), '↗', 'chat message');
  add('Actions', '✉️', 'Email Sudish', () => { location.href = 'mailto:sudishnit@gmail.com'; }, 'mailto', 'contact');
  add('Actions', '📋', 'Copy email address', () => copyText('sudishnit@gmail.com'), 'clipboard', 'contact');
  add('Actions', '📮', 'Send me a message (form)', () => { const f = $('#msgForm'); if (f) jump(f, true); }, 'form', 'contact message recruiter hire');
  add('Actions', '🔗', 'LinkedIn profile', () => openUrl('https://linkedin.com/in/simplysudish'), '↗');
  add('Actions', '🐙', 'GitHub profile', () => openUrl('https://github.com/Sudish007'), '↗');
  if (navigator.share) add('Actions', '📤', 'Share this page', share, 'share');
  add('Preferences', '🌗', 'Toggle dark / light theme', () => themeBtn?.click(), 'theme', 'dark light mode');
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

/* ---------- live config from /api/config (Netlify Blobs) ---------- */
async function loadRemoteConfig() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 2500);
    const r = await fetch('/api/config', { signal: ctl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!r.ok) return;                       // static hosting / API down -> keep committed defaults
    const j = await r.json();
    if (j?.config?.github && j?.config?.liveProjects) CFG = j.config;
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
  renderLive();
  initPalette();
  observeReveals();
  github().then(observeReveals).catch(() => {});
});
})();
