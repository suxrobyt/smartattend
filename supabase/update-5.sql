-- ============================================================
-- SmartAttend update-5  —  yangi guruh 9K 7-26 (32 o'quvchi) + kurator Komila
-- Supabase -> SQL Editor'da BIR MARTA ishga tushiring (qayta ishga tushirsa ham xavfsiz).
-- Oldin update-4 bajarilgan bo'lishi kerak.
--
-- Nima qiladi:
--  * teachers jadvaliga `all_subjects` ustunini qo'shadi (kurator: guruhning HAMMA fanidan davomat qiladi)
--  * yangi guruh `7-26` ni yaratadi
--  * 32 ta o'quvchini qo'shadi, login: Ism-7.26 (bir xil ismlar: MuxammadjonK-7.26, RavshanbekKa-7.26 ...)
--    (akkaunt/parolni kurator Sozlamalar -> Parollar orqali yaratadi)
--  * kurator qatori: Abdullayeva Komila (login Komila-7.26), bosh o'qituvchi + hamma fan
--    (akkaunt/parol alohida bajariladi, parol bu faylda YO'Q)
--  * RLS'ni yangilaydi: kurator hamma fanni belgilaydi; o'qituvchi faqat O'Z GURUHINING
--    darslari va o'quvchilari bilan ishlay oladi
-- ============================================================

-- 1) Kurator ustuni
alter table teachers add column if not exists all_subjects boolean not null default false;

-- 2) Guruh
insert into groups (code, name, description)
values ('7-26', 'Group 7-26', 'Chorvachilik fermasi operatori (30810706) 9K 7-26')
on conflict (code) do nothing;

-- 3) O'quvchilar (32 ta). Allaqachon bor bo'lsa, qayta qo'shilmaydi.
insert into students (group_id, username, email, full_name, status)
select g.id,
       v.username,
       'student_' || lower(replace(split_part(v.full_name, ' ', 1), '''', ''))
         || '_' || lower(replace(split_part(v.full_name, ' ', 2), '''', '')) || '_726@smartattend.local',
       v.full_name,
       'active'
from groups g,
     (values
  ( 1, 'Bunyodbek-7.26', 'Alimbayev Bunyodbek Atabek o''g''li'),
  ( 2, 'Og''abek-7.26', 'Atajanov Og''abek Oybek o''g''li'),
  ( 3, 'Xamdam-7.26', 'Davletbayev Xamdam San''at o''g''li'),
  ( 4, 'Sayfiddin-7.26', 'Fayzullayev Sayfiddin Ro''zimboy o''g''li'),
  ( 5, 'MuxammadjonK-7.26', 'Karimboyev Muxammadjon Muzaffar o''g''li'),
  ( 6, 'Baxtibek-7.26', 'Xajiboyev Baxtibek Xurshidjon o''g''li'),
  ( 7, 'Sardorbek-7.26', 'Xajiboyev Sardorbek Baxtiyor o''g''li'),
  ( 8, 'MuxammadjonX-7.26', 'Xaytboyev Muxammadjon Abdulla o''g''li'),
  ( 9, 'Xasanboy-7.26', 'Aknazarov Xasanboy Shuxrat o''g''li'),
  (10, 'Xusanboy-7.26', 'Aknazarov Xusanboy Shuxrat o''g''li'),
  (11, 'Ma''rufjon-7.26', 'Arapbaev Ma''rufjon Murodjon o''g''li'),
  (12, 'Sanjar-7.26', 'Baltaboev Sanjar Xamdam o''g''li'),
  (13, 'Akrom-7.26', 'Baxromov Akrom Qudrat o''g''li'),
  (14, 'Mirsaid-7.26', 'Boltaboev Mirsaid Alisher o''g''li'),
  (15, 'Ma''murjon-7.26', 'Gulumbaev Ma''murjon Abror o''g''li'),
  (16, 'Bexruz-7.26', 'Durdibaev Bexruz Jemal o''g''li'),
  (17, 'Bunyod-7.26', 'Jumabaev Bunyod Azamat o''g''li'),
  (18, 'Akromjon-7.26', 'Jumaboev Akromjon Baxromjon o''g''li'),
  (19, 'Ilhombek-7.26', 'Ibodullaev Ilhombek Fozilbek o''g''li'),
  (20, 'RavshanbekKa-7.26', 'Kamilov Ravshanbek Atanazar o''g''li'),
  (21, 'Mirjalol-7.26', 'Komilov Mirjalol Ilxom o''g''li'),
  (22, 'Mexriddin-7.26', 'Kurbanbaev Mexriddin Shermat o''g''li'),
  (23, 'RavshanbekKu-7.26', 'Kurbanbaev Ravshanbek Nurxan o''g''li'),
  (24, 'Ibrohimbek-7.26', 'Kuchkarov Ibrohimbek Odilbek o''g''li'),
  (25, 'Amirxon-7.26', 'Qo''ziboev Amirxon Muzaffar o''g''li'),
  (26, 'Asadbek-7.26', 'Qo''shimov Asadbek Zokir o''g''li'),
  (27, 'Diyorbek-7.26', 'Mammatsadikov Diyorbek Abror o''g''li'),
  (28, 'Shoxrux-7.26', 'Matibaev Shoxrux Oybek o''g''li'),
  (29, 'Javohir-7.26', 'Masharipov Javohir Ilxom o''g''li'),
  (30, 'Xursanbek-7.26', 'Sheripboev Xursanbek Ulug''bek o''g''li'),
  (31, 'Dostonbek-7.26', 'Quchqorov Dostonbek Rustam o''g''li'),
  (32, 'Jaxongir-7.26', 'Allambergenov Jaxongir G''ulomjon o''g''li')
     ) as v(n, username, full_name)
where g.code = '7-26'
  and not exists (select 1 from students s where s.group_id = g.id and s.full_name = v.full_name)
  and not exists (select 1 from students s where public.norm_login(s.username) = public.norm_login(v.username));

-- 4) Kurator: Abdullayeva Komila (7-26) — bosh o'qituvchi (o'quvchilar parollarini o'zgartiradi) + hamma fan
insert into teachers (group_id, username, email, full_name, subjects, is_head, all_subjects)
select g.id, 'Komila-7.26', 'teacher_komila_726@smartattend.local', 'Abdullayeva Komila', '{}', true, true
from groups g
where g.code = '7-26'
on conflict (email) do update
  set group_id = excluded.group_id,
      username = excluded.username,
      full_name = excluded.full_name,
      is_head = true,
      all_subjects = true;

-- 5) RLS — darslar: o'z fanidagi (yoki kurator bo'lsa hamma fandagi) va O'Z GURUHIDAGI darslar
drop policy if exists "Teachers manage own-subject sessions" on attendance_sessions;
create policy "Teachers manage own-subject sessions"
  on attendance_sessions
  for all
  using (
    exists (
      select 1 from teachers t
      where t.user_id = auth.uid()
        and t.id = attendance_sessions.teacher_id
        and (t.all_subjects or attendance_sessions.subject = any (t.subjects))
        and coalesce(attendance_sessions.group_id = t.group_id, true)
    )
  )
  with check (
    exists (
      select 1 from teachers t
      where t.user_id = auth.uid()
        and t.id = attendance_sessions.teacher_id
        and (t.all_subjects or attendance_sessions.subject = any (t.subjects))
        and coalesce(attendance_sessions.group_id = t.group_id, true)
    )
  );

-- 6) RLS — davomat yozuvlari: shu darslar uchun, faqat o'z guruhining o'quvchilariga
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
        and (t.all_subjects or s.subject = any (t.subjects))
    )
  )
  with check (
    exists (
      select 1
      from attendance_sessions s
      join teachers t on t.id = s.teacher_id
      where s.id = attendance_records.session_id
        and t.user_id = auth.uid()
        and (t.all_subjects or s.subject = any (t.subjects))
        and exists (
          select 1 from students st
          where st.id = attendance_records.student_id
            and st.group_id = t.group_id
        )
    )
  );

-- 7) Natija: 7-26 da 32 ta o'quvchi bo'lishi kerak
select row_number() over (order by s.full_name) as n, s.username as login, s.full_name,
       case when s.user_id is null then 'akkaunt yo''q' else 'akkaunt bor' end as akkaunt
from students s
join groups g on g.id = s.group_id and g.code = '7-26'
order by s.full_name;
