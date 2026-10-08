-- Run in Supabase SQL Editor AFTER schema.sql and AFTER creating the two demo users
-- (Authentication -> Users -> Add user, tick "Auto Confirm User").

-- 1) Login helper: lets the login page turn a username into an email
--    without opening the students/teachers tables to the public.
create or replace function public.email_for_username(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select email from students where username = p_username
  union all
  select email from teachers where username = p_username
  limit 1;
$$;
revoke all on function public.email_for_username(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;

-- 2) Give the demo teacher account its role and profile row
update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"teacher"}'::jsonb
where email = 'teacher_demo@smartattend.local';

insert into teachers (user_id, group_id, username, email, full_name)
select u.id, g.id, 'teacher_demo', 'teacher_demo@smartattend.local', 'Demo Teacher'
from auth.users u cross join groups g
where u.email = 'teacher_demo@smartattend.local' and g.code = '9-26'
on conflict (username) do nothing;

-- 3) Link every student who has an Auth user (matched by email) and set role
update auth.users u
set raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb) || '{"role":"student"}'::jsonb
where u.email in (select email from students);

update students s
set user_id = u.id
from auth.users u
where u.email = s.email and s.user_id is null;
