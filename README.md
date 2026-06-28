<div align="center">

# ✦ ZUNEXA
### AI Content & SaaS Platform — Zalij Mode

**Live:** [zunexa.vercel.app](https://zunexa.vercel.app) · **Status:** Private Repository · **Version:** V11 — Clarity Protocol

</div>

---

## 🏛 Overview

**Zunexa** is a premium, AI-powered SaaS platform built for the Moroccan & MENA digital market. It combines a multi-dialect content generation engine (Darija, Gulf Arabic, Franco-Arabe, French, English, Spanish) with a full SaaS operations layer — billing, affiliate program, analytics, and a local-first AI assistant — all wrapped in a distinctive **"Zalij Mode"** design language: matte black, royal gold, and Moroccan geometric motifs.

No frameworks. No build step. Pure **HTML5 / CSS3 / Vanilla JavaScript**, deployed instantly on **Vercel**.

> This repository is **private**. Access is restricted to the core team. Do not share source files, Supabase keys, or deployment credentials outside this org.

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JS (zero frameworks) |
| Backend / Auth | [Supabase](https://supabase.com) (Postgres, Auth, Realtime, RLS) |
| AI Engine | Local TF-IDF/keyword engine (`ai.html`) + serverless proxy (`/api/ai.js`) with Gemini/Groq fallback chain |
| Hosting | [Vercel](https://vercel.com) — static + serverless functions |
| Fonts | Cinzel (display), Rajdhani (body), JetBrains Mono (technical), Amiri (Arabic) |

---

## 📁 Repository Structure

```
zunexa/
├── index.html              # Auth — Sign In / Sign Up (Supabase)
├── dashboard.html           # Main app shell — Generator Hub, Analytics, History
├── ai.html                  # Zunexa Archon AI — local + cloud hybrid assistant
├── landing.html             # Public marketing landing page
├── billing.html             # Plan tiers & checkout
├── pro_accounts.html        # Manual plan-activation request flow
├── owner_admin.html         # Internal ops dashboard (owner-only)
├── settings.html            # Account, appearance, privacy, API keys
├── analytics.html           # Usage charts & content performance
├── affiliat.html            # Referral program
├── changelog.html           # Versioned release timeline
├── apps.html / downloads.html  # Native client distribution
│
├── theme.css                # Central design-token system (single source of truth)
├── style.css / styles.css   # Secondary page-specific stylesheets
│
├── sidebar-injection.js     # Universal sidebar + navbar (single <script> injection)
├── fab-injection.js         # Floating action button system
├── jarvis-bar.js            # Owner-only command bar
├── translator-bar.js        # Language switch UI
├── i18n-system.js           # 700+ string translation engine
├── onboarding.js            # First-run onboarding modal
│
├── ai.js                    # /api/ai serverless proxy (Gemini/Groq, key-isolated)
├── qa-database.js           # Structured Q&A knowledge base (coaching vertical)
│
├── zunexa_qa.json           # Core AI knowledge base (100+ Q&A entries)
├── zunexa_free_templates.json  # Free-tier content template bank
│
├── vercel.json              # Routing, headers, CSP, caching rules
└── LICENSE                  # Mozilla Public License 2.0
```

---

## 🎨 Design System — "Zalij Mode"

All visual identity flows through **`theme.css`** as the single source of truth:

- **Palette:** `--bg-void: #080808` · `--gold: #D4AF37` · `--gold-bright: #f0cc55`
- **Typography:** Cinzel for headings, Rajdhani for UI/body, JetBrains Mono for technical/code blocks
- **Motifs:** SVG Zellige/Zalij hexagonal tiling patterns as low-opacity background layers
- **Components:** Glassmorphism cards, gold-gradient buttons, animated gold particle canvas, pulse-glow CTAs

New pages must `<link rel="stylesheet" href="theme.css">` rather than duplicating tokens.

---

## 🚀 Deployment (Vercel)

This project deploys as a **zero-config static site** with serverless API routes.

```bash
# Production is auto-deployed from the default branch via Vercel Git integration.
# Manual deploy:
vercel --prod
```

Routing, security headers, and cache policy are defined in [`vercel.json`](./vercel.json):
- Strict CSP, X-Frame-Options: DENY, HSTS preload
- Clean URLs (`/ai` → `ai.html`, `/dashboard` → `dashboard.html`)
- Long-cache immutable assets for `theme.css`, injection scripts, and JSON data banks

**Environment variables required on Vercel** (Project → Settings → Environment Variables):
```
GEMINI_KEY_1
GEMINI_KEY_2        # optional
GEMINI_KEY_3        # optional
GROQ_KEY            # fallback provider
```
Keys are **never** exposed client-side — all AI calls route through `/api/ai.js`.

---

## 🔐 Security Notes

- Supabase Row-Level Security (RLS) is mandatory on all tables (`profiles`, `content_history`, `ai_knowledge`, `billing_requests`).
- Plan tier, role, and token balance are **never** trusted from client `localStorage` — server-side via Supabase RPC (`redeem_plan_code`) is the source of truth.
- `owner_admin.html` and `jarvis-bar.js` gate access via `profiles.role === 'owner'`, checked server-side.

---

## 🧩 Contributing (Internal)

1. Branch from `main`, prefix with `feat/`, `fix/`, or `chore/`.
2. New pages: link `theme.css`, then inject `sidebar-injection.js` + `fab-injection.js` before `</body>`.
3. Never duplicate design tokens — extend `theme.css` instead.
4. Log every release in `changelog.html` under a new version block.

---

## 📄 License

Licensed under the **Mozilla Public License 2.0** — see [`LICENSE`](./LICENSE).

---

<div align="center">

**Zunexa Digital Brand** · Bir Jdid, Morocco
Built with ✦ — Private & Confidential

</div>
