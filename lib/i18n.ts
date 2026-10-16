export type Lang = 'uz' | 'en' | 'ru' | 'tr';
export const LANGS: Lang[] = ['uz', 'en', 'ru', 'tr'];
export const LANG_NATIVE: Record<Lang, string> = {
  uz: "O'zbekcha",
  en: 'English',
  ru: 'Русский',
  tr: 'Türkçe',
};

export function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as string[]).includes(v);
}

// [uz, en, ru, tr]
type Entry = [string, string, string, string];

const D: Record<string, Entry> = {
  // ---- common
  'common.loading': ['Yuklanmoqda...', 'Loading...', 'Загрузка...', 'Yükleniyor...'],
  'common.save': ['Saqlash', 'Save', 'Сохранить', 'Kaydet'],
  'common.saving': ['Saqlanmoqda...', 'Saving...', 'Сохранение...', 'Kaydediliyor...'],
  'common.back': ['Orqaga', 'Back', 'Назад', 'Geri'],
  'common.logout': ['Chiqish', 'Log out', 'Выйти', 'Çıkış yap'],
  'common.group': ['Guruh', 'Group', 'Группа', 'Grup'],
  'common.today': ['Bugun', 'Today', 'Сегодня', 'Bugün'],
  'common.search': ['Qidirish', 'Search', 'Поиск', 'Ara'],
  'common.copy': ['Nusxalash', 'Copy', 'Копировать', 'Kopyala'],
  'common.copied': ['Nusxalandi', 'Copied', 'Скопировано', 'Kopyalandı'],
  'common.error': ['Xatolik yuz berdi', 'Something went wrong', 'Произошла ошибка', 'Bir hata oluştu'],
  'common.show': ["Ko'rsatish", 'Show', 'Показать', 'Göster'],
  'common.lesson': ['Dars', 'Lesson', 'Занятие', 'Ders'],
  'role.teacher': ["O'qituvchi", 'Teacher', 'Преподаватель', 'Öğretmen'],
  'role.student': ["O'quvchi", 'Student', 'Студент', 'Öğrenci'],
  'status.present': ['Keldi', 'Present', 'Присутствует', 'Geldi'],
  'status.late': ['Kechikdi', 'Late', 'Опоздание', 'Geç kaldı'],
  'status.absent': ['Kelmadi', 'Absent', 'Отсутствует', 'Gelmedi'],
  'status.excused': ['Sababli', 'Excused', 'Уважительная', 'Mazeretli'],

  // ---- login
  'login.subtitle': ['Onlayn davomat tizimi', 'Online attendance system', 'Онлайн-система посещаемости', 'Çevrimiçi yoklama sistemi'],
  'login.username': ['Login', 'Login', 'Логин', 'Kullanıcı adı'],
  'login.password': ['Parol', 'Password', 'Пароль', 'Şifre'],
  'login.passwordPh': ['Parolingizni kiriting', 'Enter your password', 'Введите пароль', 'Şifrenizi girin'],
  'login.submit': ['Kirish', 'Sign in', 'Войти', 'Giriş yap'],
  'login.submitting': ['Kirilmoqda...', 'Signing in...', 'Вход...', 'Giriş yapılıyor...'],
  'login.invalid': ["Login yoki parol noto'g'ri", 'Incorrect login or password', 'Неверный логин или пароль', 'Kullanıcı adı veya şifre hatalı'],
  'login.help': [
    "Yordam kerak bo'lsa, o'qituvchingizga murojaat qiling:",
    'Need help? Contact your teacher:',
    'Нужна помощь? Обратитесь к преподавателю:',
    'Yardım için öğretmeninizle iletişime geçin:',
  ],
  'login.usernamePh': ['Loginingizni kiriting', 'Enter your login', 'Введите логин', 'Kullanıcı adınızı girin'],
  'login.contact': ["Yordam so'rang", 'Ask for help', 'Попросите помощи', 'Yardım isteyin'],
  'dash.upcoming': ['Kutilmoqda', 'Upcoming', 'Ожидается', 'Bekleniyor'],
  'dash.unfinished': ['Yakunlanmagan', 'Not finished', 'Не завершено', 'Tamamlanmadı'],
  'dash.notTaken': ['Davomat olinmagan', 'Not taken', 'Не отмечено', 'Alınmadı'],
  'pw.show': ["Parolni ko'rsatish", 'Show password', 'Показать пароль', 'Şifreyi göster'],
  'pw.hide': ['Parolni yashirish', 'Hide password', 'Скрыть пароль', 'Şifreyi gizle'],

  // ---- nav
  'nav.home': ['Bosh sahifa', 'Home', 'Главная', 'Ana sayfa'],
  'nav.schedule': ['Jadval', 'Schedule', 'Расписание', 'Program'],
  'nav.attendance': ['Davomat', 'Attendance', 'Посещаемость', 'Yoklama'],
  'nav.history': ['Tarix', 'History', 'История', 'Geçmiş'],
  'nav.chat': ['Chat', 'Chat', 'Чат', 'Sohbet'],
  'nav.settings': ['Sozlamalar', 'Settings', 'Настройки', 'Ayarlar'],

  // ---- dashboards
  'dash.hello': ['Assalomu alaykum', 'Hello', 'Здравствуйте', 'Merhaba'],
  'dash.attendanceToday': ['Bugungi davomat', "Today's attendance", 'Посещаемость сегодня', 'Bugünkü yoklama'],
  'dash.lastLesson': ['Oxirgi dars: {s}', 'Latest lesson: {s}', 'Последнее занятие: {s}', 'Son ders: {s}'],
  'dash.noneYet': ['Bugun hali davomat olinmagan', 'No attendance taken yet today', 'Сегодня посещаемость ещё не отмечена', 'Bugün henüz yoklama alınmadı'],
  'dash.total': ["Jami o'quvchilar", 'Total students', 'Всего студентов', 'Toplam öğrenci'],
  'dash.present': ['Kelgan', 'Present', 'Присутствуют', 'Gelen'],
  'dash.late': ['Kechikkan', 'Late', 'Опоздали', 'Geç kalan'],
  'dash.absent': ['Kelmagan', 'Absent', 'Отсутствуют', 'Gelmeyen'],
  'dash.rate': ['Davomat ulushi', 'Attendance rate', 'Доля посещаемости', 'Devam oranı'],
  'dash.todayLessons': ['Bugungi darslar', "Today's lessons", 'Уроки на сегодня', 'Bugünün dersleri'],
  'dash.noLessons': ["Bugun dars yo'q", 'No lessons today', 'Сегодня занятий нет', 'Bugün ders yok'],
  'dash.quick': ['Tezkor amallar', 'Quick actions', 'Быстрые действия', 'Hızlı işlemler'],
  'dash.start': ['Davomat boshlash', 'Start attendance', 'Начать отметку', 'Yoklamayı başlat'],
  'dash.history': ['Dars tarixi', 'Lesson history', 'История занятий', 'Ders geçmişi'],
  'dash.students': ["O'quvchilar", 'Students', 'Студенты', 'Öğrenciler'],
  'dash.reports': ['Hisobot', 'Reports', 'Отчёты', 'Raporlar'],
  'dash.timetable': ['Dars jadvali', 'Timetable', 'Расписание', 'Ders programı'],
  'dash.done': ['Davomat olingan', 'Attendance taken', 'Отмечено', 'Yoklama alındı'],
  'dash.inProgress': ['Davom etmoqda', 'In progress', 'Идёт', 'Devam ediyor'],
  'dash.status': ['Bugungi holat', "Today's status", 'Статус сегодня', 'Bugünkü durum'],
  'dash.notMarked': ['Belgilanmagan', 'Not marked', 'Не отмечено', 'İşaretlenmedi'],
  'dash.myRate': ['Davomat ko\'rsatkichi', 'Attendance rate', 'Посещаемость', 'Devam oranı'],
  'dash.myRateSub': ['qatnashilgan darslar ulushi', 'of lessons attended', 'доля посещённых занятий', 'katılınan derslerin oranı'],
  'dash.myHistory': ['Davomat tarixi', 'Attendance history', 'История посещаемости', 'Devam geçmişi'],

  // ---- attendance
  'att.title': ['Davomat belgilash', 'Mark attendance', 'Отметка посещаемости', 'Yoklama al'],
  'att.lessonsToday': ['Bugungi darslar', "Today's lessons", 'Уроки на сегодня', 'Bugünün dersleri'],
  'att.noLessons': [
    "Bugun jadvalda dars yo'q. Pastdan fanni qo'lda tanlashingiz mumkin.",
    'No lessons scheduled today. You can pick a subject manually below.',
    'Сегодня по расписанию занятий нет. Предмет можно выбрать вручную ниже.',
    'Bugün programda ders yok. Aşağıdan dersi elle seçebilirsiniz.',
  ],
  'att.pair': ['{n}-para', 'Pair {n}', '{n}-я пара', '{n}. ders'],
  'att.start': ['Boshlash', 'Start', 'Начать', 'Başlat'],
  'att.continue': ['Davom ettirish', 'Continue', 'Продолжить', 'Devam et'],
  'att.edit': ["Ko'rish / tahrirlash", 'View / edit', 'Открыть / изменить', 'Görüntüle / düzenle'],
  'att.finished': ['Yakunlangan', 'Finished', 'Завершено', 'Tamamlandı'],
  'att.active': ['Davom etmoqda', 'In progress', 'Идёт', 'Devam ediyor'],
  'att.noSubjects': ["Sizga hali fan biriktirilmagan", 'No subjects are assigned to you yet', 'Вам ещё не назначены предметы', 'Size henüz ders atanmadı'],
  'att.other': ['Boshqa fan', 'Other subject', 'Другой предмет', 'Diğer ders'],
  'att.pickSubject': ['Fanni tanlang', 'Choose a subject', 'Выберите предмет', 'Ders seçin'],
  'att.lessons': ['Darslar', 'Lessons', 'Занятия', 'Dersler'],
  'att.marked': ['Belgilandi {a}/{b}', 'Marked {a}/{b}', 'Отмечено {a}/{b}', 'İşaretlendi {a}/{b}'],
  'att.allPresent': ['Hammasini "Keldi" qilish', 'Mark everyone present', 'Отметить всех присутствующими', 'Hepsini geldi işaretle'],
  'att.finish': ['Darsni yakunlash', 'Finish lesson', 'Завершить занятие', 'Dersi bitir'],
  'att.unmarkedNote': ['Belgilanmaganlar "Kelmadi" bo\'ladi', 'Unmarked students count as absent', 'Неотмеченные будут отсутствующими', 'İşaretlenmeyenler gelmedi sayılır'],
  'att.reopen': ['Darsni qayta ochish', 'Reopen lesson', 'Открыть занятие снова', 'Dersi yeniden aç'],
  'att.closedNote': ['Dars yakunlangan. Tahrirlash uchun qayta oching.', 'This lesson is finished. Reopen it to edit.', 'Занятие завершено. Откройте его снова, чтобы изменить.', 'Bu ders tamamlandı. Düzenlemek için yeniden açın.'],
  'att.clear': ['Belgilarni tozalash', 'Clear all marks', 'Сбросить все отметки', 'Tüm işaretleri temizle'],
  'att.tapAgain': ['Xato belgilangan bo\'lsa, o\'sha tugmani yana bosing — belgi bekor bo\'ladi', 'Marked by mistake? Tap the same button again to undo', 'Ошиблись? Нажмите ту же кнопку ещё раз, чтобы отменить', 'Yanlış mı işaretlendi? Aynı düğmeye tekrar dokunun'],
  'att.back': ['Darslar ro\'yxati', 'Lesson list', 'Список занятий', 'Ders listesi'],
  'att.saved': ['Davomat saqlandi', 'Attendance saved', 'Посещаемость сохранена', 'Yoklama kaydedildi'],
  'att.saveFailed': ['Saqlanmadi', 'Could not save', 'Не удалось сохранить', 'Kaydedilemedi'],
  'att.noTeacher': ["O'qituvchi profili topilmadi", 'Teacher profile not found', 'Профиль преподавателя не найден', 'Öğretmen profili bulunamadı'],

  // ---- students / history / reports
  'stu.title': ["O'quvchilar", 'Students', 'Студенты', 'Öğrenciler'],
  'stu.login': ['Login', 'Login', 'Логин', 'Kullanıcı adı'],
  'stu.noAccount': ["Akkaunt yo'q", 'No account', 'Нет аккаунта', 'Hesap yok'],
  'stu.search': ['Ism yoki login', 'Name or login', 'Имя или логин', 'İsim veya kullanıcı adı'],
  'hist.title': ['Dars tarixi', 'Lesson history', 'История занятий', 'Ders geçmişi'],
  'hist.empty': ["Hozircha yo'q", 'Nothing yet', 'Пока нет', 'Henüz yok'],
  'hist.active': ['davom etmoqda', 'in progress', 'идёт', 'devam ediyor'],
  'myhist.title': ['Davomat tarixi', 'Attendance history', 'История посещаемости', 'Devam geçmişi'],
  'myhist.empty': ["Hozircha yozuvlar yo'q", 'No records yet', 'Записей пока нет', 'Henüz kayıt yok'],
  'rep.title': ['Hisobot', 'Report', 'Отчёт', 'Rapor'],
  'rep.from': ['Boshlanish', 'From', 'С', 'Başlangıç'],
  'rep.to': ['Tugash', 'To', 'По', 'Bitiş'],
  'rep.lessons': ['Darslar', 'Lessons', 'Занятий', 'Ders'],
  'rep.records': ['Yozuvlar', 'Records', 'Записей', 'Kayıt'],
  'rep.csvSummary': ['CSV: xulosa', 'CSV: summary', 'CSV: сводка', 'CSV: özet'],
  'rep.csvDetailed': ['CSV: batafsil', 'CSV: detailed', 'CSV: подробно', 'CSV: ayrıntılı'],
  'rep.student': ["O'quvchi", 'Student', 'Студент', 'Öğrenci'],
  'rep.date': ['Sana', 'Date', 'Дата', 'Tarih'],
  'rep.subject': ['Fan', 'Subject', 'Предмет', 'Ders'],
  'rep.login': ['Login', 'Login', 'Логин', 'Kullanıcı adı'],
  'rep.status': ['Holat', 'Status', 'Статус', 'Durum'],
  'rep.total': ['Jami darslar', 'Total lessons', 'Всего занятий', 'Toplam ders'],
  'rep.percent': ['Davomat %', 'Attendance %', 'Посещаемость %', 'Devam %'],
  'rep.legend': [
    'Foiz = (keldi + kechikdi) / jami darslar.',
    'Percent = (present + late) / total lessons.',
    'Процент = (присутствовал + опоздал) / всего занятий.',
    'Yüzde = (gelen + geç kalan) / toplam ders.',
  ],

  // ---- schedule
  'sch.title': ['Dars jadvali', 'Timetable', 'Расписание занятий', 'Ders programı'],
  'sch.thisWeek': ['Bu hafta', 'This week', 'Эта неделя', 'Bu hafta'],
  'sch.nextWeek': ['Keyingi hafta', 'Next week', 'Следующая неделя', 'Gelecek hafta'],
  'sch.alternates': ['Haftalar almashadi', 'Alternates weekly', 'Чередуется по неделям', 'Haftalık dönüşümlü'],
  'sch.otherWeek': ['Boshqa hafta: {s}', 'Other week: {s}', 'Другая неделя: {s}', 'Diğer hafta: {s}'],
  'sch.vacant': ['Vakant', 'Vacant', 'Вакансия', 'Boş kadro'],
  'sch.room': ['Xona', 'Room', 'Аудитория', 'Oda'],
  'sch.noLessons': ['Dars yo\'q', 'No lessons', 'Занятий нет', 'Ders yok'],

  // ---- chat
  'chat.group': ['Guruh', 'Group', 'Группа', 'Grup'],
  'chat.private': ['Shaxsiy', 'Private', 'Личные', 'Özel'],
  'chat.groupName': ['Guruh chati', 'Group chat', 'Групповой чат', 'Grup sohbeti'],
  'chat.members': ['{n} ishtirokchi', '{n} members', 'Участников: {n}', '{n} üye'],
  'chat.placeholder': ['Xabar yozing...', 'Type a message...', 'Напишите сообщение...', 'Bir mesaj yazın...'],
  'chat.send': ['Yuborish', 'Send', 'Отправить', 'Gönder'],
  'chat.empty': ["Hozircha xabarlar yo'q. Birinchi bo'lib yozing!", 'No messages yet. Say hello!', 'Сообщений пока нет. Напишите первым!', 'Henüz mesaj yok. İlk mesajı siz yazın!'],
  'chat.search': ['Qidirish', 'Search people', 'Поиск людей', 'Kişi ara'],
  'chat.sendFailed': ['Xabar yuborilmadi', 'Message not sent', 'Сообщение не отправлено', 'Mesaj gönderilemedi'],
  'chat.notSetup': [
    "Chat hali sozlanmagan. Bazaga update-1.sql ni ishga tushiring.",
    'Chat is not set up yet. Run update-1.sql in the database.',
    'Чат ещё не настроен. Выполните update-1.sql в базе данных.',
    'Sohbet henüz kurulmadı. Veritabanında update-1.sql çalıştırın.',
  ],
  'chat.noPeople': ['Hech kim topilmadi', 'Nobody found', 'Никого не найдено', 'Kimse bulunamadı'],
  'chat.you': ['Siz', 'You', 'Вы', 'Siz'],

  // ---- confirm / undo / reopen
  'common.cancel': ['Bekor qilish', 'Cancel', 'Отмена', 'İptal'],
  'logout.title': ['Chiqish', 'Log out', 'Выход', 'Çıkış'],
  'logout.confirm': ['Hisobingizdan chiqishni xohlaysizmi?', 'Are you sure you want to log out?', 'Вы уверены, что хотите выйти?', 'Çıkış yapmak istediğinizden emin misiniz?'],
  'att.reopenHint': ['Davomat qayta ochildi. Tahrirlab, yana yakunlang.', 'Attendance reopened. Edit it and finish again.', 'Посещаемость открыта заново. Измените и завершите снова.', 'Yoklama yeniden açıldı. Düzenleyip tekrar bitirin.'],

  // ---- settings
  'set.title': ['Sozlamalar', 'Settings', 'Настройки', 'Ayarlar'],
  'set.passwords': ['Parollarni almashtirish', 'Change passwords', 'Смена паролей', 'Şifreleri değiştir'],
  'set.passwordsDesc': ["O'zingizning va o'quvchilar parollari", "Your password and students' passwords", 'Ваш пароль и пароли студентов', 'Kendi şifreniz ve öğrencilerin şifreleri'],
  'set.password': ['Parolni almashtirish', 'Change password', 'Сменить пароль', 'Şifreyi değiştir'],
  'set.passwordDesc': ['Kirish parolini yangilash', 'Update your sign-in password', 'Обновить пароль для входа', 'Giriş şifrenizi güncelleyin'],
  'set.language': ['Til', 'Language', 'Язык', 'Dil'],
  'set.languageDesc': ['Ilova tilini tanlang', 'Choose the app language', 'Выберите язык приложения', 'Uygulama dilini seçin'],
  'set.logout': ['Chiqish', 'Log out', 'Выйти', 'Çıkış yap'],
  'set.logoutDesc': ['Hisobdan chiqish', 'Sign out of your account', 'Выйти из аккаунта', 'Hesabınızdan çıkış yapın'],
  'lang.uz': ["O'zbek tili", 'Uzbek', 'Узбекский', 'Özbekçe'],
  'lang.en': ['Ingliz tili', 'English', 'Английский', 'İngilizce'],
  'lang.ru': ['Rus tili', 'Russian', 'Русский', 'Rusça'],
  'lang.tr': ['Turk tili', 'Turkish', 'Турецкий', 'Türkçe'],

  // ---- password forms
  'pw.mine': ['Mening parolim', 'My password', 'Мой пароль', 'Şifrem'],
  'pw.students': ["O'quvchilar", 'Students', 'Студенты', 'Öğrenciler'],
  'pw.current': ['Hozirgi parol', 'Current password', 'Текущий пароль', 'Mevcut şifre'],
  'pw.new': ['Yangi parol', 'New password', 'Новый пароль', 'Yeni şifre'],
  'pw.newHint': ['Kamida 8 ta belgi', 'At least 8 characters', 'Не менее 8 символов', 'En az 8 karakter'],
  'pw.repeat': ['Yangi parolni takrorlang', 'Repeat new password', 'Повторите новый пароль', 'Yeni şifreyi tekrarlayın'],
  'pw.change': ["Parolni o'zgartirish", 'Change password', 'Изменить пароль', 'Şifreyi değiştir'],
  'pw.tooShort': ["Yangi parol kamida 8 ta belgidan iborat bo'lsin", 'New password must be at least 8 characters', 'Новый пароль должен содержать не менее 8 символов', 'Yeni şifre en az 8 karakter olmalı'],
  'pw.mismatch': ['Yangi parollar bir xil emas', "New passwords don't match", 'Новые пароли не совпадают', 'Yeni şifreler eşleşmiyor'],
  'pw.wrongCurrent': ["Hozirgi parol noto'g'ri", 'Current password is incorrect', 'Текущий пароль неверен', 'Mevcut şifre yanlış'],
  'pw.changed': ["Parol o'zgartirildi", 'Password changed', 'Пароль изменён', 'Şifre değiştirildi'],
  'pw.signinAgain': ['Qaytadan kiring', 'Please sign in again', 'Войдите снова', 'Lütfen tekrar giriş yapın'],
  'pw.studentHint': [
    "Akkaunti yo'q o'quvchiga parol qo'ysangiz, akkaunt avtomatik yaratiladi.",
    'Setting a password for a student without an account creates it automatically.',
    'Если у студента нет аккаунта, он будет создан автоматически.',
    'Hesabı olmayan öğrenciye şifre verirseniz hesap otomatik oluşturulur.',
  ],
  'pw.generate': ["Parol o'ylab top", 'Generate', 'Сгенерировать', 'Oluştur'],
  'pw.hasAccount': ['Akkaunt bor', 'Has account', 'Есть аккаунт', 'Hesap var'],
  'pw.created': ['Akkaunt yaratildi.', 'Account created.', 'Аккаунт создан.', 'Hesap oluşturuldu.'],
  'pw.result': ['Login: {login} · Parol: {pw}', 'Login: {login} · Password: {pw}', 'Логин: {login} · Пароль: {pw}', 'Kullanıcı adı: {login} · Şifre: {pw}'],
  'pw.newOfStudent': ['Yangi parol (kamida 8 belgi)', 'New password (min. 8 characters)', 'Новый пароль (мин. 8 символов)', 'Yeni şifre (en az 8 karakter)'],
};

const IDX: Record<Lang, number> = { uz: 0, en: 1, ru: 2, tr: 3 };

export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const e = D[key];
  if (!e) return key;
  let s = e[IDX[lang]] ?? e[0];
  if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
  return s;
}

export const DICT_KEYS = Object.keys(D);
