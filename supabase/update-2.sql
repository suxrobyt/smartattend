-- update-2: davomat belgisini qaytarib olish (o'chirish) bo'lganda foiz ham to'g'ri yangilansin.
-- Bir marta ishga tushiring. Xavfsiz: qayta ishga tushirsa ham zarar yo'q.

create or replace function update_student_attendance_percentage()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  sid uuid;
begin
  sid := case when tg_op = 'DELETE' then old.student_id else new.student_id end;
  update students
  set attendance_percentage = (
    select case
      when count(*) = 0 then 0
      else round(
        (count(*) filter (where status = 'present' or status = 'late')) * 100.0 / count(*),
        2)
    end
    from attendance_records
    where student_id = sid
  )
  where id = sid;
  return null;
end;
$$;

drop trigger if exists trigger_update_attendance_percentage on attendance_records;
create trigger trigger_update_attendance_percentage
after insert or update or delete on attendance_records
for each row
execute function update_student_attendance_percentage();

-- Hozirgi foizlarni qayta hisoblash
update students s
set attendance_percentage = coalesce((
  select round((count(*) filter (where r.status in ('present','late'))) * 100.0 / nullif(count(*), 0), 2)
  from attendance_records r
  where r.student_id = s.id
), 0);

select 'ok' as natija;
