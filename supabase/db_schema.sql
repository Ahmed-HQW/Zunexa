-- ============================================================
-- Zunexa — Migration آمنة لجداول user_plan / request_plan / ai_knowledge
-- ============================================================
-- ملاحظة مهمة: هاد السكربت كيستعمل CREATE TABLE IF NOT EXISTS
-- و ADD COLUMN IF NOT EXISTS، يعني ماغاديش يمسح أي داتا كاينة عندك.
-- إلا كانت الأعمدة ديالك مختلفة فالأصل، بدل الأسماء تحت قبل التشغيل
-- (فـ Supabase SQL Editor) أو قوليها ليا نصلحها.
-- ============================================================

-- تفعيل الإضافة ديال UUID إلا ماكانتش مفعلة
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) user_plan — الخطة الحالية لكل مستخدم
-- ------------------------------------------------------------
create table if not exists public.user_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free'
    check (plan in ('free','pro','max','standard','premium')),
  billing_cycle text default 'monthly'
    check (billing_cycle in ('monthly','yearly', null)),
  status text not null default 'active'
    check (status in ('active','expired','cancelled')),
  redeemed_code text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.user_plan enable row level security;

drop policy if exists "user_plan_select_own" on public.user_plan;
create policy "user_plan_select_own"
  on public.user_plan for select
  using (auth.uid() = user_id);

drop policy if exists "user_plan_update_own" on public.user_plan;
create policy "user_plan_update_own"
  on public.user_plan for update
  using (auth.uid() = user_id);

-- الإدخال الأولي كيتم عبر trigger باش المستخدم مايقدرش يعطي نفسه plan مباشرة
drop policy if exists "user_plan_insert_own" on public.user_plan;
create policy "user_plan_insert_own"
  on public.user_plan for insert
  with check (auth.uid() = user_id and plan = 'free');

-- ------------------------------------------------------------
-- 2) request_plan — طلبات الترقية (الاسم + الإيميل باش تتواصل معاه)
-- ------------------------------------------------------------
create table if not exists public.request_plan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  requested_plan text not null,
  message text,
  status text not null default 'pending'
    check (status in ('pending','contacted','done','rejected')),
  created_at timestamptz not null default now()
);

alter table public.request_plan enable row level security;

-- أي حد (حتى غير مسجل) يقدر يبعث طلب
drop policy if exists "request_plan_insert_any" on public.request_plan;
create policy "request_plan_insert_any"
  on public.request_plan for insert
  with check (true);

-- المستخدم كيشوف غير الطلبات ديالو
drop policy if exists "request_plan_select_own" on public.request_plan;
create policy "request_plan_select_own"
  on public.request_plan for select
  using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 3) ai_knowledge — قاعدة المعرفة لـ RAG (مرتبطة بـ review-cli.js ديالك)
-- ------------------------------------------------------------
create table if not exists public.ai_knowledge (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text,
  is_active boolean not null default false,
  weight numeric not null default 0,
  review_status text not null default 'pending_review'
    check (review_status in ('pending_review','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.ai_knowledge enable row level security;

-- القراءة العمومية مسموحة غير للمعتمد والمفعل (باش ai.html يقرا مباشرة
-- بالـ anon key من غير ما يكشف الإدخالات المعلقة أو المرفوضة)
drop policy if exists "ai_knowledge_select_approved" on public.ai_knowledge;
create policy "ai_knowledge_select_approved"
  on public.ai_knowledge for select
  using (is_active = true and review_status = 'approved');

-- الكتابة (insert/update) ممنوعة من anon/authenticated — غير عبر
-- service_role (من review-cli.js أو Edge Function بالمفتاح ديال السيرفر)
-- ما درناش policy لـ insert/update عمداً، يعني ممنوعة بشكل افتراضي.

-- ------------------------------------------------------------
-- 4) Trigger: كل مستخدم جديد كيتولد ليه صف free فـ user_plan تلقائياً
-- ------------------------------------------------------------
create or replace function public.handle_new_user_plan()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_plan (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_plan on auth.users;
create trigger on_auth_user_created_plan
  after insert on auth.users
  for each row execute function public.handle_new_user_plan();

-- ------------------------------------------------------------
-- 5) updated_at تلقائي فـ user_plan
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_plan_updated_at on public.user_plan;
create trigger set_user_plan_updated_at
  before update on public.user_plan
  for each row execute function public.set_updated_at();

-- ============================================================
-- انتهت الـ migration. شغلها فـ Supabase SQL Editor مرة وحدة.
-- ============================================================
