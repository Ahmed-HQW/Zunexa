-- Run once in Supabase SQL editor. Tokens are encrypted by the Edge Function; browsers can NEVER read this table.
create table if not exists public.user_integrations (
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  refresh_token_enc text not null,
  scopes text[] not null default '{}',
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);
alter table public.user_integrations enable row level security;
revoke all on public.user_integrations from anon, authenticated;

create table if not exists public.zx_action_log (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);
create index if not exists zx_action_log_user_time on public.zx_action_log (user_id, action, created_at desc);
alter table public.zx_action_log enable row level security;
revoke all on public.zx_action_log from anon, authenticated;

create or replace function public.zx_google_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select jsonb_build_object('connected', true, 'email', email, 'scopes', scopes)
       from public.user_integrations where user_id = auth.uid() and provider = 'google'),
    jsonb_build_object('connected', false));
$$;
revoke all on function public.zx_google_status() from public, anon;
grant execute on function public.zx_google_status() to authenticated;
