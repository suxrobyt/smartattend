# SmartAttend — loyiha topshiriq xati (yangi chat uchun)

Bu fayl repo ildizida turadi (GitHub: suxrobyt/smartattend -> HANDOFF.md). Yangi chatga shu faylni (yoki butun smartattend.zip ni) yuklab, "Shu loyihani davom ettir" deb yozing.

**Claude uchun qoida:** har safar kodni o'zgartirib yangi ZIP berganingda, shu faylni ham yangilab ZIP ichiga qo'sh (qilingan ishlar, ochiq masalalar, SQL holati).

## Foydalanuvchi haqida
- O'zbek tilida gaplashadi (javoblar O'zbekcha, sodda, qisqa bo'lsin).
- Faqat TELEFONdan ishlaydi: terminal/kompyuter yo'q. Hamma narsa qadamma-qadam, oddiy tilda tushuntirilsin.
- Kollej talabasi (IT yo'nalishi), guruh 9K 9-26. O'qituvchi: Isakov Shaxzod. 18-oktabrdan ikkinchi guruh ham bor: 9K 7-26 (Chorvachilik fermasi operatori), kuratori Abdullayeva Komila.
- Kodni GitHub Codespaces orqali yuklaydi: ZIP ni yuklab, shu buyruq bilan:
  `unzip -o smartattend.zip && rm smartattend.zip && git add -A && git commit -m "yangilanish" && git push`
  (ZIP repo ildizida ochiladi, ichida "smartattend/" papka YO'Q.)
- Maxfiylik: `SUPABASE_SERVICE_ROLE_KEY` faqat Vercel Environment Variables'da turadi, hech qachon chatga yozilmaydi.

## Loyiha
Davomat veb-sayti. Next.js 14 (App Router) + TypeScript + Tailwind 3, Supabase (Auth, RLS, Realtime), Vercel (GitHub repo `suxrobyt/smartattend`, sayt `...phi.vercel.app`), Supabase loyihasi "SmartAttend-9-26".

Rollar: `user_metadata.role` = teacher | student; `middleware.ts` yo'naltiradi.

### Loginlar
- O'qituvchilar (7 ta, har biri o'z logini bilan; parollar REPOGA YOZILMAGAN — foydalanuvchi bergan, faqat Supabase'ga SQL orqali kiritilgan, o'qituvchi o'zi almashtira oladi): Isakov Shaxzod `Shaxsod-9.26` (bosh o'qituvchi, `is_head`), Abdullayeva Komila `Komila-9.26` (Ingliz tili), Yakubov Vali `Vali-9.26` (Fizika va astronomiya), Kurbanbayev Mardon `Mardon-9.26` (Rus tili va adabiyoti), Sultonov Farrux `Farrux-9.26` (Tarix), Uskinova Shaxlo `Shaxlo-9.26` (Ona tili va adabiyoti), Tazabayeva Muqaddas `Muqaddas-9.26` (Tarbiya). Isakov fanlari: Kasbiy faoliyatga kirish..., Kompyuter arxitekturasi va OT, Kompyuter tarmoqlari asoslari, Algoritmlar va dasturlash asoslari, Informatika va AT. Jismoniy tarbiya o'qituvchisi endi `Diyor` (18-oktabr: foydalanuvchi so'rovi bilan ikkala guruhda ham Quliyeva O'g'iljon o'rniga; familiyasi noma'lum) va Chaqiruvga qadar boshlang'ich tayyorgarlik (Ametov Xudayshukur) uchun akkaunt YO'Q (hech kim belgilay olmaydi; foydalanuvchi 'hozircha kerak emas' dedi).
- O'quvchi logini o'qituvchi logi bilan to'qnashsa, o'quvchiga familiya bosh harfi qo'shiladi: o'quvchi Nurjanova Shaxlo -> `ShaxloN-9.26` (o'qituvchi Shaxlo esa `Shaxlo-9.26`).
- O'quvchilar:  `Ism-9.26` (ism = to'liq ismning 2-so'zi; bir xil ism bo'lsa familiya bosh harfi: `CharosB-9.26`, `CharosU-9.26`).
- Kirish: RPC `email_for_username` (normallashtirilgan) -> `signInWithPassword`. Auth emaillari eski (`student_xxx@smartattend.local`, `teacher_demo@smartattend.local`), faqat `students.username`/`teachers.username` o'zgargan.
- Kirish sahifasida login misoli va format maslahati YO'Q; login maydonida neytral "Loginingizni kiriting". Pastda "Yordam kerak bo'lsa, o'qituvchingizga murojaat qiling:" + havola "Yordam so'rash" (Telegram belgisi bilan) -> https://t.me/Isakovshaxzodbek (z yoki s bilan yozilishi foydalanuvchidan hali tasdiqlanmagan).
- Logotip: foydalanuvchi o'zi tayyorlagan rasm (15-oktabr): to'q ko'k yumaloq kvadrat, ko'k "S" lenta + kollej shlyapasi + galochka, ostida "SmartAttend / Davomatni nazorat qiling". Rasm tozalandi (atrofidagi shovqinli nur olib tashlandi). Fayllar: `public/logo-full.png` (to'liq, kirish sahifasida), `public/icon-192.png` va `icon-512.png` (faqat belgi: tepadagi sarlavha, favicon, manifest). `components/Logo.tsx`: `<Logo size={32}/>` = belgi, `<Logo full size={176}/>` = to'liq. Eski SVG logotip (`icon.svg`) o'chirilgan. Asl rasm repoda yo'q — kerak bo'lsa foydalanuvchidan so'rang. Yordam havolasi: "Yordam so'rang" + Telegram belgisi, yordam gapining tagida.

### Ikkinchi guruh: 9K 7-26 (18-oktabr, `supabase/update-5.sql`)
- Guruh kodi `7-26`, xona `1-B, №202`, yo'nalish: Chorvachilik fermasi operatori (30810706). 32 o'quvchi (qog'oz ro'yxat rasmidan; 5-raqamli Karimboyev Muxammadjon ustiga chizilgan edi, lekin foydalanuvchi QO'SHISH kerak dedi). Loginlar `Ism-7.26`; bir xil ismlar: `MuxammadjonK-7.26`, `MuxammadjonX-7.26`, `RavshanbekKa-7.26`, `RavshanbekKu-7.26`. Akkaunti YO'Q: kurator Sozlamalar -> Parollar orqali har biriga parol qo'yadi (akkaunt shu paytda yaratiladi). Emaillar `student_<familiya>_<ism>_726@smartattend.local`. Ro'yxatdagi ID raqamlari (6 xonali) bazaga yozilmagan.
- Kurator: Abdullayeva Komila, login `Komila-7.26` (parol chatda berilgan, REPOGA YOZILMAGAN; `update-5-supabase.sql` chat-only faylida). `teachers.is_head = true` (o'z guruhi o'quvchilari parolini o'zgartiradi; `/api/students/reset-password` o'qituvchi guruhini o'quvchi guruhi bilan solishtiradi) va `teachers.all_subjects = true` (guruhning HAMMA fanidan davomat qiladi; `mySubjects()` -> `null` = cheklovsiz, `isCurator()`). Bu 9-26 dagi `Komila-9.26` (faqat Ingliz tili) dan ALOHIDA akkaunt/qator.
- Boshqa 7-26 o'qituvchilari (Yakupova Muborak, Jumabayev Raxul, Uskinova Shaxlo, Davletbayev Kanat, Xalimbetova Mahbuba, Tazabayeva Muqaddas, Sultonov Farrux, Diyor, Ametov) uchun akkaunt YO'Q ('hozircha kerak emas').
- RLS (update-5): darslar/yozuvlar `(t.all_subjects or subject = any(t.subjects))` + o'qituvchi faqat O'Z GURUHI darslari va o'quvchilariga yoza oladi. Mahalliy Postgres'da sinalgan (ikki guruh, kurator, Komila-9.26, Isakov, o'quvchi, login qidirish, qayta ishga tushirish). update-4 ning "eski darslarni ko'chirish" bandiga ham guruh sharti qo'shildi.
- Kod guruhga bog'liq: `MeProvider` endi `groupCode` beradi (`groups` jadvalidan; topilmasa `9-26`); `lessonsFor(day, week, groupCode)`, `groupLabel`, `roomOf`, `subjectsOf` (`lib/schedule.ts`). Jadval, davomat, ikkala bosh sahifa va chat sarlavhasi shuni ishlatadi.
- 7-26 jadvali (qog'oz jadvalda ba'zi kunlarda 4 para bor; foydalanuvchi "3 para qo'y" dedi -> faqat birinchi 3 tasi olingan, 4-para tushirilgan: Dushanba Informatika (Vakant), Seshanba 2-chi Ingliz tili, Shanba Rus tili va adabiyoti):
  Du: Tarix (Sultonov Farrux; qog'ozda Vakant edi), Qishloq xo'jalik hayvonlari anatomiyasi va fiziologiyasi (Yakupova), Zoogigiyena va veterinariya asoslari (Yakupova).
  Se: Matematika (Jumabayev Raxul), Ingliz tili (Komila), Ona tili va adabiyoti (Uskinova Shaxlo).
  Ch: 1-para HAFTALAR ALMASHADI: Jismoniy tarbiya (Diyor) / Chaqiruvga qadar boshlang'ich tayyorgarlik (Ametov); Ingliz tili (Komila); Hayvonlarini oziqlantirish (Yakupova).
  Pa: Ingliz tili (Komila), Intensiv va yaylov chorvachiligi (Yakupova), Tarbiya (Tazabayeva Muqaddas).
  Ju: Mo'ynali va po'stloq mahsulotlarini ishlab chiqarishni tashkil etish (Yakupova), Geografiya (Davletbayev Kanat), Intensiv va yaylov chorvachilik ishlari O'/A (o'qituvchisiz, xona `Ustaxona`; ekranda "Vakant" o'rniga xona ko'rsatiladi).
  Sh: Biologiya (Xalimbetova Mahbuba), 2-para HAFTALAR ALMASHADI: Intensiv va yaylov chorvachiligi / Mo'ynali va po'stloq mahsulotlari (ikkalasi Yakupova), Ingliz tili (Komila).
  Almashish tartibi 9-26 bilan bir xil deb olingan (2026-08-31 haftasi = A = tepadagi fan). 7-26 uchun aslida teskari bo'lishi mumkin — foydalanuvchidan so'rash kerak. Shanbadagi 2-paraning 2-qatori qog'ozda qisqartirilgan ("Mo'ynali va po'stloq mahsulot.") — juma 1-para bilan bir xil fan deb olingan.

### Funksiyalar (hammasi tayyor)
- FAN BO'YICHA CHEKLOV (16-oktabr, `supabase/update-4.sql` + `lib/teacher.ts`): `teachers.subjects text[]`, `teachers.is_head boolean`. Har bir o'qituvchi faqat O'Z fanlaridan davomat qiladi (Davomat sahifasida kunning 3 ta darsi ham ko'rinadi, boshqa o'qituvchining darsida tugma o'rniga "Boshqa o'qituvchi" belgisi turadi; "Boshqa fan" qo'lda tanlash bo'limi 17-oktabrda olib tashlangan, o'rniga "Bu haftadagi darslarim" kartasi; jadvalda yo'q (almashtirilgan) darsni hozir belgilab bo'lmaydi): bosh sahifa, davomat, tarix, hisobotlar faqat o'z fanlarini ko'rsatadi (`mySubjects(row)`; `null` = eski baza = cheklovsiz). RLS ham shuni majburlaydi (darslar va yozuvlar: `subject = any(teachers.subjects)`), o'qituvchi o'z `subjects/is_head` ustunlarini o'zgartira olmaydi (column-level GRANT: faqat full_name, avatar_url). To'liq jadval (Jadval) hammaga ko'rinadi. Eski darslar fan egasiga ko'chirilgan.
- Parollar: faqat BOSH o'qituvchi (Isakov) o'quvchilar parolini boshqaradi (`isHead(row)`, `/api/students/reset-password` ham tekshiradi); fan o'qituvchilari faqat o'z parolini almashtiradi (Sozlamalar -> Parolni almashtirish).
- O'quvchi bosh sahifasida familiya + ism ko'rinadi (`shortName`, masalan "Soburov Suxrob").
- 4 til (O'zbek/English/Русский/Türkçe): `lib/i18n.ts` (lug'at `D`, kalit -> [uz,en,ru,tr]), cookie `sa_lang`, `components/LanguageProvider.tsx`.
- Davomat qoidalari: dars bazaga FAQAT birinchi o'quvchi belgilanganda yoziladi (`lib/sessions.ts`: `dropEmpty` bo'sh eski darslarni o'chiradi, `pickLast` bosh sahifadagi "Oxirgi dars"ni jadval bo'yicha eng kechki paradan tanlaydi). Belgilanmagan o'quvchi avtomatik "Kelmadi" BO'LMAYDI (yozuv yaratilmaydi). Dars tarixida faqat belgilangan darslar chiqadi, bo'sh bo'lsa "Hozircha yo'q".
- Jadvalda "Haftalar almashadi"/"Boshqa hafta" yozuvlari ko'rsatilmaydi (almashish mantig'i ishlayveradi). Informatika: Isakov Shaxzod (seshanba 2-para va juma 1-para), Rus tili: Kurbanbayev Mardon.
- Para vaqtlari: 1-para 09:00–10:20, 10 daq tanaffus, 2-para 10:30–11:50, 10 daq tanaffus, 3-para 12:00–13:20 (`PAIR_TIMES`, `pairState`). Bosh sahifadagi dars holati soatga qarab: Kutilmoqda / Davom etmoqda / Davomat olingan / Yakunlanmagan / Davomat olinmagan (o'quvchida: holat yoki Belgilanmagan).
- Dars jadvali `lib/schedule.ts` (har bir guruh uchun alohida jadval: `WEEK_926`, `WEEK_726`; 3 para/kun; seshanba 1-para va shanba 3-para har hafta almashadi; 2026-08-31 haftasi = A (tepadagi), juft haftalar A, toq B; bu hafta ikkalasida ham PASTDAGI fan). Tarix (Chorshanba II va Juma III): Sultonov Farrux (`SULTONOV` konstantasi). O'qituvchi ismlari rasmdan o'qilgan, imlo xatosi bo'lishi mumkin. Haqiqiy 13 ta fan.
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
- `supabase/update-4.sql` — (16-oktabr): ustunlar, 6 ta o'qituvchi qatori, fan bo'yicha RLS, eski darslarni ko'chirish, login to'qnashuvini hal qilish. Parollar BU FAYLDA YO'Q. Foydalanuvchiga esa chatda alohida `update-4-supabase.sql` berilgan = shu fayl + akkaunt yaratish bloki (auth.users + auth.identities ga bcrypt bilan; parol oxiridagi `!` belgisi parolning bir qismi deb olingan — foydalanuvchi yozuvida boshqa tinish belgilari yo'qligi sababli). Bu blok GitHub'ga yuklanmaydi (repo ochiq). Mahalliy Postgres'da sinalgan (RLS har bir o'qituvchi uchun, ikki marta ishga tushirish), lekin haqiqiy Supabase GoTrue'da kirish sinalmagan: agar o'qituvchi kira olmasa, Supabase -> Authentication -> Users'da shu emailga (`teacher_komila@smartattend.local` va h.k.) qo'lda parol bilan foydalanuvchi qo'shib, SQL ni qayta ishga tushirish kifoya (u `teachers.user_id` ni bog'laydi).
- `supabase/update-5.sql` — YANGI (18-oktabr): 7-26 guruhi, 32 o'quvchi, kurator Komila-7.26 qatori, `teachers.all_subjects`, yangilangan RLS. Parollar BU FAYLDA YO'Q. Foydalanuvchiga chatda alohida `update-5-supabase.sql` berilgan = shu fayl + `Komila-7.26` akkaunti bloki (parol bilan, GitHub'ga yuklanmaydi). HALI ISHGA TUSHIRILGANI TASDIQLANMAGAN (foydalanuvchidan so'rang: 32 qator chiqdimi, Komila-7.26 da `akkaunt_bor = true` mi). Mahalliy Postgres'da sinalgan, qayta ishga tushirish xavfsiz. Tartib: update-4 -> update-5.
- 9-26 o'quvchilar ro'yxati (29): Alimboeva Sevinch, Baxtiyorova Xonzoda, Bazarbaeva Charos, Bazarboeva Shoxida, Egambergenova Madina, Karimbaeva Farangiz, Karimboyev Bunyodbek, Komilova Shabnam, Kuanishbaeva Gulmira, Kurbanbaev Abdurahmon, Kurbonboev G'ayratjon, Norqulova Hadichabibi, Otaxanova Gulnoza, Parxadova Muhayyo, Qurbanboeva Mahliyo, Ro'zumboeva Diana, Seitova Shoxista, Shukurullaev Diyorbek, Soburov Suxrob, Tairov Zoirjon, Tairov Muxiddin, Tajiboeva Ra'no, To'liboev Doniyor, Umirbekova Charos, Urgenchbaev Berik, Xabibullaeva Jasmina, Yuldasheva Maftuna, Yusupboeva Xosiyat, Nurjanova Shaxlo.

## Muhit bo'yicha eslatmalar
- Sandbox'da npm reestri bloklangan: `npm install`/`next build` ishlamaydi. Tekshiruv uchun: global `tsc` + stub `d.ts`, va global `react-dom/server` bilan smoke-render ishlatilgan. next.config.js: ignoreBuildErrors/ignoreDuringBuilds = true.
- Kod jonli Supabase'da sinab ko'rilmagan; Vercel build/ishga tushishdagi xatolar foydalanuvchi skrinshoti orqali keladi.
- Papkada 12-oktabrda boshqa seans kiritgan fayllar bor (swr.ts, MeProvider) — ular saqlangan va hozirgi kodga moslangan.

## Ochiq masalalar / foydalanuvchidan so'rash mumkin
- Foydalanuvchi bergan parollar oxiridagi `!` parolning bir qismi deb olingan. Kirish bo'lmasa, `!` siz variantni so'rang/sinang (parollar chatda, repoda emas).
- Jismoniy tarbiya va Chaqiruvga qadar tayyorgarlik o'qituvchilariga akkaunt kerakmi?
- O'quvchilar jadvalidagi `attendance_percentage` ustunini o'quvchi o'zi o'zgartira oladi (eski RLS: "Students can update their own profile") — keyinroq column-level GRANT bilan yopish mumkin.
- O'qituvchi ismi loginda "Shaxsod", ekranda "Isakov Shaxzod" — bir xil qilish kerakmi?
- 7-26: kurator Komila 32 o'quvchiga parol qo'yishi kerak (bittalab). Kerak bo'lsa 'hammasiga bir tugmada parol yaratish' qo'shish mumkin.
- 7-26: 4-para tushirib qoldirilgan (yuqoriga qarang), almashish tartibi 9-26 bilan bir xil deb olingan, Diyor familiyasi noma'lum. Foydalanuvchi tasdiqlashi kerak.
- DAVOMAT OLISH USULI O'ZGARISHI KUTILMOQDA: o'qituvchilarga 4 holat (Keldi/Kechikdi/Kelmadi/Sababli) yoqmadi. 17-18-oktabrda 3 ta oddiy va 3 ta boyroq maket (A: aqlli ro'yxat, B: sinf setkasi, C: chaqiruv rejimi + yakun ekrani) rasm sifatida ko'rsatilgan; foydalanuvchi hali tanlamagan. Kodga tegilmagan (`app/teacher/attendance/page.tsx` hali 4 holatli). Tanlangach: faqat Keldi/Kelmadi, 'saqlash' bosilganda belgilanmaganlarga 'keldi' yoziladi (avvalgi 'belgilanmagan = yozuv yo'q' qoidasidan farq qiladi — foydalanuvchi roziligi kerak).
- Seshanba 1-para uchun ham bu hafta "pastdagi" fan deb olingan (shanba bilan bir xil). Aksincha bo'lsa o'zgartirish kerak.
- O'qituvchilar ismlari imlosini tekshirish.
- Til har qurilmada alohida saqlanadi (cookie).
