-- Run this in Supabase SQL Editor
-- Purpose: shared master prompts managed by admins

create extension if not exists pgcrypto;

create table if not exists public.master_prompts (
    id uuid primary key default gen_random_uuid(),
    module_key text not null default 'custom',
    title text not null,
    prompt_content text not null,
    role text not null default '',
    task text not null default '',
    constraints jsonb not null default '[]'::jsonb,
    output_format jsonb not null default '[]'::jsonb,
    style text not null default 'concise' check (style in ('minimal', 'concise', 'detailed')),
    status text not null default 'active' check (status in ('active', 'inactive')),
    version integer not null default 1,
    category text not null default 'Custom Prompt',
    icon text not null default 'terminal',
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now()
);

alter table public.master_prompts
    add column if not exists module_key text not null default 'custom',
    add column if not exists role text not null default '',
    add column if not exists task text not null default '',
    add column if not exists constraints jsonb not null default '[]'::jsonb,
    add column if not exists output_format jsonb not null default '[]'::jsonb,
    add column if not exists style text not null default 'concise',
    add column if not exists status text not null default 'active',
    add column if not exists version integer not null default 1,
    add column if not exists updated_by uuid references auth.users(id) on delete set null,
    add column if not exists updated_at timestamptz not null default now();

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'master_prompts_style_check'
    ) then
        alter table public.master_prompts
        add constraint master_prompts_style_check
        check (style in ('minimal', 'concise', 'detailed'));
    end if;
end $$;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'master_prompts_status_check'
    ) then
        alter table public.master_prompts
        add constraint master_prompts_status_check
        check (status in ('active', 'inactive'));
    end if;
end $$;

-- Keep only one active config per module_key before enforcing uniqueness.
with ranked_active as (
    select
        id,
        row_number() over (
            partition by module_key
            order by updated_at desc, created_at desc, id desc
        ) as rn
    from public.master_prompts
    where status = 'active'
)
update public.master_prompts mp
set status = 'inactive',
    updated_at = now()
from ranked_active ra
where mp.id = ra.id
  and ra.rn > 1;

drop index if exists public.master_prompts_module_key_active_idx;
create unique index if not exists master_prompts_module_key_active_idx
on public.master_prompts(module_key)
where status = 'active';

create table if not exists public.master_prompt_versions (
    id uuid primary key default gen_random_uuid(),
    prompt_id uuid not null references public.master_prompts(id) on delete cascade,
    version integer not null,
    snapshot jsonb not null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists public.prompt_library (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    prompt_text text not null,
    tags text[] not null default '{}'::text[],
    is_active boolean not null default true,
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists master_prompt_versions_prompt_idx
on public.master_prompt_versions(prompt_id, version desc);

create index if not exists prompt_library_active_idx
on public.prompt_library(is_active, updated_at desc);

create or replace function public.bump_master_prompt_version()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'UPDATE' then
        insert into public.master_prompt_versions (prompt_id, version, snapshot, updated_by)
        values (
            old.id,
            old.version,
            to_jsonb(old),
            auth.uid()
        );

        new.version := old.version + 1;
        new.updated_at := now();
    elsif tg_op = 'INSERT' then
        new.updated_at := now();
    end if;
    return new;
end;
$$;

drop trigger if exists trg_master_prompts_version on public.master_prompts;
create trigger trg_master_prompts_version
before insert or update on public.master_prompts
for each row execute function public.bump_master_prompt_version();

alter table public.master_prompts enable row level security;
alter table public.prompt_library enable row level security;

drop policy if exists "Authenticated users can read prompts" on public.master_prompts;
create policy "Authenticated users can read prompts"
on public.master_prompts
for select
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can read prompt versions" on public.master_prompt_versions;
create policy "Authenticated users can read prompt versions"
on public.master_prompt_versions
for select
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can read prompt library" on public.prompt_library;
create policy "Authenticated users can read prompt library"
on public.prompt_library
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

drop policy if exists "Admins can insert prompt versions" on public.master_prompt_versions;
create policy "Admins can insert prompt versions"
on public.master_prompt_versions
for insert
with check (
    exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'admin'
    )
);

drop policy if exists "Admins can insert prompt library" on public.prompt_library;
create policy "Admins can insert prompt library"
on public.prompt_library
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

drop policy if exists "Admins can update prompt versions" on public.master_prompt_versions;
create policy "Admins can update prompt versions"
on public.master_prompt_versions
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

drop policy if exists "Admins can update prompt library" on public.prompt_library;
create policy "Admins can update prompt library"
on public.prompt_library
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

drop policy if exists "Admins can delete prompt versions" on public.master_prompt_versions;
create policy "Admins can delete prompt versions"
on public.master_prompt_versions
for delete
using (
    exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'admin'
    )
);

drop policy if exists "Admins can delete prompt library" on public.prompt_library;
create policy "Admins can delete prompt library"
on public.prompt_library
for delete
using (
    exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'admin'
    )
);

alter table public.master_prompt_versions enable row level security;
