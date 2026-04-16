-- Run this in Supabase SQL Editor
-- Purpose: shared master prompts managed by admins

create extension if not exists pgcrypto;

create table if not exists public.master_prompts (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    prompt_content text not null,
    category text not null default 'Custom Prompt',
    icon text not null default 'terminal',
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);

alter table public.master_prompts enable row level security;

drop policy if exists "Authenticated users can read prompts" on public.master_prompts;
create policy "Authenticated users can read prompts"
on public.master_prompts
for select
using (auth.role() = 'authenticated');

drop policy if exists "Admins can insert prompts" on public.master_prompts;
create policy "Admins can insert prompts"
on public.master_prompts
for insert
with check (
    exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'admin'
    )
);

drop policy if exists "Admins can update prompts" on public.master_prompts;
create policy "Admins can update prompts"
on public.master_prompts
for update
using (
    exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'admin'
    )
)
with check (
    exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'admin'
    )
);

drop policy if exists "Admins can delete prompts" on public.master_prompts;
create policy "Admins can delete prompts"
on public.master_prompts
for delete
using (
    exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'admin'
    )
);
