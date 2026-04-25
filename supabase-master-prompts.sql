-- Run this in Supabase SQL Editor
-- Purpose: simple module prompt lifecycle.
-- Flow: DRAFT -> APPROVED -> ACTIVE. Deactivate returns ACTIVE -> APPROVED.

create extension if not exists pgcrypto;

-- =========================================================
-- MASTER PROMPTS: one prompt per module, no versioning
-- =========================================================

create table if not exists public.master_prompts (
    id uuid primary key default gen_random_uuid(),
    module_key text not null,
    title text not null,
    prompt_content text not null,
    role text not null default '',
    task text not null default '',
    constraints jsonb not null default '[]'::jsonb,
    output_format jsonb not null default '[]'::jsonb,
    style text not null default 'concise',
    status text not null default 'DRAFT',
    category text not null default 'Custom Prompt',
    icon text not null default 'terminal',
    created_by uuid references auth.users(id) on delete set null,
    updated_by uuid references auth.users(id) on delete set null,
    released_by uuid references auth.users(id) on delete set null,
    activated_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    released_at timestamptz,
    activated_at timestamptz
);

alter table public.master_prompts
    add column if not exists module_key text not null default 'custom',
    add column if not exists title text not null default 'Untitled Prompt',
    add column if not exists prompt_content text not null default '',
    add column if not exists role text not null default '',
    add column if not exists task text not null default '',
    add column if not exists constraints jsonb not null default '[]'::jsonb,
    add column if not exists output_format jsonb not null default '[]'::jsonb,
    add column if not exists style text not null default 'concise',
    add column if not exists status text not null default 'DRAFT',
    add column if not exists category text not null default 'Custom Prompt',
    add column if not exists icon text not null default 'terminal',
    add column if not exists created_by uuid references auth.users(id) on delete set null,
    add column if not exists updated_by uuid references auth.users(id) on delete set null,
    add column if not exists released_by uuid references auth.users(id) on delete set null,
    add column if not exists activated_by uuid references auth.users(id) on delete set null,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists updated_at timestamptz not null default now(),
    add column if not exists released_at timestamptz,
    add column if not exists activated_at timestamptz;

-- Remove older versioning objects if they exist.
drop trigger if exists trg_master_prompts_version on public.master_prompts;
drop function if exists public.bump_master_prompt_version();
drop table if exists public.master_prompt_versions cascade;
drop index if exists public.master_prompts_module_key_version_idx;
alter table public.master_prompts
drop column if exists version;

alter table public.master_prompts
drop constraint if exists master_prompts_status_check;

update public.master_prompts
set status = case
    when upper(status) = 'ACTIVE' then 'ACTIVE'
    when upper(status) in ('APPROVED', 'RELEASED', 'INACTIVE') then 'APPROVED'
    else 'DRAFT'
end;

alter table public.master_prompts
alter column status set default 'DRAFT';

alter table public.master_prompts
add constraint master_prompts_status_check
check (status in ('DRAFT', 'APPROVED', 'ACTIVE'));

alter table public.master_prompts
drop constraint if exists master_prompts_style_check;

alter table public.master_prompts
add constraint master_prompts_style_check
check (style in ('minimal', 'concise', 'detailed'));

-- Keep one prompt row per module before adding uniqueness.
with ranked_prompts as (
    select
        id,
        row_number() over (
            partition by module_key
            order by updated_at desc, created_at desc, id desc
        ) as rn
    from public.master_prompts
)
delete from public.master_prompts mp
using ranked_prompts rp
where mp.id = rp.id
  and rp.rn > 1;

drop index if exists public.master_prompts_module_key_unique_idx;
create unique index if not exists master_prompts_module_key_unique_idx
on public.master_prompts(module_key);

drop index if exists public.master_prompts_module_key_active_idx;
create unique index if not exists master_prompts_module_key_active_idx
on public.master_prompts(module_key)
where status = 'ACTIVE';

-- =========================================================
-- LIFECYCLE AUDIT
-- =========================================================

create table if not exists public.prompt_lifecycle_events (
    id uuid primary key default gen_random_uuid(),
    prompt_id uuid not null references public.master_prompts(id) on delete cascade,
    module_key text not null,
    from_status text,
    to_status text not null,
    actor_id uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);

alter table public.prompt_lifecycle_events
drop constraint if exists prompt_lifecycle_events_to_status_check;

update public.prompt_lifecycle_events
set to_status = case
    when upper(to_status) = 'ACTIVE' then 'ACTIVE'
    when upper(to_status) in ('APPROVED', 'RELEASED', 'INACTIVE') then 'APPROVED'
    else 'DRAFT'
end;

alter table public.prompt_lifecycle_events
add constraint prompt_lifecycle_events_to_status_check
check (to_status in ('DRAFT', 'APPROVED', 'ACTIVE'));

-- =========================================================
-- PROMPT LIBRARY
-- =========================================================

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

create index if not exists prompt_library_active_idx
on public.prompt_library(is_active, updated_at desc);

-- =========================================================
-- HELPERS
-- =========================================================

create or replace function public.is_prompt_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.user_roles ur
        where ur.user_id = auth.uid()
          and ur.role = 'admin'
    );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_master_prompts_updated_at on public.master_prompts;
create trigger trg_master_prompts_updated_at
before update on public.master_prompts
for each row execute function public.set_updated_at();

drop trigger if exists trg_prompt_library_updated_at on public.prompt_library;
create trigger trg_prompt_library_updated_at
before update on public.prompt_library
for each row execute function public.set_updated_at();

-- =========================================================
-- SIMPLE LIFECYCLE RPCS
-- =========================================================

create or replace function public.save_module_prompt_draft(
    p_module_key text,
    p_title text,
    p_prompt_content text
)
returns public.master_prompts
language plpgsql
security definer
set search_path = public
as $$
declare
    saved_prompt public.master_prompts;
begin
    if not public.is_prompt_admin() then
        raise exception 'Only admins can save prompt drafts.';
    end if;

    insert into public.master_prompts (
        module_key,
        title,
        prompt_content,
        status,
        created_by,
        updated_by
    )
    values (
        p_module_key,
        p_title,
        p_prompt_content,
        'DRAFT',
        auth.uid(),
        auth.uid()
    )
    on conflict (module_key)
    do update set
        title = excluded.title,
        prompt_content = excluded.prompt_content,
        status = 'DRAFT',
        updated_by = auth.uid()
    returning * into saved_prompt;

    insert into public.prompt_lifecycle_events (prompt_id, module_key, from_status, to_status, actor_id)
    values (saved_prompt.id, saved_prompt.module_key, null, 'DRAFT', auth.uid());

    return saved_prompt;
end;
$$;

create or replace function public.approve_module_prompt(p_prompt_id uuid)
returns public.master_prompts
language plpgsql
security definer
set search_path = public
as $$
declare
    old_status text;
    saved_prompt public.master_prompts;
begin
    if not public.is_prompt_admin() then
        raise exception 'Only admins can approve prompts.';
    end if;

    select status into old_status
    from public.master_prompts
    where id = p_prompt_id;

    update public.master_prompts
    set status = 'APPROVED',
        released_by = auth.uid(),
        released_at = now(),
        updated_by = auth.uid()
    where id = p_prompt_id
      and status = 'DRAFT'
    returning * into saved_prompt;

    if saved_prompt.id is null then
        raise exception 'Only DRAFT prompts can be approved.';
    end if;

    insert into public.prompt_lifecycle_events (prompt_id, module_key, from_status, to_status, actor_id)
    values (saved_prompt.id, saved_prompt.module_key, old_status, 'APPROVED', auth.uid());

    return saved_prompt;
end;
$$;

create or replace function public.activate_module_prompt(p_prompt_id uuid)
returns public.master_prompts
language plpgsql
security definer
set search_path = public
as $$
declare
    old_status text;
    saved_prompt public.master_prompts;
begin
    if not public.is_prompt_admin() then
        raise exception 'Only admins can activate prompts.';
    end if;

    select status into old_status
    from public.master_prompts
    where id = p_prompt_id;

    update public.master_prompts
    set status = 'ACTIVE',
        activated_by = auth.uid(),
        activated_at = now(),
        updated_by = auth.uid()
    where id = p_prompt_id
      and status = 'APPROVED'
    returning * into saved_prompt;

    if saved_prompt.id is null then
        raise exception 'Only APPROVED prompts can be activated.';
    end if;

    insert into public.prompt_lifecycle_events (prompt_id, module_key, from_status, to_status, actor_id)
    values (saved_prompt.id, saved_prompt.module_key, old_status, 'ACTIVE', auth.uid());

    return saved_prompt;
end;
$$;

create or replace function public.deactivate_module_prompt(p_prompt_id uuid)
returns public.master_prompts
language plpgsql
security definer
set search_path = public
as $$
declare
    old_status text;
    saved_prompt public.master_prompts;
begin
    if not public.is_prompt_admin() then
        raise exception 'Only admins can deactivate prompts.';
    end if;

    select status into old_status
    from public.master_prompts
    where id = p_prompt_id;

    update public.master_prompts
    set status = 'APPROVED',
        updated_by = auth.uid()
    where id = p_prompt_id
      and status = 'ACTIVE'
    returning * into saved_prompt;

    if saved_prompt.id is null then
        raise exception 'Only ACTIVE prompts can be deactivated.';
    end if;

    insert into public.prompt_lifecycle_events (prompt_id, module_key, from_status, to_status, actor_id)
    values (saved_prompt.id, saved_prompt.module_key, old_status, 'APPROVED', auth.uid());

    return saved_prompt;
end;
$$;

grant execute on function public.save_module_prompt_draft(text, text, text) to authenticated;
grant execute on function public.approve_module_prompt(uuid) to authenticated;
grant execute on function public.activate_module_prompt(uuid) to authenticated;
grant execute on function public.deactivate_module_prompt(uuid) to authenticated;

-- Compatibility wrappers for older calls.
create or replace function public.create_prompt_draft(
    p_module_key text,
    p_title text,
    p_prompt_content text
)
returns public.master_prompts
language sql
security definer
set search_path = public
as $$
    select public.save_module_prompt_draft(p_module_key, p_title, p_prompt_content);
$$;

create or replace function public.update_prompt_draft(
    p_prompt_id uuid,
    p_title text,
    p_prompt_content text
)
returns public.master_prompts
language plpgsql
security definer
set search_path = public
as $$
declare
    prompt_module text;
begin
    select module_key into prompt_module
    from public.master_prompts
    where id = p_prompt_id;

    if prompt_module is null then
        raise exception 'Prompt does not exist.';
    end if;

    return public.save_module_prompt_draft(prompt_module, p_title, p_prompt_content);
end;
$$;

create or replace function public.release_prompt(p_prompt_id uuid)
returns public.master_prompts
language sql
security definer
set search_path = public
as $$
    select public.approve_module_prompt(p_prompt_id);
$$;

create or replace function public.activate_prompt(p_prompt_id uuid)
returns public.master_prompts
language sql
security definer
set search_path = public
as $$
    select public.activate_module_prompt(p_prompt_id);
$$;

create or replace function public.deactivate_prompt(p_prompt_id uuid)
returns public.master_prompts
language sql
security definer
set search_path = public
as $$
    select public.deactivate_module_prompt(p_prompt_id);
$$;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.master_prompts enable row level security;
alter table public.prompt_lifecycle_events enable row level security;
alter table public.prompt_library enable row level security;

drop policy if exists "Authenticated users can read prompts" on public.master_prompts;
create policy "Authenticated users can read prompts"
on public.master_prompts
for select
using (auth.role() = 'authenticated');

drop policy if exists "Admins can insert prompts" on public.master_prompts;
create policy "Admins can insert prompts"
on public.master_prompts
for insert
with check (public.is_prompt_admin());

drop policy if exists "Admins can update prompts" on public.master_prompts;
create policy "Admins can update prompts"
on public.master_prompts
for update
using (public.is_prompt_admin())
with check (public.is_prompt_admin());

drop policy if exists "Admins can delete prompts" on public.master_prompts;
create policy "Admins can delete prompts"
on public.master_prompts
for delete
using (public.is_prompt_admin());

drop policy if exists "Authenticated users can read prompt lifecycle" on public.prompt_lifecycle_events;
create policy "Authenticated users can read prompt lifecycle"
on public.prompt_lifecycle_events
for select
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can read prompt library" on public.prompt_library;
create policy "Authenticated users can read prompt library"
on public.prompt_library
for select
using (auth.role() = 'authenticated');

drop policy if exists "Admins can insert prompt library" on public.prompt_library;
create policy "Admins can insert prompt library"
on public.prompt_library
for insert
with check (public.is_prompt_admin());

drop policy if exists "Admins can update prompt library" on public.prompt_library;
create policy "Admins can update prompt library"
on public.prompt_library
for update
using (public.is_prompt_admin())
with check (public.is_prompt_admin());

drop policy if exists "Admins can delete prompt library" on public.prompt_library;
create policy "Admins can delete prompt library"
on public.prompt_library
for delete
using (public.is_prompt_admin());
