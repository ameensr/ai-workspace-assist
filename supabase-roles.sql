-- Run this in Supabase SQL Editor
-- Purpose: support two user types (admin, user)

create table if not exists public.user_roles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    role text not null default 'user' check (role in ('admin', 'user')),
    created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

drop policy if exists "Users can read own role" on public.user_roles;
create policy "Users can read own role"
on public.user_roles
for select
using (auth.uid() = user_id);

-- Intentionally no insert/update/delete policy for clients.
-- Manage admin assignment from SQL editor:
-- insert into public.user_roles (user_id, role) values ('<USER_UUID>', 'admin')
-- on conflict (user_id) do update set role = excluded.role;
