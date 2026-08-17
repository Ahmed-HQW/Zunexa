# Zunexa — دليل النشر (Deploy Guide)

بنية المجلدات اللي وصلتك:

```
zunexa-secure/
├── supabase/
│   ├── db_schema.sql          # migration 1 — user_plan, request_plan, ai_knowledge
│   ├── redeem_codes.sql       # migration 2 — جدول الأكواد + دالة redeem_plan_code
│   ├── .env.example           # مثال للـ secrets (Edge Functions)
│   └── functions/
│       ├── _shared/
│       │   ├── cors.ts
│       │   └── auth-check.ts
│       ├── ai-openrouter/index.ts
│       ├── ai-gemini/index.ts
│       ├── ai-groq/index.ts
│       └── ai-deepseek/index.ts
└── frontend/
    └── ai.html                # يبدل ملف ai.html القديم ديالك بالكامل
```

## 1) الجداول (SQL)

فـ Supabase Dashboard → SQL Editor:

1. لصق و تشغيل محتوى `db_schema.sql` (مرة وحدة).
2. من بعد لصق و تشغيل محتوى `redeem_codes.sql`.

هاد السكربتات كيستعملو `IF NOT EXISTS` — إلا كانت عندك جداول بأسماء أعمدة مختلفة، غادي يعطيوك error فواضح بحال "column already exists" وماغاديش يمسحو داتا. قوليها ليا نصلح.

## 2) Edge Functions

من `/home/claude/zunexa-secure` (ولا فين ما نزلتي المجلد فالـ PC ديالك):

```bash
# 1. تثبيت Supabase CLI (إلا ماكانش مثبت)
npm install -g supabase

# 2. الدخول
supabase login

# 3. ربط المشروع (خد project-ref من Supabase Dashboard → Settings → General)
supabase link --project-ref YOUR_PROJECT_REF

# 4. ضبط الـ Secrets (بدل القيم فـ supabase/.env.example بالحقيقيين
#    وسميه .env.production، من بعد:)
cd supabase
supabase secrets set --env-file .env.production

# 5. نشر الأربعة functions
supabase functions deploy ai-openrouter
supabase functions deploy ai-gemini
supabase functions deploy ai-groq
supabase functions deploy ai-deepseek
```

بعد النشر، الروابط ديالهم غادي يكونو:
```
https://YOUR_PROJECT.supabase.co/functions/v1/ai-openrouter
https://YOUR_PROJECT.supabase.co/functions/v1/ai-gemini
https://YOUR_PROJECT.supabase.co/functions/v1/ai-groq
https://YOUR_PROJECT.supabase.co/functions/v1/ai-deepseek
```

## 3) ai.html

1. حل `frontend/ai.html`.
2. بدل هاد جوج أسطر فأول `<script>`:
```js
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```
(خدهم من Supabase Dashboard → Settings → API — الـ anon key آمن يكون فالفرونت إند، مصمم لهاد الغرض، ماشي بحال الـ service_role key).

3. عوّض ملف `ai.html` القديم بهاد الواحد فالمشروع ديالك (نفس المكان جنب `index.html`).

## 4) Vercel — CORS

فـ `supabase/functions/_shared/cors.ts`، بدل:
```ts
"Access-Control-Allow-Origin": "*",
```
بـ:
```ts
"Access-Control-Allow-Origin": "https://zunexa.vercel.app",
```
من بعد `supabase functions deploy` بجميع الأربعة مرة أخرى باش التغيير يتطبق.

## 5) أول Redeem Code (تجربة)

فـ SQL Editor:
```sql
insert into public.redeem_codes (code, plan, billing_cycle, duration_days, max_uses)
values ('ZUNEXA-TEST-001', 'pro', 'monthly', 30, 1);
```

## 6) ضروري بزاف — تدوير المفاتيح

المفاتيح اللي بعثتيهم فهاد المحادثة (OpenRouter, Gemini x4, Groq x2, DeepSeek x2) بانو فالنص فهاد المحادثة، يعني تقنياً معروضين. قبل ما تحط شي حقيقي فالإنتاج:

1. **OpenRouter**: dashboard → API Keys → Delete القديم → Create جديد.
2. **Gemini**: Google AI Studio → API Keys → Delete القديم → Create جديد (والجوج اللي بصيغة `AQ.` كيبان أنهم OAuth tokens ماشي API keys، ماغاديش يخدمو أصلاً فـ Edge Function).
3. **Groq**: console.groq.com → API Keys → Revoke القديم → Create جديد.
4. **DeepSeek**: platform.deepseek.com → API Keys → Delete القديم → Create جديد.

من بعد حط المفاتيح الجداد فـ `supabase secrets set`، ماشي فأي ملف كود.
