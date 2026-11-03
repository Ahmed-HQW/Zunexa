// Deploy: supabase functions deploy google-action --no-verify-jwt
// Secrets: GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_REDIRECT_URI GOOGLE_TOKEN_KEY GOOGLE_STATE_SECRET APP_URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const E = (k: string) => Deno.env.get(k) ?? '';
const admin = createClient(E('SUPABASE_URL'), E('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const CORS = { 'Access-Control-Allow-Origin': E('APP_URL') || '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, 'Content-Type': 'application/json' } });
const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/tasks', 'https://www.googleapis.com/auth/gmail.send'];

const te = new TextEncoder();
const toB64 = (u: Uint8Array) => { let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192)); return btoa(s); };
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (u: Uint8Array) => toB64(u).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function aesKey() { return crypto.subtle.importKey('raw', fromB64(E('GOOGLE_TOKEN_KEY')), 'AES-GCM', false, ['encrypt', 'decrypt']); }
async function enc(plain: string) { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(), te.encode(plain))); return toB64(iv) + '.' + toB64(ct); }
async function dec(s: string) { const [iv, ct] = s.split('.'); return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(iv) }, await aesKey(), fromB64(ct))); }
async function hmac(msg: string) { const k = await crypto.subtle.importKey('raw', te.encode(E('GOOGLE_STATE_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', k, te.encode(msg)))); }
async function makeState(uid: string) { const p = `${uid}.${Date.now() + 10 * 60_000}`; return `${p}.${await hmac(p)}`; }
async function readState(st: string) { const [uid, exp, sig] = st.split('.'); if (!uid || !exp || sig !== await hmac(`${uid}.${exp}`) || Date.now() > +exp) throw new Error('bad_state'); return uid; }

async function authUser(req: Request) {
  const t = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const { data, error } = await admin.auth.getUser(t);
  if (error || !data.user) throw Object.assign(new Error('not_authenticated'), { status: 401 });
  return data.user;
}
async function accessToken(uid: string) {
  const { data } = await admin.from('user_integrations').select('refresh_token_enc').eq('user_id', uid).eq('provider', 'google').maybeSingle();
  if (!data) throw Object.assign(new Error('google_not_connected'), { status: 409 });
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: E('GOOGLE_CLIENT_ID'), client_secret: E('GOOGLE_CLIENT_SECRET'), refresh_token: await dec(data.refresh_token_enc), grant_type: 'refresh_token' }) });
  const j = await r.json();
  if (!r.ok) { if (j.error === 'invalid_grant') await admin.from('user_integrations').delete().eq('user_id', uid).eq('provider', 'google'); throw Object.assign(new Error('google_reauth_required'), { status: 409 }); }
  return j.access_token as string;
}
const G = (tok: string, url: string, init: RequestInit = {}) => fetch(url, { ...init, headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });

const S = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const ISO = (v: unknown) => { const t = Date.parse(String(v)); if (isNaN(t)) throw Object.assign(new Error('bad_date'), { status: 400 }); return new Date(t).toISOString(); };
const MAIL = (v: unknown) => { const s = S(v, 254); if (!/^[^\s@<>,;\r\n]+@[^\s@<>,;\r\n]+\.[^\s@<>,;\r\n]+$/.test(s)) throw Object.assign(new Error('bad_email'), { status: 400 }); return s; };

async function exec(uid: string, action: string, a: Record<string, unknown>) {
  if (action === 'send_email') {
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { count } = await admin.from('zx_action_log').select('id', { count: 'exact', head: true }).eq('user_id', uid).eq('action', 'send_email').gte('created_at', since);
    if ((count ?? 0) >= 20) throw Object.assign(new Error('email_daily_limit'), { status: 429 });
  }
  const tok = await accessToken(uid);
  let res: Response;
  if (action === 'create_event') {
    const start = ISO(a.start); const end = a.end ? ISO(a.end) : new Date(Date.parse(start) + 3_600_000).toISOString();
    const rem = Math.min(Math.max(parseInt(String(a.remind ?? 10), 10) || 0, 0), 10080);
    res = await G(tok, 'https://www.googleapis.com/calendar/v3/calendars/primary/events', { method: 'POST', body: JSON.stringify({
      summary: S(a.title, 200) || 'Event', description: S(a.description, 2000), location: S(a.location, 200),
      start: { dateTime: start }, end: { dateTime: end }, reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: rem }] } }) });
  } else if (action === 'list_events') {
    const from = ISO(a.from), to = ISO(a.to);
    if (Date.parse(to) - Date.parse(from) > 31 * 86_400_000) throw Object.assign(new Error('range_too_long'), { status: 400 });
    res = await G(tok, `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&maxResults=15&timeMin=${encodeURIComponent(from)}&timeMax=${encodeURIComponent(to)}`);
    if (res.ok) { const j = await res.json(); return { events: (j.items || []).map((e: any) => ({ title: e.summary, start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date, location: e.location })) }; }
  } else if (action === 'create_task') {
    const body: Record<string, unknown> = { title: S(a.title, 200), notes: S(a.notes, 1000) };
    if (a.due) body.due = ISO(a.due);
    if (!body.title) throw Object.assign(new Error('bad_title'), { status: 400 });
    res = await G(tok, 'https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', { method: 'POST', body: JSON.stringify(body) });
  } else if (action === 'send_email') {
    const to = MAIL(a.to), subject = S(a.subject, 200); if (/[\r\n]/.test(subject)) throw Object.assign(new Error('bad_subject'), { status: 400 });
    const bodyB64 = toB64(te.encode(S(a.body, 8000))).replace(/(.{76})/g, '$1\r\n');
    const mime = [`To: ${to}`, `Subject: =?UTF-8?B?${toB64(te.encode(subject))}?=`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '', bodyB64].join('\r\n');
    res = await G(tok, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', body: JSON.stringify({ raw: b64url(te.encode(mime)) }) });
  } else throw Object.assign(new Error('unknown_action'), { status: 400 });
  if (!res.ok) throw Object.assign(new Error('google_error_' + res.status), { status: 502 });
  await admin.from('zx_action_log').insert({ user_id: uid, action });
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const url = new URL(req.url);
  try {
    if (req.method === 'GET' && (url.searchParams.has('code') || url.searchParams.has('error'))) {
      const back = (q: string) => Response.redirect(`${E('APP_URL')}/settings.html?tab=integrations&google=${q}`, 302);
      if (url.searchParams.has('error')) return back('denied');
      const uid = await readState(url.searchParams.get('state') || '');
      const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code: url.searchParams.get('code')!, client_id: E('GOOGLE_CLIENT_ID'), client_secret: E('GOOGLE_CLIENT_SECRET'), redirect_uri: E('GOOGLE_REDIRECT_URI'), grant_type: 'authorization_code' }) });
      const j = await r.json();
      if (!r.ok || !j.refresh_token) return back('no_refresh');
      const mail = j.id_token ? JSON.parse(atob(j.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).email : null;
      await admin.from('user_integrations').upsert({ user_id: uid, provider: 'google', refresh_token_enc: await enc(j.refresh_token), scopes: String(j.scope || '').split(' '), email: mail, updated_at: new Date().toISOString() });
      return back('ok');
    }
    const user = await authUser(req); const op = url.searchParams.get('op');
    if (op === 'start') {
      const q = new URLSearchParams({ client_id: E('GOOGLE_CLIENT_ID'), redirect_uri: E('GOOGLE_REDIRECT_URI'), response_type: 'code', scope: SCOPES.join(' '),
        access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state: await makeState(user.id) });
      return json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${q}` });
    }
    if (op === 'disconnect') {
      const { data } = await admin.from('user_integrations').select('refresh_token_enc').eq('user_id', user.id).eq('provider', 'google').maybeSingle();
      if (data) { try { await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token: await dec(data.refresh_token_enc) }) }); } catch (_) { /* best effort */ } }
      await admin.from('user_integrations').delete().eq('user_id', user.id).eq('provider', 'google');
      return json({ ok: true });
    }
    if (op === 'exec') { const b = await req.json(); return json(await exec(user.id, String(b.action), (b.args || {}) as Record<string, unknown>)); }
    return json({ error: 'unknown_op' }, 400);
  } catch (e) {
    const err = e as Error & { status?: number };
    return json({ error: err.message || 'server_error' }, err.status || 500);
  }
});
