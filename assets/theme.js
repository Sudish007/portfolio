/* sudish.dev — theme bootstrap. Loaded synchronously in <head> so the first paint is already correct.
   Rules:
     1. If the visitor ever pressed the theme toggle, that choice wins forever (localStorage 'sk-theme').
     2. Otherwise the theme follows the clock in India: light 10:00–17:59 IST, dark the rest of the day.
     3. A page can override the automatic default with <html data-theme-default="light|dark"> (services uses light).
   While on automatic, the theme is re-evaluated every few minutes so a tab left open flips at 10:00 / 18:00. */
(function () {
  var html = document.documentElement;
  function istHour() {
    // IST is UTC+5:30 with no DST, so a fixed offset is exact and needs no Intl support.
    var d = new Date(Date.now() + 330 * 60000);
    return d.getUTCHours();
  }
  function autoTheme() {
    var h = istHour();
    return (h >= 10 && h < 18) ? 'light' : 'dark';
  }
  function saved() { try { return localStorage.getItem('sk-theme'); } catch (e) { return null; } }
  function apply(t) {
    html.setAttribute('data-theme', t);
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', t === 'dark' ? '#07070d' : '#f6f7fb');
    var icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = t === 'dark' ? '🌙' : '☀️';
  }
  function resolve() {
    var s = saved();
    if (s === 'light' || s === 'dark') return s;
    return html.getAttribute('data-theme-default') || autoTheme();
  }

  apply(resolve());
  html.classList.add('js');

  // Public API used by main.js / services.js
  window.SKTheme = {
    current: function () { return html.getAttribute('data-theme') || 'dark'; },
    isAuto: function () { var s = saved(); return s !== 'light' && s !== 'dark'; },
    auto: autoTheme,
    apply: apply,
    /* An explicit user choice: persist it and stop following the clock. */
    choose: function (t) { try { localStorage.setItem('sk-theme', t); } catch (e) {} apply(t); },
    /* Back to automatic (used by the walkthrough / palette). */
    reset: function () { try { localStorage.removeItem('sk-theme'); } catch (e) {} apply(resolve()); }
  };

  // Cross-document view transitions (styles.css: @view-transition { navigation: auto }). The nav gets its
  // view-transition-name only while a navigation is in flight, so it morphs between pages but the theme
  // toggle's circular reveal still animates the page as a single root. Must run from <head>: pagereveal
  // fires before the first render of the new page.
  addEventListener('pageswap', function (e) { if (e.viewTransition) html.classList.add('vt-nav'); });
  addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    html.classList.add('vt-nav');
    var off = function () { html.classList.remove('vt-nav'); };
    e.viewTransition.finished.then(off, off);
  });

  // Follow the clock while automatic (and only when the page has no fixed default).
  if (!html.getAttribute('data-theme-default')) {
    setInterval(function () {
      if (window.SKTheme.isAuto()) { var t = autoTheme(); if (t !== window.SKTheme.current()) apply(t); }
    }, 5 * 60000);
  }
})();
