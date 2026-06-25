-- ChoicePath Shared Board Lite
-- Goal: share a board with an email address. When a user logs in with that email,
-- the shared board appears as a board choice.

-- 1) Make board_members support email-based sharing.
create table if not exists public.board_members (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'editor',
  created_at timestamptz not null default now()
);

alter table public.board_members
  add column if not exists member_email text;

-- Older ChoicePath setup may have user_id as NOT NULL. Shared Board Lite uses email instead.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'board_members'
      and column_name = 'user_id'
  ) then
    alter table public.board_members alter column user_id drop not null;
  end if;
end $$;

alter table public.board_members
  alter column role set default 'editor';

-- Prevent duplicate email shares on the same board.
create unique index if not exists board_members_board_email_unique
on public.board_members (board_id, lower(member_email))
where member_email is not null;

-- 2) Helper functions avoid recursive RLS policies.
create or replace function public.choicepath_auth_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.choicepath_is_board_owner(p_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boards b
    where b.id = p_board_id
      and b.owner_id = auth.uid()
  );
$$;

create or replace function public.choicepath_can_access_board(p_board_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.boards b
    where b.id = p_board_id
      and b.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.board_members bm
    where bm.board_id = p_board_id
      and lower(bm.member_email) = public.choicepath_auth_email()
  );
$$;

-- 3) Replace existing policies with simple non-recursive policies.
do $$
declare
  pol record;
begin
  for pol in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('boards', 'board_members', 'students')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      pol.policyname,
      pol.schemaname,
      pol.tablename
    );
  end loop;
end $$;

alter table public.boards enable row level security;
alter table public.board_members enable row level security;
alter table public.students enable row level security;

-- Boards: owners and shared-email users can view. Only owners can create/update/delete boards.
create policy "ChoicePath Lite users can view accessible boards"
on public.boards
for select
using (public.choicepath_can_access_board(id));

create policy "ChoicePath Lite users can create own boards"
on public.boards
for insert
with check (owner_id = auth.uid());

create policy "ChoicePath Lite owners can update boards"
on public.boards
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "ChoicePath Lite owners can delete boards"
on public.boards
for delete
using (owner_id = auth.uid());

-- Students: anyone with access to the board can view/edit students.
create policy "ChoicePath Lite users can view students"
on public.students
for select
using (public.choicepath_can_access_board(board_id));

create policy "ChoicePath Lite users can create students"
on public.students
for insert
with check (public.choicepath_can_access_board(board_id));

create policy "ChoicePath Lite users can update students"
on public.students
for update
using (public.choicepath_can_access_board(board_id))
with check (public.choicepath_can_access_board(board_id));

create policy "ChoicePath Lite users can delete students"
on public.students
for delete
using (public.choicepath_can_access_board(board_id));

-- Board members: owners manage sharing; shared users can see their own access row.
create policy "ChoicePath Lite owners and members can view board members"
on public.board_members
for select
using (
  public.choicepath_is_board_owner(board_id)
  or lower(member_email) = public.choicepath_auth_email()
);

create policy "ChoicePath Lite owners can add board members"
on public.board_members
for insert
with check (public.choicepath_is_board_owner(board_id));

create policy "ChoicePath Lite owners can remove board members"
on public.board_members
for delete
using (public.choicepath_is_board_owner(board_id));
