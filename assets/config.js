/* =====================================================================
   sudish.dev — SITE CONFIG (edit this file, nothing else)
   ---------------------------------------------------------------------
   Controls the two dynamic sections. Save → commit → push; Netlify
   redeploys in ~30 s. Quick edit in the browser:
   https://github.com/Sudish007/portfolio/edit/master/assets/config.js

   Rules of thumb
   • Set `enabled: false` on a section to remove it AND its nav link.
   • Delete or reorder items in `liveProjects.items` freely.
   • Leave a URL as '' to hide that button. Only fill `playStore` once
     the listing is actually live; `apk` needs a public direct-download
     URL (GitHub Releases asset works well).
   • Private GitHub repos never show up (the public API can't see them);
     `hideRepos` is for PUBLIC repos you don't want featured.
   ===================================================================== */
window.SK_CONFIG = {

  github: {
    enabled: true,
    user: 'Sudish007',
    maxRepos: 6,                       // how many repo cards to show
    hideForks: true,                   // e.g. the is-a.dev "register" fork
    hideArchived: true,
    hideRepos: [                       // exact repo names, case-insensitive
      'mai-aaunga-neha',
      'parivaar',
      'register',
      'savita-biodata',
      'Neha_Resume'
    ],
    pinRepos: [                        // always listed first (if public & not hidden)
      'portfolio'
    ],
    cacheMinutes: 60                   // browser-side cache to stay under GitHub's anonymous rate limit
  },

  liveProjects: {
    enabled: true,
    eyebrow: 'Shipped & Running',
    title: 'Live Projects',
    lede: 'Real products with real users — Android apps and web platforms I designed, built, and operate end to end.',
    items: [
      {
        name: 'KaatDo',
        icon: '🛡️',
        color: '#ef4444',
        type: 'web',                                   // 'web' | 'android' | 'android+web'
        status: 'Live',                                // short badge text
        tagline: 'काट दो — the kill switch for Indian F&O traders. A server-side risk engine that cancels every order, flattens every position and locks the day the moment your rules break. Fyers, Upstox, Zerodha, Angel One, Dhan, Groww.',
        tags: ['FastAPI', 'Python', 'Broker APIs', 'Vanilla JS', 'OCI'],
        website: 'https://kaatdo.com',
        playStore: '',
        apk: '',
        repo: ''
      },
      {
        name: 'BhojVerse',
        icon: '🎓',
        color: '#f59e0b',
        type: 'android+web',
        status: 'Play Store listing in progress',
        tagline: 'Learn Bhojpuri from Hindi & English — dialogues, grammar, quizzes. Fully offline, no ads, no tracking. v1.1.0.',
        tags: ['React Native', 'Expo', 'TypeScript', 'Offline-first'],
        website: 'https://sudish007.github.io/bhojverse-site/',
        playStore: '',                                  // paste https://play.google.com/store/apps/details?id=com.bhojverse.app when live
        apk: '',
        repo: 'https://github.com/Sudish007/bhojverse-site'
      },
      {
        name: 'Telusa',
        icon: '🗣️',
        color: '#06b6d4',
        type: 'android',
        status: 'Play Store listing in progress',
        tagline: 'Learn Telugu from Hindi/English — speaking practice, stories, office Telugu. Free, no ads. v3.2.1.',
        tags: ['Kotlin', 'Android', 'Native'],
        website: 'https://sudish007.github.io/telusa-privacy/',
        playStore: '',                                  // https://play.google.com/store/apps/details?id=com.telusa.app when live
        apk: '',
        repo: 'https://github.com/Sudish007/telusa-privacy'
      },
      {
        name: 'Sri Sai Hospital',
        icon: '🏥',
        color: '#10b981',
        type: 'android+web',
        status: 'Play Store listing in progress',
        tagline: 'Order Ayurvedic medicines, book doctors & skip the queue. UPI / card / COD checkout, live OPD queue tokens, order tracking, PDF bills, full Hindi support. v2.3.1.',
        tags: ['React Native', 'Expo', 'Payments', 'Push Notifications'],
        website: 'https://sudish007.github.io/srisai-website/',
        playStore: '',                                  // https://play.google.com/store/apps/details?id=com.srisai.hospital when live
        apk: '',
        repo: 'https://github.com/Sudish007/srisai-website'
      },
      {
        name: 'Saubhagya Clinic',
        icon: '🌿',
        color: '#8b5cf6',
        type: 'android+web',
        status: 'Patient + Admin apps',
        tagline: 'Homeopathy clinic suite for Dr. Savita Kumari (BHMS), Siwan — consultation booking, pharmacy with server-verified UPI/Razorpay/COD checkout, live order tracking, PDF invoices, EN/हिंदी. Every word editable from the admin app. v1.1.0.',
        tags: ['React Native', 'Expo', 'Supabase', 'Razorpay', 'Edge Functions'],
        website: 'https://drsavitak.netlify.app/',
        playStore: '',
        apk: '',
        repo: ''
      }
    ]
  }
};
