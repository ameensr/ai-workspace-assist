-- Run this in Supabase SQL Editor
create table if not exists public.user_test_suites (
    user_id uuid primary key references auth.users(id) on delete cascade,
    test_cases jsonb not null default '[]'::jsonb,
    updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_user_test_suites_updated_at on public.user_test_suites;
create trigger trg_user_test_suites_updated_at
before update on public.user_test_suites
for each row execute procedure public.set_updated_at();

alter table public.user_test_suites enable row level security;

drop policy if exists "Users can view own suite" on public.user_test_suites;
create policy "Users can view own suite"
on public.user_test_suites
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own suite" on public.user_test_suites;
create policy "Users can insert own suite"
on public.user_test_suites
for insert
with check (auth.uid() = user_id);

create table if not exists public.user_settings (
    user_id uuid primary key references auth.users(id) on delete cascade,
    provider text not null default 'auto',
    api_key text,
    theme text not null default 'light',
    updated_at timestamptz not null default now()
);

create table if not exists public.usage_logs (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null,
    tokens integer not null default 0,
    module text not null default 'generic',
    request_type text not null default 'generic',
    timestamp timestamptz not null default now()
);

drop trigger if exists trg_user_settings_updated_at on public.user_settings;
create trigger trg_user_settings_updated_at
before update on public.user_settings
for each row execute procedure public.set_updated_at();

alter table public.user_settings enable row level security;
alter table public.usage_logs enable row level security;

drop policy if exists "Users can view own settings" on public.user_settings;
create policy "Users can view own settings"
on public.user_settings
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
on public.user_settings
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own usage logs" on public.usage_logs;
create policy "Users can view own usage logs"
on public.usage_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own usage logs" on public.usage_logs;
create policy "Users can insert own usage logs"
on public.usage_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own suite" on public.user_test_suites;
create policy "Users can update own suite"
on public.user_test_suites
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
