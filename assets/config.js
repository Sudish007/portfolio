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
   • `services.items[].price` is in whole rupees and is the price the
     SERVER charges (the browser never decides the amount). `type`:
     'fixed' = pay online now, 'digital' = pay + instant download (upload
     the file in admin first), 'quote' = "request a quote" (no payment).
   This file is loaded by the browser AND imported by the serverless
   functions, hence `globalThis` rather than `window`.
   ===================================================================== */
globalThis.SK_CONFIG = {

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
  },

  services: {
    enabled: true,
    eyebrow: 'Work with me',
    title: 'Services & Pricing',
    lede: 'Fixed prices, pay securely online, delivered personally by me. Business projects are quoted after a short call.',
    bookingUrl: '',                    // Cal.com / Calendly link sent after payment for session-type services ('' = "I will email you to schedule")
    currency: 'INR',
    groups: [
      { id: 'jobseekers', title: 'For job seekers', blurb: "You're already here — let's get you hired." },
      { id: 'students',   title: 'For students',    blurb: '7 years of teaching, 500+ students, 91% average scores.' },
      { id: 'business',   title: 'For businesses',  blurb: 'Websites, apps and AI assistants I have shipped for clinics, hospitals and local brands.' }
    ],
    items: [
      {
        id: 'resume-linkedin', group: 'jobseekers', type: 'fixed',
        name: 'Resume + LinkedIn rewrite', price: 1999, unit: 'one-time', meta: '48-hour turnaround · async',
        desc: 'For AI/ML/data roles. I rewrite your resume and LinkedIn to pass ATS and recruiter scans, with the same positioning that gets me callbacks.',
        bullets: ['ATS-friendly rewrite of your resume (PDF + editable source)', 'LinkedIn headline, About and experience sections', 'Role-targeted keyword mapping from 2–3 job posts you choose', 'One revision round included'],
        after: 'Reply to your confirmation email with your current resume and 2–3 target job links. Delivery within 48 hours of receiving them.'
      },
      {
        id: 'mock-interview', group: 'jobseekers', type: 'fixed', booking: true,
        name: 'Mock interview + written feedback', price: 2499, unit: 'per 60 min', meta: 'ML system design · Python · SQL · behavioural',
        desc: 'A realistic interview round with someone who does this at Amazon, followed by written, specific feedback you can act on.',
        bullets: ['60-minute live session on Google Meet', 'Pick the round: ML system design, Python, SQL or behavioural', 'Scorecard + written feedback within 24 hours', 'Session recording on request'],
        after: 'Pick a slot using the booking link in your confirmation email.'
      },
      {
        id: 'roadmap-call', group: 'jobseekers', type: 'fixed', booking: true,
        name: '"Break into AI/ML" roadmap call', price: 999, unit: 'per 45 min', meta: '1:1 · Google Meet',
        desc: 'Where you are, where you want to be, and the shortest honest path between them — projects, certifications, and what to skip.',
        bullets: ['45-minute 1:1 call', 'Personalised 90-day plan sent after the call', 'Project and certification recommendations', 'Follow-up questions by email for a week'],
        after: 'Pick a slot using the booking link in your confirmation email.'
      },
      {
        id: 'portfolio-site', group: 'jobseekers', type: 'fixed',
        name: 'Portfolio website like this one', price: 7999, unit: 'one-time', meta: 'On your own domain · ~7 days',
        desc: "The site you're looking at, rebuilt around you: your projects, resume and story — deployed on your own domain with HTTPS.",
        bullets: ['Design, build and deployment (Netlify or GitHub Pages)', 'Custom domain + HTTPS configured', 'Live GitHub feed, resume download, contact form', 'Admin editor so you can update it yourself'],
        after: "I'll email you a short intake form within 24 hours; the site goes live about a week after you return it."
      },
      {
        id: 'resume-template', group: 'jobseekers', type: 'digital', hidden: true,
        name: 'LaTeX resume template (ATS-ready)', price: 299, unit: 'one-time', meta: 'Instant download',
        desc: 'The two-page LaTeX template behind my own resume, with comments and a fill-in guide.',
        bullets: ['.tex source + compiled PDF sample', 'Works on Overleaf, no local LaTeX needed', 'ATS-tested single-column layout', 'Free updates'],
        after: 'Your download link is in your confirmation email and on this page.'
      },
      {
        id: 'cheat-sheets', group: 'jobseekers', type: 'digital', hidden: true,
        name: 'SQL + ML interview cheat sheets', price: 399, unit: 'one-time', meta: 'Instant download · PDF',
        desc: 'Dense, printable revision sheets for the SQL and ML questions that actually come up.',
        bullets: ['SQL: window functions, CTEs, query optimisation', 'ML: metrics, bias/variance, system design checklist', 'Common traps and how interviewers probe them'],
        after: 'Your download link is in your confirmation email and on this page.'
      },
      {
        id: 'python-sql-cohort', group: 'students', type: 'fixed',
        name: 'Live cohort: Python + SQL for data careers', price: 5999, unit: 'per seat', meta: '4–6 weeks · small batch · live',
        desc: 'From zero to job-ready Python and SQL in a small live batch, with every assignment reviewed personally.',
        bullets: ['2 live classes per week + recordings', 'Weekly assignments with personal review', 'Capstone project for your portfolio', 'Certificate of completion'],
        after: 'Next batch dates and the class link will be emailed to you within 24 hours.'
      },
      {
        id: 'project-mentorship', group: 'students', type: 'fixed', booking: true,
        name: '1:1 project mentorship', price: 2999, unit: 'one-time', meta: 'One real ML project, end to end · 4 weeks',
        desc: 'Build and deploy one production-quality ML project that recruiters will actually open.',
        bullets: ['Scoping call + weekly check-ins for 4 weeks', 'Code review on every milestone', 'Deployment to a live URL', 'README and portfolio write-up'],
        after: 'Pick a slot for the scoping call using the booking link in your confirmation email.'
      },
      {
        id: 'business-website', group: 'business', type: 'quote',
        name: 'Business website', price: 9999, unit: 'from', meta: 'WhatsApp + SEO · 1–2 weeks',
        desc: 'A fast, mobile-first site for your clinic, shop or practice with WhatsApp booking and Google-ready SEO.',
        bullets: ['Design, copy and build', 'WhatsApp click-to-chat, maps, opening hours', 'Google Business Profile + Search Console setup', 'Hosting and domain guidance']
      },
      {
        id: 'clinic-app', group: 'business', type: 'quote',
        name: 'Android app for clinics & shops', price: 49999, unit: 'from', meta: 'Bookings · pharmacy orders · queue tokens',
        desc: 'The app platform I built for Sri Sai Hospital and Saubhagya Clinic, configured for your business — with an admin app to run it.',
        bullets: ['Customer app + admin app', 'Appointments, orders, UPI/COD payments, live queue', 'Push notifications, PDF invoices, Hindi support', 'Play Store publishing + monthly maintenance retainer']
      },
      {
        id: 'ai-assistant', group: 'business', type: 'quote',
        name: 'AI assistant over your documents', price: 24999, unit: 'from', meta: 'RAG on AWS Bedrock · plus usage',
        desc: 'A chatbot that answers from your own manuals, policies or catalogue — with guardrails, citations and analytics.',
        bullets: ['Document ingestion + vector search', 'Guardrails and hallucination controls', 'Web or WhatsApp channel', 'Usage dashboard and monthly tuning']
      },
      {
        id: 'dashboards', group: 'business', type: 'quote',
        name: 'Dashboards & automation', price: 14999, unit: 'from', meta: 'Python + Tableau / Power BI',
        desc: 'Replace spreadsheets and manual reports with automated pipelines and dashboards your team will actually use.',
        bullets: ['Data pipeline from your sources', 'Tableau / Power BI or web dashboard', 'Scheduled reports to email or WhatsApp', 'Handover and training']
      }
    ]
  }
};
