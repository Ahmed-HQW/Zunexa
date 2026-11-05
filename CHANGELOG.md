## [Unreleased] — 2026-11-05 (action hallucination guard + Supabase audit)

### 🐛 Fixed
- `ZunexaActions.extract()` تقبل الآن ` ```zx-action ` و` ```zx_action ` و` ```json ` (إن احتوى `action` معروفاً). كتل json العادية غير المرتبطة بإجراء تبقى بالنص.
- `ZunexaActions.guard()` + ربطها فـ `ai.html send()`: إذا طلب المستخدم إجراءً وادّعى النموذج التنفيذ بلا كتلة، يُضاف تحذير صريح بدل هلوسة صامتة.
- `promptAddendum`: منع صريح لقول «تم» بلا كتلة zx-action.

### 🔍 Supabase audit (project xrldhfsytysznyyhwjlr)
- كل Edge Functions `ACTIVE`: ai-openrouter/gemini/groq/deepseek, agent-planner, google-action. (إدخال 2026-10-21 عن غياب `agent-planner` لم يعد صحيحاً.)
- RPCs موجودة: zx_google_status, zx_morocco_search, get_personalized_quick_chips, track_user_category, merge_device_interests, zx_register_device, zx_track_request.
- جدولا `zx_tasks` و`shared_chats` غير موجودين.

### ⏭️ Remaining
- تشغيل `supabase/zx_tasks.sql` فـ SQL Editor (لم يُطبَّق آلياً).
- `shared_chats` يحتاج SQL ديال `ZUNEXA_DB_SETUP_SHARED_CHATS.sql` (غير مرفق).

## [Unreleased] — 2026-11-05 (math hijack + tool arg guard)

### 🐛 Fixed
- `MathEngine.looksLikeMath` كانت تلتقط `10:00+01:00` / `Test 1 : ...` فتحل `0 + 1` وتمنع وصول الرسالة للنموذج. الآن الرسالة كلها يجب أن تكون تعبيراً رياضياً صرفاً (`archon-brain-ext.js` + النسخة المضمّنة فـ `ai.html`).
- `rewriteAsToolCommand`: الأوامر الصريحة `/map ...` لم تعد تُحوَّل (كانت تنتج `/خريطة / X`)، وحجة الأداة محدودة بـ1–3 كلمات بلا كلمات استفهام (كانت `how is the weather` → `/طقس how is the`).

## [Unreleased] — 2026-11-05 (tool routing hijack fix)

### 🐛 Fixed
- `ai.html` `rewriteAsToolCommand()`: كلمة مفتاحية داخل كلمة أخرى (`map` فـ `open_maps`) كانت تحوّل رسالة كاملة لأمر `/خريطة` فلا تصل للنموذج ("لم أجد ... على الخريطة"). الآن: تجاهل الرسائل متعددة الأسطر أو أطول من 80 حرفاً/10 كلمات، ومطابقة بحدود الكلمة للكلمات اللاتينية. الأوامر الصريحة `/map` لم تتأثر.

## [Unreleased] — 2026-11-04 (Unified Connectors + Settings Control Center)

### ✨ Added
- **`zunexa-connectors.js`** — `ZunexaConnectors.call(name,args)` / `.fetchAll(spec)` / `.register(name,label,fn)`: fetch موحّد بالتوازي (timeout 8s، `Promise.all` مع عزل الأخطاء، قياس الزمن) لـ `google_status`, `calendar`, `tasks` (Supabase `zx_tasks` مع fallback محلي), `geo`, `device_location`, `providers`. الإجراءات تمر عبر `ZunexaActions._registry` (validate ثم run) فلا تُكرَّر القواعد الأمنية. مُتاح أيضاً كـ `ZunexaActions.connectors`.
- **`providers` connector** — preflight `OPTIONS` لكل Edge Function (`ai-openrouter/gemini/groq/deepseek`)؛ 404 = غير منشورة (يكشف مباشرة غياب `ai-deepseek` و`agent-planner`).
- **`zunexa-control.js` + تبويب "التحكم" فـ `settings.html`** — فحص حي للـ Connectors، عرض/حذف/تصدير/استيراد كل مفاتيح `zx_*`، مزامنة لـ `profiles.app_settings`. مفاتيح `sb-*` و`zx_api_keys` مستثناة من العرض والتصدير والاستيراد.

### 🐛 Fixed
- `zunexa-Time-Tracker.js` → `zunexa-time-tracker.js` (ai.html كيحمّله بالحروف الصغيرة؛ Vercel حساس للحالة = 404).
- `robots.txt`: إزالة أي `Disallow` لـ `ai.html` إن وُجد.
- `vercel.json`: أي rewrite لوجهة غير موجودة يُحوَّل إلى `/ai.html`.

### ⏭️ Remaining
- `google-action` Edge Function و`google_integration.sql` لم تُفحص (غير مرفقة)؛ عقدها مستنتج من `zunexa-actions.js`.
- لم يُنفَّذ فحص حي لمشروع Supabase `xrldhfsytysznyyhwjlr`؛ استعمل تبويب "التحكم" ← حالة الـ Connectors للتحقق.
- `agent-planner` و`ai-deepseek` غير منشورتين (راجع إدخال 2026-10-21).

## [Unreleased] — 2026-10-31 (profiles NULLs root cause, profiles v2 migration, instant login redirect)

### 🐛 Fixed
- **`profiles` NULLs (username / first_name / email / phone / avatar / country)** — root cause was in the database, not the front-end. The trigger function `handle_new_user()` (on `auth.users` INSERT) only ran `INSERT INTO profiles (id, plan)`, so every account created through it had every other column NULL. Compounding it: 35 of 58 auth users signed in with Google (never touch `index.html`'s signup code), and with email confirmation ON `signUp()` returns no session, so the client `profiles.upsert()` was skipped by design. The `zx_pending_profile` fallback written by `index.html` was **never read anywhere in `ai.html`** (zero matches), so it never healed anything.
  Measured before the fix (read-only queries on production): 58 `auth.users`, 36 `profiles`, 22 users with no profile row, `email` NULL in 36/36, `phone` NULL in 36/36, `country` NULL in 33, `username`/`first_name` NULL in 3, `avatar_url` NULL in 19.
  Fix (`zunexa_profiles_v2.sql`): `handle_new_user()` replaced in place (same name, so trigger `on_auth_user_created` is unchanged) and now delegates to `private.zx_upsert_profile(auth.users)`, which fills username, first/full name, email, phone, avatar, country from `auth.users` + `raw_user_meta_data` (Google `name`/`picture`/`given_name` supported), never overwrites user-edited values, never fails on the UNIQUE `profiles.phone`, and never blocks a signup (exception handler falls back to the minimal row). New trigger `zx_on_auth_user_updated` keeps email / confirmation / last sign-in in sync and self-heals a missing profile row. Backfill included (the `N8N` onboarding webhook trigger is disabled during the backfill and re-enabled so old users do not fire it).
  Verify (dry-run only, inside `BEGIN … ROLLBACK`): profiles 36 → 58, users without profile 22 → 0, NULL username/email/first_name 0. NULL phone/country/avatar remain where the user never provided them. After the rollback, production was re-queried and is unchanged (36 rows, `N8N` trigger enabled, no new columns, no `private` schema).

### 🔒 Security
- **[HIGH] Any signed-in user could set their own `plan`, `tokens_balance`, `referral_credits`** — `anon` and `authenticated` held INSERT/UPDATE on every `profiles` column (only `role` was protected, by an RLS `WITH CHECK`). Also held TRUNCATE/DELETE/TRIGGER/REFERENCES. `zunexa_profiles_v2.sql` revokes all of it and re-grants SELECT plus INSERT/UPDATE on safe columns only (names, phone, country, city, avatar_url, theme, app_settings, social handles, …). `plan`, `tokens_balance`, `role`, `referral_*`, `email`, `is_banned`, counters and storage columns are now written only by triggers, SECURITY DEFINER RPCs or `service_role`.
- Ban / blocked-device enforcement is also in RLS (RESTRICTIVE policies), because banning does not invalidate an already-issued access token.
- All new SECURITY DEFINER code uses `SET search_path = ''`; helpers live in the non-exposed `private` schema; client RPCs are `authenticated`-only and check `auth.uid()`.

### ✨ Added
- **`profiles` new columns** (additive): `city`, `country_code`, `language`, `timezone`, `plan_expires_at`, `device_id`, `first_device_id`, `devices_count`, `last_user_agent`, `requests_total/today/month`, `usage_day`, `usage_month`, `tokens_used_total`, `last_request_at`, `storage_used_bytes`, `storage_limit_bytes` (100 MB default), `files_count`, `is_banned`, `ban_reason`, `banned_at`, `auth_provider`, `email_confirmed_at`, `last_sign_in_at`, `onboarding_done`, `referred_by`.
- **Tables**: `user_devices` (one row per user+device, RLS select-own) and `blocked_devices` (RLS on, no policies → service_role only).
- **RPCs** (authenticated only): `zx_register_device(p_device_id, p_user_agent)` → `{banned, device_blocked}`; `zx_track_request(p_tokens)`; `zx_refresh_storage_usage()`. Admin helpers `private.zx_ban_user(uuid, text)` / `private.zx_unban_user(uuid)` (also blocks the user's devices and deletes their sessions).
- `profiles.plan` / `plan_expires_at` now mirror `user_plans` via trigger `zx_user_plans_sync` (backfilled; 0 mismatches).
- Avatar storage policies for `zunexa-uploads/avatars/<uid>/…` (insert/update/delete, own folder only).

### ⚡ Performance
- **`index.html` instant redirect** — the inline `<head>` script now also redirects when the access token is expired but a `refresh_token` exists (previously those users saw the login page first, then waited for `getSession()`), hides the page (`visibility:hidden`, auto-restored after 2.5 s if navigation fails) so there is no login flash, and uses a `sessionStorage` flag `zx_bounce` (set by `ai.html` / `agent.html` before bouncing a dead session back) to prevent redirect loops. No timing figure is claimed; none was measured.

### 🔗 Front-end wiring (patched copies in `patched/`)
- `ai.html`: `loadUser()` reads `profiles.plan`, redeems a parked `zx_pending_plan_code`, calls `zxRegisterDevice()` (signs out banned/blocked); geo now also writes `country_code` + `city`; avatar upload and chat-file upload refresh storage usage; `logMsg()` calls `zx_track_request` (awaited — supabase-js builders are lazy); auth guard sets `zx_bounce`.
- `agent.html`: guard sets `zx_bounce`; `bootstrap()` registers the device and enforces ban.
- `index.html`: client `profiles.upsert` and the `zx_pending_profile` stash removed (the DB trigger now does it); `country` / `country_code` sent in `user_metadata`.
- **Bug fixed**: `index.html` called `redeem_plan_code` with `{ p_code }`, but the real function signature is `redeem_plan_code(code_input text)` and it returns `{success, plan, expires_at, error}` — plan codes entered on the login page could never work. Param and result handling corrected.
- Syntax of every inline `<script>` in the three patched files verified with `node --check` (0 errors). Not tested in a real browser.

### 🔍 Findings (no change made)
- Duplicate triggers on `auth.users`: `on_auth_user_created_tokens` and `trg_new_user_plan` both run `handle_new_user_tokens()`; `profiles` has two identical `updated_at` triggers (`profiles_updated_at`, `trg_profiles_updated_at`). Harmless (idempotent) but redundant.
- `N8N` trigger on `profiles` INSERT posts to a `webhook-test` URL (n8n test mode).
- Existing storage policy `zunexa_uploads_anyone_insert` lets anyone (including anonymous) upload to the public bucket without limit.
- The 22 users without a profile are most likely the accounts whose empty profiles were deleted on 2026-10-24 ("21 empty profiles deleted", `auth.users` untouched). The backfill recreates a profile for them (email + generated username). If those were meant to stay deleted, delete the `auth.users` rows instead, before running the migration.
- Existing `country` values may be names (written by `ai.html`) or codes (written by old `index.html`); `country_code` column now separates them.
- `profiles.username` contained 2-character names, upper-case letters and a name with other symbols, so the new `profiles_username_format` constraint (NOT VALID) only enforces length 2–40.

### ⏭️ Remaining / blocked
- **`zunexa_profiles_v2.sql` is NOT applied to production** — only dry-run and rolled back. Needs an explicit go-ahead (or run it yourself in the SQL editor), ideally after deciding about the 22 profile-less users above.
- After applying: run the Supabase security advisor; check other pages (`settings.html`, `dashboard.html`, `admin.html`) for direct writes to `plan`, `tokens_balance`, `email` on `profiles` — those would now get `permission denied for column`.
- Edge Functions (`agent-planner`, `ai-*`) do not yet check `blocked_devices` / `is_banned`; only RLS and the client do.
- `ZX_GOOGLE_CLIENT_ID` in `index.html` is still the placeholder (unchanged).
- No end-to-end test with a real signup (email + Google) was run.

### update and fix 
- -fix all this- **'vercel.json كيدير rewrite من / لـ dashboard.html، وهاد الملف ماكاينش فالـ repo.
robots.txt كيمنع ai.html، وهو التطبيق الرئيسي.
ai.html كيحمّل zunexa-time-tracker.js والملف الحقيقي سميتو Zunexa-Time-Tracker.js. على Vercel الحروف الكبيرة والصغيرة مهمين، يعني غادي يعطي 404.**
