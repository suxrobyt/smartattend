-- ============================================================
-- SmartAttend update-3  —  yangi o'quvchilar ro'yxati (29 ta)
-- Supabase -> SQL Editor'da BIR MARTA ishga tushiring (qayta ishga tushirsa ham xavfsiz).
--
-- Nima qiladi:
--  * ismlardagi xatolarni to'g'rilaydi (Parxadova, Shukurullaev, Nasirulla, Egambergenova)
--  * ro'yxatda yo'q 3 ta o'quvchini o'chiradi (Shukrullaeva Madinabonu, Urazbaeva Aynura, Yusupova Yulduz)
--  * 2 ta yangisini qo'shadi (Tairov Muxiddin, Nurjanova Shaxlo)
--  * loginlarni qayta hisoblaydi: Ism-9.26 (Charos: CharosB-9.26, CharosU-9.26)
-- Qolgan o'quvchilarning parollari va davomati o'zgarmaydi.
-- ============================================================

drop table if exists new_list;
create temp table new_list (n int, full_name text, k text);

insert into new_list (n, full_name) values
  (1,  'Alimboeva Sevinch Mamatsali qizi'),
  (2,  'Baxtiyorova Xonzoda Otabek qizi'),
  (3,  'Bazarbaeva Charos Axmad qizi'),
  (4,  'Bazarboeva Shoxida Madatboy qizi'),
  (5,  'Egambergenova Madina Quralboy qizi'),
  (6,  'Karimbaeva Farangiz Akbarali qizi'),
  (7,  'Karimboyev Bunyodbek O''ktam o''g''li'),
  (8,  'Komilova Shabnam Saparbay qizi'),
  (9,  'Kuanishbaeva Gulmira Qanat qizi'),
  (10, 'Kurbanbaev Abdurahmon Nasirulla o''g''li'),
  (11, 'Kurbonboev G''ayratjon Azamat o''g''li'),
  (12, 'Norqulova Hadichabibi Rahimovna'),
  (13, 'Otaxanova Gulnoza Otabek qizi'),
  (14, 'Parxadova Muhayyo Kutlimurat qizi'),
  (15, 'Qurbanboeva Mahliyo Maxmud qizi'),
  (16, 'Ro''zumboeva Diana Mansur qizi'),
  (17, 'Seitova Shoxista Ikrom qizi'),
  (18, 'Shukurullaev Diyorbek Davronbek o''g''li'),
  (19, 'Soburov Suxrob Ulug''bek o''g''li'),
  (20, 'Tairov Zoirjon Davronbek o''g''li'),
  (21, 'Tairov Muxiddin Xamid o''g''li'),
  (22, 'Tajiboeva Ra''no Anvarbek qizi'),
  (23, 'To''liboev Doniyor Shuxrat o''g''li'),
  (24, 'Umirbekova Charos Jalil qizi'),
  (25, 'Urgenchbaev Berik Rashid o''g''li'),
  (26, 'Xabibullaeva Jasmina Xayriddin qizi'),
  (27, 'Yuldasheva Maftuna Otabek qizi'),
  (28, 'Yusupboeva Xosiyat Yunus qizi'),
  (29, 'Nurjanova Shaxlo Zaripbay qizi');

-- Moslash kaliti: ismning 2-so'zi + familiyaning 1-harfi (imlo xatosi bo'lsa ham topiladi)
update new_list
set k = lower(split_part(btrim(full_name), ' ', 2)) || lower(left(btrim(full_name), 1));

-- 1) Mavjud o'quvchilarning ismini to'g'rilash
update students s
set full_name = l.full_name, updated_at = now()
from new_list l, groups g
where g.code = '9-26'
  and s.group_id = g.id
  and l.k = lower(split_part(btrim(s.full_name), ' ', 2)) || lower(left(btrim(s.full_name), 1))
  and s.full_name is distinct from l.full_name;

-- 2) Ro'yxatda yo'q o'quvchilarni o'chirish (davomat yozuvlari ham o'chadi)
drop table if exists gone_users;
create temp table gone_users as
select s.user_id
from students s
join groups g on g.id = s.group_id and g.code = '9-26'
where s.user_id is not null
  and not exists (
    select 1 from new_list l
    where l.k = lower(split_part(btrim(s.full_name), ' ', 2)) || lower(left(btrim(s.full_name), 1))
  );

delete from students s
using groups g
where g.code = '9-26'
  and s.group_id = g.id
  and not exists (
    select 1 from new_list l
    where l.k = lower(split_part(btrim(s.full_name), ' ', 2)) || lower(left(btrim(s.full_name), 1))
  );

delete from auth.users where id in (select user_id from gone_users);
drop table gone_users;

-- 3) Yangi o'quvchilarni qo'shish (akkaunt keyin: Sozlamalar -> Parollar orqali)
insert into students (group_id, username, email, full_name, status)
select
  (select id from groups where code = '9-26'),
  'student_' || lower(replace(split_part(l.full_name, ' ', 1), '''', '')) || '_' || lower(replace(split_part(l.full_name, ' ', 2), '''', '')),
  'student_' || lower(replace(split_part(l.full_name, ' ', 1), '''', '')) || '_' || lower(replace(split_part(l.full_name, ' ', 2), '''', '')) || '@smartattend.local',
  l.full_name,
  'active'
from new_list l
where not exists (
  select 1 from students s
  join groups g on g.id = s.group_id and g.code = '9-26'
  where lower(split_part(btrim(s.full_name), ' ', 2)) || lower(left(btrim(s.full_name), 1)) = l.k
)
on conflict do nothing;

-- 4) Loginlarni qayta hisoblash: Ism-9.26 (bir xil ism bo'lsa familiya bosh harfi bilan)
with base as (
  select s.id, s.full_name,
         coalesce(nullif(split_part(btrim(s.full_name), ' ', 2), ''),
                  split_part(btrim(s.full_name), ' ', 1)) as first_name
  from students s
  join groups g on g.id = s.group_id and g.code = '9-26'
), counted as (
  select b.*, count(*) over (partition by lower(b.first_name)) as dup
  from base b
)
update students s
set username = c.first_name
               || case when c.dup > 1 then upper(left(btrim(s.full_name), 1)) else '' end
               || '-9.26'
from counted c
where c.id = s.id
  and s.username is distinct from
      (c.first_name || case when c.dup > 1 then upper(left(btrim(s.full_name), 1)) else '' end || '-9.26');

drop table new_list;

-- 5) Natija: 29 ta qator bo'lishi kerak
select row_number() over (order by s.full_name) as n, s.username, s.full_name,
       case when s.user_id is null then 'akkaunt yo''q' else 'akkaunt bor' end as akkaunt
from students s
join groups g on g.id = s.group_id and g.code = '9-26'
order by s.full_name;
