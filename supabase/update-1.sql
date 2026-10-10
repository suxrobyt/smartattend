-- ============================================================
-- SmartAttend update-1
-- Run ONCE in Supabase -> SQL Editor (safe to run again).
-- Does: real subjects, new logins (Ism-9.26), chat, RLS fixes.
-- ============================================================

-- 1) Helper: which group does the signed-in user belong to
create or replace function public.my_group_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select group_id from (
    select group_id from students where user_id = auth.uid()
    union all
    select group_id from teachers where user_id = auth.uid()
  ) x
  limit 1;
$$;
grant execute on function public.my_group_id() to authenticated;

-- 2) Login lookup: ignores case, apostrophes, dash variants
create or replace function public.norm_login(p text)
returns text
language sql immutable
as $$
  select lower(
    replace(
      regexp_replace(
        regexp_replace(btrim(coalesce(p, '')), '[''‘’ʻʼ`´]', '', 'g'),
        '[‐‑‒–—−]', '-', 'g'),
      ',', '.')
  );
$$;

create or replace function public.email_for_username(p_username text)
returns text
language sql stable security definer
set search_path = public
as $$
  select u.email from (
    select email, username from students
    union all
    select email, username from teachers
  ) u
  where public.norm_login(u.username) = public.norm_login(p_username)
  limit 1;
$$;
revoke all on function public.email_for_username(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- 3) New logins
-- Teacher: Shaxsod-9.26
update teachers
set username = 'Shaxsod-9.26', full_name = 'Isakov Shaxzod'
where email = 'teacher_demo@smartattend.local';

-- Students: Ism-9.26 (second word of the full name). If two students share
-- a first name, the surname's first letter is added: CharosB-9.26, CharosU-9.26
with base as (
  select id, full_name,
         coalesce(nullif(split_part(btrim(full_name), ' ', 2), ''),
                  split_part(btrim(full_name), ' ', 1)) as first_name
  from students
), counted as (
  select b.*, count(*) over (partition by lower(b.first_name)) as dup
  from base b
)
update students s
set username = c.first_name
               || case when c.dup > 1 then upper(left(btrim(s.full_name), 1)) else '' end
               || '-9.26'
from counted c
where c.id = s.id;

-- 4) Real subjects (remove the fake ones)
delete from attendance_sessions
where subject in ('Mathematics', 'Physics', 'English', 'Programming', 'Database');

delete from subjects
where group_id = (select id from groups where code = '9-26');

insert into subjects (group_id, name)
select (select id from groups where code = '9-26'), n
from unnest(array[
  'Kasbiy faoliyatga kirish, mehnat muhofazasi va professional etika',
  'Ingliz tili',
  'Kompyuter arxitekturasi va operatsion tizimlar',
  'Fizika va astronomiya',
  'Informatika va axborot texnologiyalari',
  'Rus tili va adabiyoti',
  'Kompyuter tarmoqlari asoslari',
  'Tarix',
  'Algoritmlar va dasturlash asoslari',
  'Ona tili va adabiyoti',
  'Tarbiya',
  'Jismoniy tarbiya',
  'Chaqiruvga qadar boshlang''ich tayyorgarlik'
]) as n;

-- 5) Triggers/functions must bypass RLS (teachers cannot update students directly)
create or replace function update_student_attendance_percentage()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  update students
  set attendance_percentage = (
    select case
      when count(*) = 0 then 0
      else round(
        (count(*) filter (where status = 'present' or status = 'late')) * 100.0 / count(*),
        2)
    end
    from attendance_records
    where student_id = new.student_id
  )
  where id = new.student_id;
  return new;
end;
$$;

create or replace function log_audit_event(
  p_action varchar, p_entity_type varchar, p_entity_id uuid, p_changes jsonb
)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  insert into audit_logs (user_id, action, entity_type, entity_id, changes)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_changes);
end;
$$;

-- recompute percentages after the cleanup above
update students s
set attendance_percentage = coalesce((
  select round(100.0 * count(*) filter (where r.status in ('present', 'late')) / nullif(count(*), 0), 2)
  from attendance_records r where r.student_id = s.id
), 0);

-- 6) Students may read all lessons of their group (history shows subject names)
drop policy if exists "Students can read sessions in their group" on attendance_sessions;
create policy "Students can read sessions in their group"
  on attendance_sessions for select
  using (group_id = public.my_group_id());

-- 7) Chat
create or replace function public.chat_people()
returns table (user_id uuid, full_name text, role text, username text)
language sql stable security definer
set search_path = public
as $$
  select s.user_id, s.full_name::text, 'student'::text, s.username::text
  from students s
  where s.user_id is not null and s.group_id = public.my_group_id()
  union all
  select t.user_id, t.full_name::text, 'teacher'::text, t.username::text
  from teachers t
  where t.user_id is not null and t.group_id = public.my_group_id();
$$;
grant execute on function public.chat_people() to authenticated;

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_group_created on chat_messages (group_id, created_at desc);
create index if not exists idx_chat_recipient on chat_messages (recipient_id, created_at desc);
create index if not exists idx_chat_sender on chat_messages (sender_id, created_at desc);

alter table chat_messages enable row level security;

drop policy if exists chat_select on chat_messages;
create policy chat_select on chat_messages for select to authenticated
using (
  group_id = public.my_group_id()
  and (recipient_id is null or sender_id = auth.uid() or recipient_id = auth.uid())
);

drop policy if exists chat_insert on chat_messages;
create policy chat_insert on chat_messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and group_id = public.my_group_id()
  and (recipient_id is null
       or exists (select 1 from public.chat_people() p where p.user_id = recipient_id))
);

grant select, insert on chat_messages to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.chat_messages;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- 8) Check
select username, full_name from teachers
union all
select username, full_name from students
order by 1;
