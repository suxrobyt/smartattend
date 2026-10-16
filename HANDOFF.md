# SmartAttend — loyiha topshiriq xati (yangi chat uchun)

Bu fayl repo ildizida turadi (GitHub: suxrobyt/smartattend -> HANDOFF.md). Yangi chatga shu faylni (yoki butun smartattend.zip ni) yuklab, "Shu loyihani davom ettir" deb yozing.

**Claude uchun qoida:** har safar kodni o'zgartirib yangi ZIP berganingda, shu faylni ham yangilab ZIP ichiga qo'sh (qilingan ishlar, ochiq masalalar, SQL holati).

## Foydalanuvchi haqida
- O'zbek tilida gaplashadi (javoblar O'zbekcha, sodda, qisqa bo'lsin).
- Faqat TELEFONdan ishlaydi: terminal/kompyuter yo'q. Hamma narsa qadamma-qadam, oddiy tilda tushuntirilsin.
- Kollej talabasi (IT yo'nalishi), guruh 9K 9-26. O'qituvchi: Isakov Shaxzod.
- Kodni GitHub Codespaces orqali yuklaydi: ZIP ni yuklab, shu buyruq bilan:
  `unzip -o smartattend.zip && rm smartattend.zip && git add -A && git commit -m "yangilanish" && git push`
  (ZIP repo ildizida ochiladi, ichida "smartattend/" papka YO'Q.)
- Maxfiylik: `SUPABASE_SERVICE_ROLE_KEY` faqat Vercel Environment Variables'da turadi, hech qachon chatga yozilmaydi.

## Loyiha
Davomat veb-sayti. Next.js 14 (App Router) + TypeScript + Tailwind 3, Supabase (Auth, RLS, Realtime), Vercel (GitHub repo `suxrobyt/smartattend`, sayt `...phi.vercel.app`), Supabase loyihasi "SmartAttend-9-26".

Rollar: `user_metadata.role` = teacher | student; `middleware.ts` yo'naltiradi.

### Loginlar
- O'qituvchilar (7 ta, har biri o'z logini bilan; parollar REPOGA YOZILMAGAN — foydalanuvchi bergan, faqat Supabase'ga SQL orqali kiritilgan, o'qituvchi o'zi almashtira oladi): Isakov Shaxzod `Shaxsod-9.26` (bosh o'qituvchi, `is_head`), Abdullayeva Komila `Komila-9.26` (Ingliz tili), Yakubov Vali `Vali-9.26` (Fizika va astronomiya), Kurbanbayev Mardon `Mardon-9.26` (Rus tili va adabiyoti), Sultonov Farrux `Farrux-9.26` (Tarix), Uskinova Shaxlo `Shaxlo-9.26` (Ona tili va adabiyoti), Tazabayeva Muqaddas `Muqaddas-9.26` (Tarbiya). Isakov fanlari: Kasbiy faoliyatga kirish..., Kompyuter arxitekturasi va OT, Kompyuter tarmoqlari asoslari, Algoritmlar va dasturlash asoslari, Informatika va AT. Jismoniy tarbiya (Quliyeva O'g'iljon) va Chaqiruvga qadar boshlang'ich tayyorgarlik (Ametov Xudayshukur) uchun akkaunt YO'Q (hech kim belgilay olmaydi) — foydalanuvchidan so'rash kerak.
- O'quvchi logini o'qituvchi logi bilan to'qnashsa, o'quvchiga familiya bosh harfi qo'shiladi: o'quvchi Nurjanova Shaxlo -> `ShaxloN-9.26` (o'qituvchi Shaxlo esa `Shaxlo-9.26`).
- O'quvchilar:  `Ism-9.26` (ism = to'liq ismning 2-so'zi; bir xil ism bo'lsa familiya bosh harfi: `CharosB-9.26`, `CharosU-9.26`).
- Kirish: RPC `email_for_username` (normallashtirilgan) -> `signInWithPassword`. Auth emaillari eski (`student_xxx@smartattend.local`, `teacher_demo@smartattend.local`), faqat `students.username`/`teachers.username` o'zgargan.
- Kirish sahifasida login misoli va format maslahati YO'Q; login maydonida neytral "Loginingizni kiriting". Pastda "Yordam kerak bo'lsa, o'qituvchingizga murojaat qiling:" + havola "Yordam so'rash" (Telegram belgisi bilan) -> https://t.me/Isakovshaxzodbek (z yoki s bilan yozilishi foydalanuvchidan hali tasdiqlanmagan).
- Logotip: foydalanuvchi o'zi tayyorlagan rasm (15-oktabr): to'q ko'k yumaloq kvadrat, ko'k "S" lenta + kollej shlyapasi + galochka, ostida "SmartAttend / Davomatni nazorat qiling". Rasm tozalandi (atrofidagi shovqinli nur olib tashlandi). Fayllar: `public/logo-full.png` (to'liq, kirish sahifasida), `public/icon-192.png` va `icon-512.png` (faqat belgi: tepadagi sarlavha, favicon, manifest). `components/Logo.tsx`: `<Logo size={32}/>` = belgi, `<Logo full size={176}/>` = to'liq. Eski SVG logotip (`icon.svg`) o'chirilgan. Asl rasm repoda yo'q — kerak bo'lsa foydalanuvchidan so'rang. Yordam havolasi: "Yordam so'rang" + Telegram belgisi, yordam gapining tagida.

### Funksiyalar (hammasi tayyor)
- FAN BO'YICHA CHEKLOV (16-oktabr, `supabase/update-4.sql` + `lib/teacher.ts`): `teachers.subjects text[]`, `teachers.is_head boolean`. Har bir o'qituvchi faqat O'Z fanlaridan davomat qiladi: bosh sahifa, davomat, tarix, hisobotlar faqat o'z fanlarini ko'rsatadi (`mySubjects(row)`; `null` = eski baza = cheklovsiz). RLS ham shuni majburlaydi (darslar va yozuvlar: `subject = any(teachers.subjects)`), o'qituvchi o'z `subjects/is_head` ustunlarini o'zgartira olmaydi (column-level GRANT: faqat full_name, avatar_url). To'liq jadval (Jadval) hammaga ko'rinadi. Eski darslar fan egasiga ko'chirilgan.
- Parollar: faqat BOSH o'qituvchi (Isakov) o'quvchilar parolini boshqaradi (`isHead(row)`, `/api/students/reset-password` ham tekshiradi); fan o'qituvchilari faqat o'z parolini almashtiradi (Sozlamalar -> Parolni almashtirish).
- O'quvchi bosh sahifasida familiya + ism ko'rinadi (`shortName`, masalan "Soburov Suxrob").
- 4 til (O'zbek/English/Русский/Türkçe): `lib/i18n.ts` (lug'at `D`, kalit -> [uz,en,ru,tr]), cookie `sa_lang`, `components/LanguageProvider.tsx`.
- Davomat qoidalari: dars bazaga FAQAT birinchi o'quvchi belgilanganda yoziladi (`lib/sessions.ts`: `dropEmpty` bo'sh eski darslarni o'chiradi, `pickLast` bosh sahifadagi "Oxirgi dars"ni jadval bo'yicha eng kechki paradan tanlaydi). Belgilanmagan o'quvchi avtomatik "Kelmadi" BO'LMAYDI (yozuv yaratilmaydi). Dars tarixida faqat belgilangan darslar chiqadi, bo'sh bo'lsa "Hozircha yo'q".
- Jadvalda "Haftalar almashadi"/"Boshqa hafta" yozuvlari ko'rsatilmaydi (almashish mantig'i ishlayveradi). Informatika: Isakov Shaxzod (seshanba 2-para va juma 1-para), Rus tili: Kurbanbayev Mardon.
- Para vaqtlari: 1-para 09:00–10:20, 10 daq tanaffus, 2-para 10:30–11:50, 10 daq tanaffus, 3-para 12:00–13:20 (`PAIR_TIMES`, `pairState`). Bosh sahifadagi dars holati soatga qarab: Kutilmoqda / Davom etmoqda / Davomat olingan / Yakunlanmagan / Davomat olinmagan (o'quvchida: holat yoki Belgilanmagan).
- Dars jadvali `lib/schedule.ts` (3 para/kun; seshanba 1-para va shanba 3-para har hafta almashadi; 2026-08-31 haftasi = A (tepadagi), juft haftalar A, toq B; bu hafta ikkalasida ham PASTDAGI fan). Tarix (Chorshanba II va Juma III): Sultonov Farrux (`SULTONOV` konstantasi). O'qituvchi ismlari rasmdan o'qilgan, imlo xatosi bo'lishi mumkin. Haqiqiy 13 ta fan.
- O'qituvchi: bosh sahifa, davomat belgilash (4 holat; belgini qayta bosib bekor qilish; "Belgilarni tozalash"; yakunlangan darsni "qayta ochish"; Tarixdan ham qayta ochish `/teacher/attendance?open=<id>`), o'quvchilar, tarix, hisobot (+CSV), jadval, chat, sozlamalar.
- O'quvchi: bosh sahifa (foiz yozuvlardan hisoblanadi), tarix, jadval, chat, sozlamalar.
- Sozlamalar: Parollarni almashtirish (o'qituvchi: o'zinikini va o'quvchilarniki, `/api/students/reset-password`, akkaunti yo'q o'quvchiga akkaunt yaratadi), Til, oxirida Chiqish. Chiqishdan oldin tasdiq oynasi (`LogoutDialog`). Parol maydonlarida ko'z tugmasi.
- Chat: guruh chati + shaxsiy chat (`chat_messages`, `chat_people()`, `my_group_id()`, polling 6s + realtime). Faqat akkaunti bor o'quvchilar ro'yxatda.
- Tezlik: `lib/swr.ts` (useQuery, clearCache), `components/MeProvider.tsx` (profil + o'quvchilar bir marta yuklanadi), sahifalar eski ma'lumotni darhol ko'rsatib orqada yangilaydi.
- Dizayn: qorong'i mavzu, `tailwind.config.js` tokenlari, `app/globals.css` (.card .field .btn-primary ...), `components/AppShell.tsx` (tepada sarlavha, pastda 5 ta tugma).

### SQL (Supabase SQL Editor'da bir martadan)
- `supabase/schema.sql` — asosiy jadvallar (bajarilgan).
- `supabase/update-1.sql` — loginlar, haqiqiy fanlar, chat, RLS (foydalanuvchi ishga tushirgan deb hisoblanadi).
- `supabase/update-2.sql` — belgi o'chirilganda foiz triggeri (ishga tushirilganini foydalanuvchidan so'rang).
- `supabase/update-3.sql` — (15-oktabr): guruhning 29 talik yangi ro'yxati (xlsx: "9-26-guruh ro'yxati"). Ismlarni to'g'rilaydi (Parxadova, Shukurullaev, Nasirulla, Egambergenova), ro'yxatda yo'q 3 ta o'quvchini (Shukrullaeva Madinabonu, Urazbaeva Aynura, Yusupova Yulduz) davomati va akkaunti bilan o'chiradi, 2 ta yangisini qo'shadi (Tairov Muxiddin -> `Muxiddin-9.26`, Nurjanova Shaxlo -> `Shaxlo-9.26`; akkauntlari yo'q, o'qituvchi Sozlamalar -> Parollar orqali yaratadi) va loginlarni qayta hisoblaydi. Mahalliy Postgres'da sinalgan (29 qator, ikkinchi marta ishga tushirish xavfsiz). FOYDALANUVCHI ISHGA TUSHIRDI: 29 qator chiqdi.
- `supabase/update-4.sql` — YANGI (16-oktabr): ustunlar, 6 ta o'qituvchi qatori, fan bo'yicha RLS, eski darslarni ko'chirish, login to'qnashuvini hal qilish. Parollar BU FAYLDA YO'Q. Foydalanuvchiga esa chatda alohida `update-4-supabase.sql` berilgan = shu fayl + akkaunt yaratish bloki (auth.users + auth.identities ga bcrypt bilan; parol oxiridagi `!` belgisi parolning bir qismi deb olingan — foydalanuvchi yozuvida boshqa tinish belgilari yo'qligi sababli). Bu blok GitHub'ga yuklanmaydi (repo ochiq). Mahalliy Postgres'da sinalgan (RLS har bir o'qituvchi uchun, ikki marta ishga tushirish), lekin haqiqiy Supabase GoTrue'da kirish sinalmagan: agar o'qituvchi kira olmasa, Supabase -> Authentication -> Users'da shu emailga (`teacher_komila@smartattend.local` va h.k.) qo'lda parol bilan foydalanuvchi qo'shib, SQL ni qayta ishga tushirish kifoya (u `teachers.user_id` ni bog'laydi).
- O'quvchilar ro'yxati (29): Alimboeva Sevinch, Baxtiyorova Xonzoda, Bazarbaeva Charos, Bazarboeva Shoxida, Egambergenova Madina, Karimbaeva Farangiz, Karimboyev Bunyodbek, Komilova Shabnam, Kuanishbaeva Gulmira, Kurbanbaev Abdurahmon, Kurbonboev G'ayratjon, Norqulova Hadichabibi, Otaxanova Gulnoza, Parxadova Muhayyo, Qurbanboeva Mahliyo, Ro'zumboeva Diana, Seitova Shoxista, Shukurullaev Diyorbek, Soburov Suxrob, Tairov Zoirjon, Tairov Muxiddin, Tajiboeva Ra'no, To'liboev Doniyor, Umirbekova Charos, Urgenchbaev Berik, Xabibullaeva Jasmina, Yuldasheva Maftuna, Yusupboeva Xosiyat, Nurjanova Shaxlo.

## Muhit bo'yicha eslatmalar
- Sandbox'da npm reestri bloklangan: `npm install`/`next build` ishlamaydi. Tekshiruv uchun: global `tsc` + stub `d.ts`, va global `react-dom/server` bilan smoke-render ishlatilgan. next.config.js: ignoreBuildErrors/ignoreDuringBuilds = true.
- Kod jonli Supabase'da sinab ko'rilmagan; Vercel build/ishga tushishdagi xatolar foydalanuvchi skrinshoti orqali keladi.
- Papkada 12-oktabrda boshqa seans kiritgan fayllar bor (swr.ts, MeProvider) — ular saqlangan va hozirgi kodga moslangan.

## Ochiq masalalar / foydalanuvchidan so'rash mumkin
- Foydalanuvchi bergan parollar oxiridagi `!` parolning bir qismi deb olingan. Kirish bo'lmasa, `!` siz variantni so'rang/sinang (parollar chatda, repoda emas).
- Jismoniy tarbiya va Chaqiruvga qadar tayyorgarlik o'qituvchilariga akkaunt kerakmi?
- O'quvchilar jadvalidagi `attendance_percentage` ustunini o'quvchi o'zi o'zgartira oladi (eski RLS: "Students can update their own profile") — keyinroq column-level GRANT bilan yopish mumkin.
- O'qituvchi ismi loginda "Shaxsod", ekranda "Isakov Shaxzod" — bir xil qilish kerakmi?
- Seshanba 1-para uchun ham bu hafta "pastdagi" fan deb olingan (shanba bilan bir xil). Aksincha bo'lsa o'zgartirish kerak.
- O'qituvchilar ismlari imlosini tekshirish.
- Til har qurilmada alohida saqlanadi (cookie).
