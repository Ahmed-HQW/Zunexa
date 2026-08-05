<div align="center">

<img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='16' fill='%23080808'/><rect x='2' y='2' width='60' height='60' rx='14' fill='none' stroke='%23D4AF37' stroke-width='1.5' opacity='.7'/><text x='32' y='43' text-anchor='middle' font-size='36' font-family='Georgia,serif' fill='%23D4AF37' font-weight='bold'>Z</text></svg>" width="72" height="72" alt="Zunexa"/>

# ✦ ZUNEXA
### AI Content & SaaS Platform — Zalij Mode

[![Live](https://img.shields.io/badge/🌐_Live-zunexa.vercel.app-D4AF37?style=flat-square&labelColor=080808)](https://zunexa.vercel.app)
[![Version](https://img.shields.io/badge/Version-V11_Clarity_Protocol-080808?style=flat-square&labelColor=D4AF37&color=080808)](./CHANGELOG.md)
[![Stack](https://img.shields.io/badge/Stack-Vanilla_JS_%2B_Supabase_%2B_Vercel-080808?style=flat-square)](.)
[![License](https://img.shields.io/badge/License-MPL_2.0-gold?style=flat-square)](./LICENSE)
[![Status](https://img.shields.io/badge/Status-Private_%E2%80%94_Core_Team_Only-red?style=flat-square)](.)

</div>

---

## 🏛 Overview

**Zunexa** is a premium, AI-powered SaaS platform engineered for the **Moroccan & MENA digital market**. It delivers a multi-dialect content generation engine (Darija · Gulf Arabic · Franco-Arabe · French · English · Spanish) fused with a complete SaaS operations layer — billing, analytics, a self-learning AI assistant, and a local-first PWA shell — all wrapped in the distinctive **"Zalij Mode"** design language: matte black, royal gold, Moroccan geometric motifs.

> **Zero frameworks. Zero build step.** Pure HTML5 / CSS3 / Vanilla JS, deployed instantly on Vercel.

> 🔒 This repository is **private**. Do not share source files, Supabase keys, or deployment credentials outside the core team.

---

## ⚙️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | HTML5 · CSS3 · Vanilla JS | Zero frameworks, zero build step |
| **AI — Local** | TF-IDF / BM25-style ranking (`ai.html`) | `tok()` → `buildIDF()` → `rankKB()` — runs fully in-browser |
| **AI — Cloud** | Gemini 1.5 Flash + Groq llama-3.1-8b-instant | Serverless proxy `/api/ai.js`, key-isolated via Vercel env vars |
| **AI — Free Fallback** | Pollinations.ai (`openai` backend) | Zero-key public endpoint for unauthenticated users |
| **AI — RAG Embed** | HuggingFace `all-MiniLM-L6-v2` | Semantic embedding layer (optional, token-gated) |
| **Knowledge Base** | `zunexa_qa_final.json` (592 entries) | Merged local + Supabase `ai_knowledge`, weight-adaptive |
| **Backend / Auth** | [Supabase](https://supabase.com) | Postgres · Auth · Realtime · RLS · Storage bucket |
| **Hosting** | [Vercel](https://vercel.com) | Static + Serverless functions, clean URLs, HSTS preload |
| **PDF Processing** | PDF.js 3.11 | In-browser PDF parsing for file-attach in Archon |
| **Archive Support** | JSZip 3.10 | ZIP attachment extraction in AI chat |
| **PWA** | Service Worker + `manifest.json` | Installable, offline shell, Add to Home Screen |
| **i18n** | `i18n-system.js` | 700+ string translation engine, 6 languages |
| **Fonts** | Cinzel · Rajdhani · JetBrains Mono · Amiri | Google Fonts — Arabic + Latin dual stack |

---

## 🤖 AI Engine — Deep Dive

The AI system in Zunexa is a **3-tier hybrid brain** built entirely in Vanilla JS with no external ML libraries in the critical path.

### Tier 1 — Local Knowledge Base (Instant, Zero Cost)

```
User Query
    │
    ▼
 tok()          — tokenize + normalize (Arabic · Darija · French · EN)
    │
    ▼
 buildIDF()     — Inverse Document Frequency cache over KB (592 entries)
    │
    ▼
 rankKB()       — TF-IDF cosine + keyword overlap + weight boost scoring
    │
    ├─ score ≥ CONFIDENT_MATCH  →  Direct answer + incrWeight()
    ├─ score ≥ SYNTHESIS_MATCH  →  Blend top-2 results + flag to user
    └─ score < MIN_CANDIDATE    →  escalate to Tier 2
```

**Key constants** (all in `THRESHOLDS` object — no magic numbers):
- `MIN_CANDIDATE_SCORE` — floor below which a KB entry is ignored
- `CONFIDENT_MATCH` — threshold for a direct confident answer
- `SYNTHESIS_MATCH` — threshold for blending two weak signals
- `SYNTHESIS_SECOND_MATCH` — minimum score for the runner-up to qualify

### Tier 2 — Cloud AI (Gemini / Groq fallback chain)

All cloud calls route through `/api/ai.js` (Vercel Serverless Function). Keys are **never** exposed client-side.

```
/api/ai.js fallback chain:
  GEMINI_KEY_1  →  gemini-1.5-flash
  GEMINI_KEY_2  →  gemini-1.5-flash  (optional redundancy)
  GEMINI_KEY_3  →  gemini-1.5-flash  (optional redundancy)
  GROQ_KEY      →  llama-3.1-8b-instant  (final cloud fallback)
```

### Tier 3 — Free Fallback (No Keys Required)

`Pollinations.ai` public endpoint (`text.pollinations.ai/openai`) — always available for guest users, requires zero API key.

### Archon Mode Detection

`detectArchonMode()` identifies the intent of the user query and switches system prompt:

| Mode | Trigger | Behavior |
|---|---|---|
| `code` | Code/programming keywords | Code assistant, syntax-highlighted blocks |
| `cli` | Terminal/command keywords | Pure bash/shell commands, no prose |
| `cowork` | Collaborative writing keywords | Long-form structured writing |
| `default` | Everything else | Standard Zunexa AI persona |

### Self-Learning Loop

```
Unknown query
    │
    ▼
learnQ()        — queues question in Supabase `ai_learning` (pending human review)
    │
    ▼
admin-review.html — owner approves/rejects learned Q&A
    │
    ▼
ai_knowledge table — approved entries merge into KB at next loadKB()
    │
    ▼
incrWeight()    — successful answers increase weight score (hot-path promotion)
```

### Archon Built-in Tools

Archon AI supports these inline tool modes (no API key needed):

| Tool | Keywords | Source |
|---|---|---|
| 🌤 Weather | طقس · جو · weather · météo | Open-Meteo API |
| 🔍 Web Search | بحث · search · chercher | DuckDuckGo instant API |
| 🗺 Geocoding | خريطة · map · maps | Nominatim / OpenStreetMap |
| 🐙 GitHub Search | github · مشروع | GitHub public search API |
| 📰 News | اخبار · news · actualités | RSS / DuckDuckGo news |
| 🎤 Voice Input | صوت · voice | Web Speech API (browser-native) |
| 📎 File Attach | ملف · file · PDF | PDF.js + JSZip + Supabase Storage |
| 🖼 Image Gen | صورة · image · photo | Pollinations image API |
| 🔒 Rate Limiter | — | 15 calls / 60s per session (anti-spam) |

### RAG Embedding (Optional Layer)

```
RAG_EMBED_URL = HuggingFace pipeline/feature-extraction
Model         = sentence-transformers/all-MiniLM-L6-v2
Trigger       = RAG_HF_TOKEN present in localStorage
```

---

## 🗂 Dashboard — Feature Map

`dashboard.html` is the main **single-page app shell** with tab-based navigation.

### Pages / Tabs

| Tab | ID | Description |
|---|---|---|
| 🏠 Home | `page-home` | Overview stats · Quick Generate · Recent Activity table |
| ✦ Generator Hub | `page-generator` | Full content generator with dialect + type selector |
| 📋 History | `page-history` | Full content history from `content_history` table (Supabase Realtime) |
| 📊 Analytics | `page-analytics` | CSS-based usage charts, token consumption |
| 🔍 SEO Tool | `page-seo` | SEO article generator with keyword input |

### Content Types Supported

```
Instagram Post  ·  TikTok Script  ·  LinkedIn Article
YouTube Description  ·  SEO Article  ·  Twitter/X Thread
```

### Dialect Options

```
🇲🇦 Darija (Moroccan Arabic)   ·  🇸🇦 Gulf Arabic
🇫🇷 French                     ·  🇬🇧 English
Franco-Arabe (Darija + French mix)  ·  Spanish
```

### Supabase Tables Used

| Table | Purpose |
|---|---|
| `profiles` | User name · email · plan tier · role · token balance |
| `content_history` | Every generation: type · language · preview · tokens_used |
| `generated_content` | Full generated text per generation |
| `ai_knowledge` | Self-learned Q&A (weight-adaptive, human-reviewed) |
| `api_keys` | User-managed API keys (encrypted) |

### Token System

- Each generation costs tokens based on content type and length
- Token balance displayed with animated progress bar
- Tracked server-side via `profiles.token_balance` — never trusted from client
- Realtime updates via Supabase `postgres_changes` subscription

---

## 📁 Repository Structure

```
zunexa/
│
├── ─ PAGES ──────────────────────────────────────────────────────────
│
├── index.html                  # Auth shell — Sign In / Sign Up (Supabase)
├── dashboard.html              # Main SPA — Generator Hub · History · Analytics
├── ai.html                     # Zunexa Archon AI — 3-tier hybrid assistant
├── landing.html                # Public marketing landing page
├── about.html                  # Platform overview & team
├── help.html                   # Help center & FAQ
├── guide.html                  # User guide & tutorials
├── settings.html               # Account · appearance · privacy · API keys
├── billing.html                # Plan tiers & checkout
├── upgrade.html                # Plan upgrade flow
├── pro_accounts.html           # Manual plan-activation request flow
├── admin-review.html           # Owner — review & approve AI learned Q&A
├── changelog.html              # Versioned public release timeline
├── archon-changelog.html       # Internal Archon AI changelog
├── downloads.html              # Native client / PWA distribution
├── CONTACT.html                # Contact form
│
├── ─ AI & DATA ──────────────────────────────────────────────────────
│
├── ai.js                       # /api/ai.js — Gemini + Groq serverless proxy
├── qa-database.js              # Structured Q&A base (coaching vertical)
├── zunexa_qa_final.json        # Master KB — 592 entries (local + merged)
├── zunexa_free_templates.json  # Free-tier content template bank
├── Templates_engine.json       # Template engine definitions
├── pricing.json                # Plan/tier definitions
│
├── ─ JAVASCRIPT MODULES ─────────────────────────────────────────────
│
├── app.js                      # Supabase Auth · Realtime chat · Q&A renderer
├── sidebar-injection.js        # Universal sidebar + navbar (single <script>)
├── fab-injection.js            # Floating action button system
├── jarvis-bar.js               # Owner-only command bar (role-gated)
├── translator-bar.js           # Language switch UI
├── i18n-system.js              # 700+ string i18n engine (6 languages)
├── onboarding.js               # First-run onboarding modal
│
├── ─ STYLES ─────────────────────────────────────────────────────────
│
├── theme.css                   # ★ Central design-token system (single source of truth)
├── style.css                   # Shared page styles (CONTACT · help)
│
├── ─ PWA ────────────────────────────────────────────────────────────
│
├── manifest.json               # PWA manifest — icons · name · theme color
├── service-worker.js           # SW — offline shell · cache strategy
├── icon-192.png                # PWA icon 192×192
├── icon-512.png                # PWA icon 512×512
├── icon-512-maskable.png       # PWA maskable icon
│
├── ─ CONFIG & INFRA ─────────────────────────────────────────────────
│
├── vercel.json                 # Routing · headers · CSP · cache rules
├── sitemap.xml                 # SEO sitemap
│
└── ─ DOCS ───────────────────────────────────────────────────────────
│
├── README.md                   # This file
├── CHANGELOG.md                # Developer changelog
├── LICENSE                     # Mozilla Public License 2.0
└── SECURITY.md                 # Security policy & disclosure
```

---

## 🎨 Design System — Zalij Mode

All visual identity flows from **`theme.css`** as the single source of truth. **Never duplicate tokens — extend `theme.css`.**

### Palette

```css
--bg-void:    #080808   /* near-black background        */
--bg-card:    #141414   /* card surfaces                */
--gold:       #D4AF37   /* primary brand gold           */
--gold-bright:#f0cc55   /* hover / active gold          */
--gold-dim:   #8a7022   /* muted gold                   */
--text-white: #f5f5f0   /* primary text                 */
--text-grey:  #9a9a8a   /* secondary text               */
```

### Typography

| Role | Font | Usage |
|---|---|---|
| Display / Headings | **Cinzel** (serif) | Logo, page titles, section headers |
| UI / Body | **Rajdhani** (sans) | All UI text, inputs, labels |
| Technical / Code | **JetBrains Mono** | Code blocks, API snippets |
| Arabic content | **Amiri** (Arabic serif) | RTL content blocks |

### Motifs & Components
- **Background:** Low-opacity SVG Zellige/Zalij hexagonal tiling patterns
- **Cards:** Glassmorphism with `backdrop-filter: blur()` + gold border
- **Buttons:** Gold-gradient with glow shadow on hover
- **Canvas:** Animated gold particle system on landing & AI pages
- **Animations:** CSS pulse-glow on CTAs, scroll-reveal entrance effects

---

## 🚀 Deployment

Zero-config static site + serverless API routes on **Vercel**.

```bash
# Auto-deployed from default branch via Vercel Git integration
# Manual deploy:
vercel --prod
```

### Clean URL Routing (`vercel.json`)

| URL | Destination |
|---|---|
| `/` | `dashboard.html` |
| `/ai` | `ai.html` |
| `/dashboard` | `dashboard.html` |
| `/home` | `landing.html` |
| `/upgrade` | `upgrade.html` |
| `/downloads` | `downloads.html` |

### Security Headers (all routes)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: strict (script/style/connect allowlist)
```

### Environment Variables (Vercel → Settings → Env Vars)

```env
GEMINI_KEY_1    # Primary Gemini 1.5 Flash key (required for Gemini)
GEMINI_KEY_2    # Optional redundancy key
GEMINI_KEY_3    # Optional redundancy key
GROQ_KEY        # Groq key — llama-3.1-8b-instant fallback
```

> Keys are **never** exposed client-side. All AI calls route through `/api/ai.js`.

---

## 🔐 Security

- **Supabase RLS is mandatory** on all tables: `profiles` · `content_history` · `generated_content` · `ai_knowledge` · `api_keys`
- Plan tier, role, and token balance are **never** trusted from `localStorage` — always verified server-side via Supabase
- `admin-review.html` and `jarvis-bar.js` gate access via `profiles.role === 'owner'`, checked against Supabase on every load
- Rate limiter on AI: **15 calls / 60 seconds** per session (prevents spam to `ai_learning` and `ai_knowledge`)
- Prompt injection patterns blocked before any query reaches the cloud tier
- Supabase anon key is publishable — RLS is the real security layer

---

## 🧩 Contributing (Internal)

1. Branch from `main` — prefix: `feat/` · `fix/` · `chore/`
2. **New pages:** `<link rel="stylesheet" href="theme.css">` → inject `sidebar-injection.js` + `fab-injection.js` before `</body>`
3. **Never** duplicate design tokens — extend `theme.css` instead
4. **AI KB changes:** run through `admin-review.html` flow — no direct edits to `zunexa_qa_final.json` in prod
5. **Log every release** in `changelog.html` under a new version block
6. Double-check RLS is ON before any new Supabase table goes live

---

## 📄 License

Licensed under the **Mozilla Public License 2.0** — see [`LICENSE`](./LICENSE).

---

<div align="center">

**Zunexa Digital Brand** · Bir Jdid, Morocco
Built with ✦ — Private & Confidential

*"Zalij Mode — The Future of Moroccan Digital Content"*

</div>
