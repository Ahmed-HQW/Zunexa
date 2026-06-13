// /api/ai.js
// ─────────────────────────────────────────────────────────────
// Zunexa AI — Secure Serverless Proxy (Vercel)
// All API keys are read ONLY from environment variables.
// Never hardcode keys here or anywhere in client-side code.
//
// Required Environment Variables (set in Vercel → Settings → Environment Variables):
//   GEMINI_KEY_1   (primary Gemini key — required for Gemini to work)
//   GEMINI_KEY_2   (optional extra Gemini key)
//   GEMINI_KEY_3   (optional extra Gemini key)
//   GROQ_KEY       (Groq key — used as final cloud fallback)
//
// Request body (POST, application/json):
//   { "prompt": "...", "system": "optional system prompt" }
//
// Response:
//   { "text": "...", "source": "gemini-1" | "gemini-2" | "gemini-3" | "groq" }
//   or, if all providers fail:
//   { "text": null, "error": "all_providers_failed" }  (HTTP 200 — let the
//     frontend fall back to the local Zunexa AI engine instead of erroring)
// ─────────────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-1.5-flash';
const GROQ_MODEL   = 'llama-3.1-8b-instant';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX       = 20;
const _rateLog = new Map(); // ip -> [timestamps]

function checkRateLimit(ip) {
  const now = Date.now();
  const arr = (_rateLog.get(ip) || []).filter(t => t > now - RATE_LIMIT_WINDOW_MS);
  if (arr.length >= RATE_LIMIT_MAX) return false;
  arr.push(now);
  _rateLog.set(ip, arr);
  return true;
}

async function callGemini(apiKey, prompt, system) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.85, maxOutputTokens: 700 },
  };
  if (system) body.system_instruction = { parts: [{ text: system }] };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`gemini_http_${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('gemini_empty_response');
  return text;
}

async function callGroq(apiKey, prompt, system) {
  const messages = [];
  if (system) messages.push({ role: 'system', content: system });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.85,
      max_tokens: 700,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`groq_http_${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('groq_empty_response');
  return text;
}

export default async function handler(req, res) {
  // CORS — restrict to same-origin in production
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ text: null, error: 'method_not_allowed' });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ text: null, error: 'rate_limited' });
  }

  const { prompt, system } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ text: null, error: 'missing_prompt' });
  }
  if (prompt.length > 4000) {
    return res.status(400).json({ text: null, error: 'prompt_too_long' });
  }

  // Build ordered list of providers to try
  const providers = [];
  if (process.env.GEMINI_KEY_1) providers.push({ name: 'gemini-1', fn: () => callGemini(process.env.GEMINI_KEY_1, prompt, system) });
  if (process.env.GEMINI_KEY_2) providers.push({ name: 'gemini-2', fn: () => callGemini(process.env.GEMINI_KEY_2, prompt, system) });
  if (process.env.GEMINI_KEY_3) providers.push({ name: 'gemini-3', fn: () => callGemini(process.env.GEMINI_KEY_3, prompt, system) });
  if (process.env.GROQ_KEY)     providers.push({ name: 'groq',     fn: () => callGroq(process.env.GROQ_KEY, prompt, system) });

  if (providers.length === 0) {
    // No keys configured at all — let frontend use local engine silently
    return res.status(200).json({ text: null, error: 'no_providers_configured' });
  }

  const errors = [];
  for (const provider of providers) {
    try {
      const text = await provider.fn();
      return res.status(200).json({ text, source: provider.name });
    } catch (err) {
      errors.push(`${provider.name}: ${err.message}`);
      // continue to next provider
    }
  }

  // All providers failed — return 200 with text:null so the frontend
  // gracefully falls back to the local Zunexa AI engine instead of
  // showing a hard error to the user.
  console.error('[Zunexa AI Proxy] All providers failed:', errors.join(' | '));
  return res.status(200).json({ text: null, error: 'all_providers_failed' });
}
