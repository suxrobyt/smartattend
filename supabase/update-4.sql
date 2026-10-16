-- ============================================================
-- SmartAttend update-4  —  fan o'qituvchilari (7 ta) + fan bo'yicha cheklov
-- Supabase -> SQL Editor'da BIR MARTA ishga tushiring (qayta ishga tushirsa ham xavfsiz).
--
-- Nima qiladi:
--  * teachers jadvaliga `subjects` (o'qituvchining fanlari) va `is_head` (bosh o'qituvchi) ustunlarini qo'shadi
--  * 6 ta yangi o'qituvchi qatorini yaratadi (akkaunt/parol alohida bajariladi, parollar bu faylda YO'Q)
--  * RLS: o'qituvchi faqat O'Z fanidagi darslarni yarata/o'zgartira/o'chira oladi va faqat shu darslarning
--    davomatini ko'radi/belgilaydi
--  * o'qituvchi o'z qatorida faqat ism/rasmni o'zgartira oladi (fanlarini emas)
--  * eski darslarni fan egasiga ko'chiradi
--  * o'qituvchi logini bilan to'qnashgan o'quvchi logiga familiya harfini qo'shadi (Shaxlo -> ShaxloN)
-- ============================================================

-- 1) Ustunlar
alter table teachers add column if not exists subjects text[] not null default '{}';
alter table teachers add column if not exists is_head boolean not null default false;

-- 2) Bosh o'qituvchi: Isakov Shaxzod (mavjud qator)
update teachers
set is_head = true,
    subjects = array[
      'Kasbiy faoliyatga kirish, mehnat muhofazasi va professional etika',
      'Kompyuter arxitekturasi va operatsion tizimlar',
      'Kompyuter tarmoqlari asoslari',
      'Algoritmlar va dasturlash asoslari',
      'Informatika va axborot texnologiyalari'
    ]
where email = 'teacher_demo@smartattend.local';

-- 3) Yangi fan o'qituvchilari (akkaunti keyin bog'lanadi)
insert into teachers (group_id, username, email, full_name, subjects, is_head)
select g.id, v.username, v.email, v.full_name, v.subjects, false
from groups g,
     (values
       ('Komila-9.26',   'teacher_komila@smartattend.local',   'Abdullayeva Komila', array['Ingliz tili']),
       ('Vali-9.26',     'teacher_vali@smartattend.local',     'Yakubov Vali',       array['Fizika va astronomiya']),
       ('Mardon-9.26',   'teacher_mardon@smartattend.local',   'Kurbanbayev Mardon', array['Rus tili va adabiyoti']),
       ('Farrux-9.26',   'teacher_farrux@smartattend.local',   'Sultonov Farrux',    array['Tarix']),
       ('Shaxlo-9.26',   'teacher_shaxlo@smartattend.local',   'Uskinova Shaxlo',    array['Ona tili va adabiyoti']),
       ('Muqaddas-9.26', 'teacher_muqaddas@smartattend.local', 'Tazabayeva Muqaddas', array['Tarbiya'])
     ) as v(username, email, full_name, subjects)
where g.code = '9-26'
on conflict (email) do update
  set username = excluded.username,
      full_name = excluded.full_name,
      subjects = excluded.subjects;

-- 4) O'qituvchi o'z qatorida faqat ism va rasmni o'zgartira oladi
--    (aks holda u o'z fanlarini ko'paytirib, cheklovni chetlab o'tardi)
revoke update on public.teachers from authenticated, anon;
grant update (full_name, avatar_url) on public.teachers to authenticated;

-- 5) Darslar: o'qituvchi faqat o'z fanidagi o'z darslarini boshqaradi
drop policy if exists "Teachers can create and manage their sessions" on attendance_sessions;
drop policy if exists "Teachers manage own-subject sessions" on attendance_sessions;
create policy "Teachers manage own-subject sessions"
  on attendance_sessions
  for all
  using (
    exists (
      select 1 from teachers t
      where t.user_id = auth.uid()
        and t.id = attendance_sessions.teacher_id
        and attendance_sessions.subject = any (t.subjects)
    )
  )
  with check (
    exists (
      select 1 from teachers t
      where t.user_id = auth.uid()
        and t.id = attendance_sessions.teacher_id
        and attendance_sessions.subject = any (t.subjects)
    )
  );

-- 6) Davomat yozuvlari: faqat o'z fanidagi o'z darslari uchun
drop policy if exists "Teachers can manage attendance in their group" on attendance_records;
drop policy if exists "Teachers manage attendance of own-subject sessions" on attendance_records;
create policy "Teachers manage attendance of own-subject sessions"
  on attendance_records
  for all
  using (
    exists (
      select 1
      from attendance_sessions s
      join teachers t on t.id = s.teacher_id
      where s.id = attendance_records.session_id
        and t.user_id = auth.uid()
        and s.subject = any (t.subjects)
    )
  )
  with check (
    exists (
      select 1
      from attendance_sessions s
      join teachers t on t.id = s.teacher_id
      where s.id = attendance_records.session_id
        and t.user_id = auth.uid()
        and s.subject = any (t.subjects)
    )
  );

-- 7) Eski darslar (bitta o'qituvchi hamma fandan belgilagan paytdagi) -> fan egasiga
update attendance_sessions s
set teacher_id = t.id
from teachers t
where s.subject = any (t.subjects)
  and s.teacher_id is distinct from t.id;

-- 8) O'quvchi logini o'qituvchi logi bilan to'qnashsa: familiya bosh harfi qo'shiladi
update students s
set username = regexp_replace(s.username, '-9\.26$', '') || upper(left(btrim(s.full_name), 1)) || '-9.26'
where exists (
  select 1 from teachers t
  where public.norm_login(t.username) = public.norm_login(s.username)
);

-- 9) Natija
select t.username, t.full_name, t.is_head, t.subjects, (t.user_id is not null) as akkaunt_bor
from teachers t
order by t.is_head desc, t.full_name;
