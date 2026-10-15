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
- O'qituvchi: `Shaxsod-9.26`; o'quvchilar: `Ism-9.26` (ism = to'liq ismning 2-so'zi; bir xil ism bo'lsa familiya bosh harfi: `CharosB-9.26`, `CharosU-9.26`).
- Kirish: RPC `email_for_username` (normallashtirilgan) -> `signInWithPassword`. Auth emaillari eski (`student_xxx@smartattend.local`, `teacher_demo@smartattend.local`), faqat `students.username`/`teachers.username` o'zgargan.
- Kirish sahifasida login misoli va format maslahati YO'Q; login maydonida neytral "Loginingizni kiriting". Pastda "Yordam kerak bo'lsa, o'qituvchingizga murojaat qiling:" + havola "Yordam so'rash" (Telegram belgisi bilan) -> https://t.me/Isakovshaxzodbek (z yoki s bilan yozilishi foydalanuvchidan hali tasdiqlanmagan).
- Logotip (foydalanuvchi 15-oktabrda 6 ta variantdan 6-sini tanladi): to'q ko'k gradient yumaloq kvadrat, oltin hoshiya, oq-ko'k kollej shlyapasi (oltin popuk), o'ng pastda yashil galochka belgisi (`components/Logo.tsx`, `public/icon.svg`). Yordam havolasi: "Yordam so'rang" + Telegram belgisi, yordam gapining tagida.

### Funksiyalar (hammasi tayyor)
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
- `supabase/update-3.sql` — YANGI (15-oktabr): guruhning 29 talik yangi ro'yxati (xlsx: "9-26-guruh ro'yxati"). Ismlarni to'g'rilaydi (Parxadova, Shukurullaev, Nasirulla, Egambergenova), ro'yxatda yo'q 3 ta o'quvchini (Shukrullaeva Madinabonu, Urazbaeva Aynura, Yusupova Yulduz) davomati va akkaunti bilan o'chiradi, 2 ta yangisini qo'shadi (Tairov Muxiddin -> `Muxiddin-9.26`, Nurjanova Shaxlo -> `Shaxlo-9.26`; akkauntlari yo'q, o'qituvchi Sozlamalar -> Parollar orqali yaratadi) va loginlarni qayta hisoblaydi. Mahalliy Postgres'da sinalgan (29 qator, ikkinchi marta ishga tushirish xavfsiz). Foydalanuvchi ishga tushirganini tasdiqlamagan.
- O'quvchilar ro'yxati (29): Alimboeva Sevinch, Baxtiyorova Xonzoda, Bazarbaeva Charos, Bazarboeva Shoxida, Egambergenova Madina, Karimbaeva Farangiz, Karimboyev Bunyodbek, Komilova Shabnam, Kuanishbaeva Gulmira, Kurbanbaev Abdurahmon, Kurbonboev G'ayratjon, Norqulova Hadichabibi, Otaxanova Gulnoza, Parxadova Muhayyo, Qurbanboeva Mahliyo, Ro'zumboeva Diana, Seitova Shoxista, Shukurullaev Diyorbek, Soburov Suxrob, Tairov Zoirjon, Tairov Muxiddin, Tajiboeva Ra'no, To'liboev Doniyor, Umirbekova Charos, Urgenchbaev Berik, Xabibullaeva Jasmina, Yuldasheva Maftuna, Yusupboeva Xosiyat, Nurjanova Shaxlo.

## Muhit bo'yicha eslatmalar
- Sandbox'da npm reestri bloklangan: `npm install`/`next build` ishlamaydi. Tekshiruv uchun: global `tsc` + stub `d.ts`, va global `react-dom/server` bilan smoke-render ishlatilgan. next.config.js: ignoreBuildErrors/ignoreDuringBuilds = true.
- Kod jonli Supabase'da sinab ko'rilmagan; Vercel build/ishga tushishdagi xatolar foydalanuvchi skrinshoti orqali keladi.
- Papkada 12-oktabrda boshqa seans kiritgan fayllar bor (swr.ts, MeProvider) — ular saqlangan va hozirgi kodga moslangan.

## Ochiq masalalar / foydalanuvchidan so'rash mumkin
- O'qituvchi ismi loginda "Shaxsod", ekranda "Isakov Shaxzod" — bir xil qilish kerakmi?
- Seshanba 1-para uchun ham bu hafta "pastdagi" fan deb olingan (shanba bilan bir xil). Aksincha bo'lsa o'zgartirish kerak.
- O'qituvchilar ismlari imlosini tekshirish.
- Til har qurilmada alohida saqlanadi (cookie).
