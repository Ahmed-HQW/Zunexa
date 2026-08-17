-- ============================================================
-- Zunexa — نظام Redeem Code حقيقي (جدول + دالة آمنة)
-- شغلها من بعد db_schema.sql
-- ============================================================

create table if not exists public.redeem_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  plan text not null
    check (plan in ('pro','max','standard','premium')),
  billing_cycle text default 'monthly'
    check (billing_cycle in ('monthly','yearly')),
  duration_days integer not null default 30,
  max_uses integer not null default 1,
  used_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.redeem_codes enable row level security;
-- ماكاينش أي policy select/insert للـ anon أو authenticated —
-- هاد الجدول كيتقرا وكيتبدل غير عبر الدالة redeem_plan_code (security definer)
-- أو من dashboard ديالك بحال admin (service_role).

-- ------------------------------------------------------------
-- الدالة: redeem_plan_code(code_input)
-- كتخدم بصلاحيات المالك (security definer) باش تقدر تقرا/تبدل
-- redeem_codes بلا ما تعطي المستخدم صلاحية مباشرة على الجدول.
-- كتعمل validation كامل: الكود كاين؟ فعال؟ ماشي مستهلك بزاف؟ ماشي منتهي؟
-- ------------------------------------------------------------
create or replace function public.redeem_plan_code(code_input text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code record;
  v_uid uuid := auth.uid();
  v_new_expiry timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  select * into v_code
  from public.redeem_codes
  where code = code_input
  for update; -- قفل الصف باش نمنعو race condition (نفس الكود يستعمل جوج مرات فنفس الوقت)

  if not found then
    return jsonb_build_object('success', false, 'error', 'code_not_found');
  end if;

  if not v_code.is_active then
    return jsonb_build_object('success', false, 'error', 'code_inactive');
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    return jsonb_build_object('success', false, 'error', 'code_expired');
  end if;

  if v_code.used_count >= v_code.max_uses then
    return jsonb_build_object('success', false, 'error', 'code_exhausted');
  end if;

  v_new_expiry := now() + (v_code.duration_days || ' days')::interval;

  -- ترقية الحساب فعلياً
  insert into public.user_plan (user_id, plan, billing_cycle, status, redeemed_code, expires_at)
  values (v_uid, v_code.plan, v_code.billing_cycle, 'active', code_input, v_new_expiry)
  on conflict (user_id) do update
    set plan = excluded.plan,
        billing_cycle = excluded.billing_cycle,
        status = 'active',
        redeemed_code = excluded.redeemed_code,
        expires_at = excluded.expires_at,
        updated_at = now();

  -- تسجيل الاستهلاك
  update public.redeem_codes
  set used_count = used_count + 1,
      is_active = case when used_count + 1 >= max_uses then false else is_active end
  where id = v_code.id;

  return jsonb_build_object(
    'success', true,
    'plan', v_code.plan,
    'billing_cycle', v_code.billing_cycle,
    'expires_at', v_new_expiry
  );
end;
$$;

-- السماح لأي مستخدم authenticated يستدعي الدالة (الدالة فيها validation كاملة)
grant execute on function public.redeem_plan_code(text) to authenticated;
revoke execute on function public.redeem_plan_code(text) from anon;

-- ------------------------------------------------------------
-- مثال: كيفاش تزيد كود جديد يدوياً من SQL Editor (service_role):
-- insert into public.redeem_codes (code, plan, billing_cycle, duration_days, max_uses)
-- values ('ZUNEXA-PRO-XYZ123', 'pro', 'monthly', 30, 1);
-- ------------------------------------------------------------
