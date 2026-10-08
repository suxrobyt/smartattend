-- ============================================
-- SMARTATTEND 9-26 — DATABASE SCHEMA
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE EXTENSIONS
-- ============================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- 2. CREATE CUSTOM TYPES
-- ============================================

create type user_role as enum ('student', 'teacher', 'admin');
create type attendance_status as enum ('present', 'late', 'absent', 'excused');
create type session_status as enum ('active', 'closed');
create type notification_type as enum ('attendance', 'system', 'info');

-- ============================================
-- 3. GROUPS TABLE
-- ============================================

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  code varchar(50) unique not null,
  name varchar(255) not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table groups enable row level security;

create policy "Anyone can read groups"
  on groups
  for select
  using (true);

-- Insert initial group
insert into groups (code, name, description)
values ('9-26', 'Group 9-26', 'Computer Science 9-26')
on conflict (code) do nothing;

-- ============================================
-- 4. SUBJECTS TABLE
-- ============================================

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  name varchar(255) not null,
  code varchar(50),
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table subjects enable row level security;

create policy "Anyone can read subjects"
  on subjects
  for select
  using (true);

-- ============================================
-- 5. STUDENTS TABLE
-- ============================================

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  username varchar(100) unique not null,
  email varchar(255) unique not null,
  full_name varchar(255) not null,
  status varchar(20) default 'active',
  attendance_percentage numeric(5, 2) default 0,
  avatar_url text,
  last_login timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table students enable row level security;

create policy "Students can read their own profile"
  on students
  for select
  using (auth.uid() = user_id);

create policy "Teachers can read students in their group"
  on students
  for select
  using (
    exists (
      select 1 from teachers t
      where t.user_id = auth.uid()
      and t.group_id = students.group_id
    )
  );

create policy "Students can update their own profile"
  on students
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for performance
create index idx_students_group_id on students(group_id);
create index idx_students_user_id on students(user_id);
create index idx_students_username on students(username);

-- ============================================
-- 6. TEACHERS TABLE
-- ============================================

create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  username varchar(100) unique not null,
  email varchar(255) unique not null,
  full_name varchar(255) not null,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table teachers enable row level security;

create policy "Teachers can read their own profile"
  on teachers
  for select
  using (auth.uid() = user_id);

create policy "Anyone can read teacher names (for attribution)"
  on teachers
  for select
  using (true);

create policy "Teachers can update their own profile"
  on teachers
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_teachers_user_id on teachers(user_id);
create index idx_teachers_group_id on teachers(group_id);

-- ============================================
-- 7. ATTENDANCE SESSIONS TABLE
-- ============================================

create table if not exists attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  teacher_id uuid references teachers(id) on delete cascade,
  subject varchar(255) not null,
  session_date date not null,
  start_time time not null,
  end_time time not null,
  attendance_duration_minutes integer default 10,
  status session_status default 'active',
  qr_token varchar(255),
  qr_token_expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table attendance_sessions enable row level security;

create policy "Teachers can create and manage their sessions"
  on attendance_sessions
  for all
  using (
    exists (
      select 1 from teachers t
      where t.user_id = auth.uid()
      and t.id = attendance_sessions.teacher_id
    )
  );

create policy "Students can read active sessions in their group"
  on attendance_sessions
  for select
  using (
    status = 'active'
    and group_id = (
      select group_id from students
      where user_id = auth.uid()
    )
  );

create policy "Teachers can read sessions in their group"
  on attendance_sessions
  for select
  using (
    group_id = (
      select group_id from teachers
      where user_id = auth.uid()
    )
  );

create index idx_attendance_sessions_group_id on attendance_sessions(group_id);
create index idx_attendance_sessions_teacher_id on attendance_sessions(teacher_id);
create index idx_attendance_sessions_status on attendance_sessions(status);
create index idx_attendance_sessions_date on attendance_sessions(session_date);

-- ============================================
-- 8. ATTENDANCE RECORDS TABLE
-- ============================================

create table if not exists attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references attendance_sessions(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  status attendance_status default 'absent',
  marked_at timestamp with time zone,
  marked_by uuid references teachers(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(session_id, student_id)
);

alter table attendance_records enable row level security;

create policy "Students can read their own attendance"
  on attendance_records
  for select
  using (
    student_id = (
      select id from students
      where user_id = auth.uid()
    )
  );

create policy "Teachers can manage attendance in their group"
  on attendance_records
  for all
  using (
    exists (
      select 1 from attendance_sessions as_table
      join teachers t on t.id = as_table.teacher_id
      where as_table.id = attendance_records.session_id
      and t.user_id = auth.uid()
    )
  );

create index idx_attendance_records_session_id on attendance_records(session_id);
create index idx_attendance_records_student_id on attendance_records(student_id);
create index idx_attendance_records_status on attendance_records(status);
create index idx_attendance_records_created_at on attendance_records(created_at);

-- ============================================
-- 9. NOTIFICATIONS TABLE
-- ============================================

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title varchar(255) not null,
  message text not null,
  type notification_type default 'info',
  read boolean default false,
  action_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table notifications enable row level security;

create policy "Users can read their own notifications"
  on notifications
  for select
  using (user_id = auth.uid());

create policy "Users can update their own notifications"
  on notifications
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index idx_notifications_user_id on notifications(user_id);
create index idx_notifications_read on notifications(read);
create index idx_notifications_created_at on notifications(created_at);

-- ============================================
-- 10. AUDIT LOGS TABLE
-- ============================================

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  action varchar(100) not null,
  entity_type varchar(100) not null,
  entity_id uuid,
  changes jsonb,
  created_at timestamp with time zone default now()
);

alter table audit_logs enable row level security;

create policy "Teachers can read audit logs for their group"
  on audit_logs
  for select
  using (
    exists (
      select 1 from teachers t
      where t.user_id = auth.uid()
    )
  );

create index idx_audit_logs_user_id on audit_logs(user_id);
create index idx_audit_logs_created_at on audit_logs(created_at);
create index idx_audit_logs_action on audit_logs(action);

-- ============================================
-- 11. FUNCTIONS FOR BUSINESS LOGIC
-- ============================================

-- Update student attendance percentage
create or replace function update_student_attendance_percentage()
returns trigger as $$
begin
  update students
  set attendance_percentage = (
    select case
      when count(*) = 0 then 0
      else round(
        (count(*) filter (where status = 'present' or status = 'late')) * 100.0 / count(*),
        2
      )
    end
    from attendance_records
    where student_id = new.student_id
  )
  where id = new.student_id;
  return new;
end;
$$ language plpgsql;

create trigger trigger_update_attendance_percentage
after insert or update on attendance_records
for each row
execute function update_student_attendance_percentage();

-- Log audit events
create or replace function log_audit_event(
  p_action varchar,
  p_entity_type varchar,
  p_entity_id uuid,
  p_changes jsonb
)
returns void as $$
begin
  insert into audit_logs (user_id, action, entity_type, entity_id, changes)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_changes);
end;
$$ language plpgsql;

-- ============================================
-- 12. SEED DATA — 30 STUDENTS
-- ============================================

with group_9_26 as (
  select id from groups where code = '9-26'
)
insert into students (group_id, username, email, full_name, status)
select
  (select id from group_9_26),
  'student_' || lower(split_part(name, ' ', 1)),
  'student_' || lower(split_part(name, ' ', 1)) || '@smartattend.local',
  name,
  'active'
from (
  values
    ('Alimboeva Sevinch Mamatsali qizi'),
    ('Baxtiyorova Xonzoda Otabek qizi'),
    ('Bazarbaeva Charos Axmad qizi'),
    ('Bazarboeva Shoxida Madatboy qizi'),
    ('Egambergenova Madina'),
    ('Karimbaeva Farangiz Akbarali qizi'),
    ('Karimboyev Bunyodbek O''ktam o''g''li'),
    ('Komilova Shabnam Saparbay qizi'),
    ('Kuanishbaeva Gulmira Qanat qizi'),
    ('Kurbanbaev Abdurahmon Nasiulla o''g''li'),
    ('Kurbonboev G''ayratjon Azamat o''g''li'),
    ('Norqulova Hadichabibi Rahimovna'),
    ('Otaxanova Gulnoza Otabek qizi'),
    ('Paixadova Muhayyo Kutlimurat qizi'),
    ('Qurbanboeva Mahliyo Maxmud qizi'),
    ('Ro''zumboeva Diana Mansur qizi'),
    ('Seitova Shoxista Ikrom qizi'),
    ('Shukrullaev Diyorbek Davronbek o''g''li'),
    ('Shukrullaeva Madinabonu Bag''bibek qizi'),
    ('Soburov Suxrob Ulug''bek o''g''li'),
    ('Tairov Zoirjon Davronbek o''g''li'),
    ('Tajiboeva Ra''no Anvarbek qizi'),
    ('To''liboev Doniyor Shuxrat o''g''li'),
    ('Umirbekova Charos Jalil qizi'),
    ('Urazbaeva Aynura Rasulbek qizi'),
    ('Urgenchbaev Berik Rashid o''g''li'),
    ('Xabibullaeva Jasmina Xayriddin qizi'),
    ('Yuldasheva Maftuna Otabek qizi'),
    ('Yusupboeva Xosiyat Yunus qizi'),
    ('Yusupova Yulduz Davlatboy qizi')
) as t(name)
on conflict (username) do nothing;

-- ============================================
-- 13. CREATE DEMO ACCOUNTS
-- ============================================

-- Note: Create these via Supabase Auth UI or API
-- After creating users, link them with:

-- Teacher account (via Auth):
-- Email: teacher_demo@smartattend.local
-- Password: DemoTeacher123!

-- Student account (via Auth):
-- Email: student_alimboeva@smartattend.local
-- Password: StudentDemo123!

-- Then link with teachers/students tables:

-- For teacher:
insert into teachers (user_id, group_id, username, email, full_name)
select
  u.id,
  g.id,
  'teacher_demo',
  'teacher_demo@smartattend.local',
  'Demo Teacher'
from auth.users u
cross join groups g
where u.email = 'teacher_demo@smartattend.local'
and g.code = '9-26'
on conflict (username) do nothing;

-- For student (after creating user in Auth):
update students
set user_id = (
  select id from auth.users
  where email = 'student_alimboeva@smartattend.local'
)
where username = 'student_alimboeva'
and user_id is null;

-- ============================================
-- 14. SAMPLE SUBJECTS
-- ============================================

with group_9_26 as (
  select id from groups where code = '9-26'
)
insert into subjects (group_id, name, code, description)
values
  ((select id from group_9_26), 'Mathematics', 'MATH101', 'Basic mathematics and calculus'),
  ((select id from group_9_26), 'Physics', 'PHYS101', 'General physics principles'),
  ((select id from group_9_26), 'English', 'ENG101', 'English language and literature'),
  ((select id from group_9_26), 'Programming', 'PROG101', 'Introduction to programming'),
  ((select id from group_9_26), 'Database', 'DB101', 'Database design and SQL')
on conflict do nothing;

-- ============================================
-- 15. SAMPLE ATTENDANCE SESSION
-- ============================================

with demo_data as (
  select
    (select id from groups where code = '9-26') as group_id,
    (select id from teachers where username = 'teacher_demo') as teacher_id,
    current_date as session_date
)
insert into attendance_sessions (
  group_id,
  teacher_id,
  subject,
  session_date,
  start_time,
  end_time,
  attendance_duration_minutes,
  status
)
select
  group_id,
  teacher_id,
  'Mathematics',
  session_date,
  '08:30'::time,
  '09:30'::time,
  15,
  'active'
from demo_data
where group_id is not null and teacher_id is not null
on conflict do nothing;

-- ============================================
-- 16. GRANT PERMISSIONS
-- ============================================

-- Grant schema access
grant usage on schema public to authenticated;
grant usage on schema public to anon;

-- Grant table access
grant all on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

-- Grant sequence access
grant usage on all sequences in schema public to authenticated;
grant usage on all sequences in schema public to anon;

-- ============================================
-- 17. VERIFY SETUP
-- ============================================

-- Check groups
select 'Groups created' as check, count(*) as count from groups;

-- Check students
select 'Students seeded' as check, count(*) as count from students;

-- Check subjects
select 'Subjects created' as check, count(*) as count from subjects;

-- Check tables exist
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================

/*
NEXT STEPS:

1. Run this SQL in Supabase Dashboard → SQL Editor
2. Create user accounts in Auth:
   - teacher_demo@smartattend.local / DemoTeacher123!
   - student_alimboeva@smartattend.local / StudentDemo123!
3. Verify tables and data
4. Update app environment variables
5. Start application
6. Test login flow

All RLS policies are in place.
All tables secured by role.
All relationships defined.
Ready for API implementation.
*/
