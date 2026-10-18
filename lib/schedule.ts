import type { Lang } from './i18n';

// Every group has its own timetable, label and classroom.
// The group of the logged-in user (see MeProvider) decides which one is shown.
export const DEFAULT_GROUP = '9-26';
const GROUP_INFO: Record<string, { label: string; room: string }> = {
  '9-26': { label: '9K 9-26', room: '1-B, №404' },
  '7-26': { label: '9K 7-26', room: '1-B, №202' },
};
export const groupLabel = (code: string) => GROUP_INFO[code]?.label ?? '9K ' + code;
export const roomOf = (code: string) => GROUP_INFO[code]?.room ?? '';

// `room` is set only when the lesson is held somewhere other than the group's usual classroom (e.g. the workshop)
type Opt = { subject: string; teacher: string | null; room?: string };
// 1 option = every week. 2 options = [top, bottom] alternating weekly.
type Cell = { pair: 1 | 2 | 3; opts: Opt[] };

const ISAKOV = 'Isakov Shaxzod';
const ABDULLAYEVA = 'Abdullayeva Komila';
const YAKUBOV = 'Yakubov Vali';
const KARJ = ISAKOV;
const SULTONOV = 'Sultonov Farrux';
const YAKUPOVA = 'Yakupova Muborak';
const DIYOR = 'Diyor'; // Jismoniy tarbiya (both groups)
const AMETOV = 'Ametov Xudayshukur';
const MOYNALI = "Mo'ynali va po'stloq mahsulotlarini ishlab chiqarishni tashkil etish";
const INTENSIV = 'Intensiv va yaylov chorvachiligi';

const one =(pair: 1 | 2 | 3, subject: string, teacher: string | null): Cell => ({
  pair,
  opts: [{ subject, teacher }],
});

// Day keys follow Date.getDay(): 1 = Monday ... 6 = Saturday. Only 3 pairs per day.
const WEEK_926: Record<number, Cell[]> = {
  1: [
    one(1, 'Kasbiy faoliyatga kirish, mehnat muhofazasi va professional etika', ISAKOV),
    one(2, 'Ingliz tili', ABDULLAYEVA),
    one(3, 'Kompyuter arxitekturasi va operatsion tizimlar', ISAKOV),
  ],
  2: [
    {
      pair: 1,
      opts: [
        { subject: 'Fizika va astronomiya', teacher: YAKUBOV },
        { subject: 'Kompyuter arxitekturasi va operatsion tizimlar', teacher: ISAKOV },
      ],
    },
    one(2, 'Informatika va axborot texnologiyalari', KARJ),
    one(3, 'Rus tili va adabiyoti', 'Kurbanbayev Mardon'),
  ],
  3: [
    one(1, 'Kompyuter tarmoqlari asoslari', ISAKOV),
    one(2, 'Tarix', SULTONOV),
    one(3, 'Ingliz tili', ABDULLAYEVA),
  ],
  4: [
    one(1, 'Algoritmlar va dasturlash asoslari', ISAKOV),
    one(2, 'Fizika va astronomiya', YAKUBOV),
    one(3, 'Ingliz tili', ABDULLAYEVA),
  ],
  5: [
    one(1, 'Informatika va axborot texnologiyalari', KARJ),
    one(2, 'Ona tili va adabiyoti', 'Uskinova Shaxlo'),
    one(3, 'Tarix', SULTONOV),
  ],
  6: [
    one(1, 'Tarbiya', 'Tazabayeva Muqaddas'),
    one(2, 'Ingliz tili', ABDULLAYEVA),
    {
      pair: 3,
      opts: [
        { subject: 'Jismoniy tarbiya', teacher: DIYOR },
        { subject: "Chaqiruvga qadar boshlang'ich tayyorgarlik", teacher: AMETOV },
      ],
    },
  ],
};

// 9K 7-26 (Chorvachilik fermasi operatori). The paper timetable has 4 pairs on some days;
// only the first 3 are used here (same 3 pair times as the other group).
const WEEK_726: Record<number, Cell[]> = {
  1: [
    one(1, 'Tarix', SULTONOV),
    one(2, "Qishloq xo'jalik hayvonlari anatomiyasi va fiziologiyasi", YAKUPOVA),
    one(3, 'Zoogigiyena va veterinariya asoslari', YAKUPOVA),
  ],
  2: [
    one(1, 'Matematika', 'Jumabayev Raxul'),
    one(2, 'Ingliz tili', ABDULLAYEVA),
    one(3, 'Ona tili va adabiyoti', 'Uskinova Shaxlo'),
  ],
  3: [
    {
      pair: 1,
      opts: [
        { subject: 'Jismoniy tarbiya', teacher: DIYOR },
        { subject: "Chaqiruvga qadar boshlang'ich tayyorgarlik", teacher: AMETOV },
      ],
    },
    one(2, 'Ingliz tili', ABDULLAYEVA),
    one(3, 'Hayvonlarini oziqlantirish', YAKUPOVA),
  ],
  4: [
    one(1, 'Ingliz tili', ABDULLAYEVA),
    one(2, INTENSIV, YAKUPOVA),
    one(3, 'Tarbiya', 'Tazabayeva Muqaddas'),
  ],
  5: [
    one(1, MOYNALI, YAKUPOVA),
    one(2, 'Geografiya', 'Davletbayev Kanat'),
    { pair: 3, opts: [{ subject: "Intensiv va yaylov chorvachilik ishlari O'/A", teacher: null, room: 'Ustaxona' }] },
  ],
  6: [
    one(1, 'Biologiya', 'Xalimbetova Mahbuba'),
    {
      pair: 2,
      opts: [
        { subject: INTENSIV, teacher: YAKUPOVA },
        { subject: MOYNALI, teacher: YAKUPOVA },
      ],
    },
    one(3, 'Ingliz tili', ABDULLAYEVA),
  ],
};

const TABLES: Record<string, Record<number, Cell[]>> = { '9-26': WEEK_926, '7-26': WEEK_726 };

export type Resolved = {
  pair: number;
  subject: string;
  teacher: string | null;
  room?: string;
  alternates: boolean;
  other?: Opt;
};

export function lessonsFor(day: number, week: 'A' | 'B', group: string = DEFAULT_GROUP): Resolved[] {
  return ((TABLES[group] || {})[day] || []).map((c) => {
    const alt = c.opts.length > 1;
    const idx = alt && week === 'B' ? 1 : 0;
    return {
      pair: c.pair,
      subject: c.opts[idx].subject,
      teacher: c.opts[idx].teacher,
      room: c.opts[idx].room,
      alternates: alt,
      other: alt ? c.opts[1 - idx] : undefined,
    };
  });
}

// Week of 31 Aug 2026 is an "A" week (top option). Weeks then alternate.
// 5-11 Oct 2026 therefore is a "B" week: Saturday 3rd pair = Chaqiruvga qadar...
const REF_MONDAY_UTC = Date.UTC(2026, 7, 31);

export function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

export function weekType(d: Date): 'A' | 'B' {
  const m = mondayOf(d);
  const diff = Math.round((Date.UTC(m.getFullYear(), m.getMonth(), m.getDate()) - REF_MONDAY_UTC) / 86400000);
  const weeks = Math.floor(diff / 7);
  return ((weeks % 2) + 2) % 2 === 0 ? 'A' : 'B';
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

// Every subject in a group's timetable (for a curator who marks all subjects)
export function subjectsOf(group: string = DEFAULT_GROUP): string[] {
  const t = TABLES[group] || {};
  return Array.from(new Set(Object.values(t).flatMap((cells) => cells.flatMap((c) => c.opts.map((o) => o.subject)))));
}

// [en, ru, tr]
const SUBJECT_TR: Record<string, [string, string, string]> = {
  'Kasbiy faoliyatga kirish, mehnat muhofazasi va professional etika': [
    'Introduction to professional activity, occupational safety and professional ethics',
    'Введение в профессиональную деятельность, охрана труда и профессиональная этика',
    'Mesleki faaliyete giriş, iş güvenliği ve mesleki etik',
  ],
  'Ingliz tili': ['English language', 'Английский язык', 'İngilizce'],
  'Kompyuter arxitekturasi va operatsion tizimlar': [
    'Computer architecture and operating systems',
    'Архитектура компьютера и операционные системы',
    'Bilgisayar mimarisi ve işletim sistemleri',
  ],
  'Fizika va astronomiya': ['Physics and astronomy', 'Физика и астрономия', 'Fizik ve astronomi'],
  'Informatika va axborot texnologiyalari': [
    'Informatics and information technology',
    'Информатика и информационные технологии',
    'Bilişim ve bilgi teknolojileri',
  ],
  'Rus tili va adabiyoti': ['Russian language and literature', 'Русский язык и литература', 'Rus dili ve edebiyatı'],
  'Kompyuter tarmoqlari asoslari': ['Computer networks basics', 'Основы компьютерных сетей', 'Bilgisayar ağlarının temelleri'],
  Tarix: ['History', 'История', 'Tarih'],
  'Algoritmlar va dasturlash asoslari': [
    'Algorithms and programming basics',
    'Основы алгоритмов и программирования',
    'Algoritma ve programlama temelleri',
  ],
  'Ona tili va adabiyoti': ['Native language and literature', 'Родной язык и литература', 'Ana dili ve edebiyatı'],
  Tarbiya: ['Character education', 'Воспитание', 'Terbiye'],
  'Jismoniy tarbiya': ['Physical education', 'Физическая культура', 'Beden eğitimi'],
  "Chaqiruvga qadar boshlang'ich tayyorgarlik": [
    'Pre-conscription basic training',
    'Допризывная начальная подготовка',
    'Askerlik öncesi temel eğitim',
  ],
  // ----- 9K 7-26 -----
  "Qishloq xo'jalik hayvonlari anatomiyasi va fiziologiyasi": [
    'Anatomy and physiology of farm animals',
    'Анатомия и физиология сельскохозяйственных животных',
    'Çiftlik hayvanlarının anatomisi ve fizyolojisi',
  ],
  'Zoogigiyena va veterinariya asoslari': [
    'Zoohygiene and basics of veterinary science',
    'Зоогигиена и основы ветеринарии',
    'Zoohijyen ve veterinerlik temelleri',
  ],
  Matematika: ['Mathematics', 'Математика', 'Matematik'],
  'Hayvonlarini oziqlantirish': ['Animal feeding', 'Кормление животных', 'Hayvan besleme'],
  'Intensiv va yaylov chorvachiligi': [
    'Intensive and pasture livestock farming',
    'Интенсивное и пастбищное животноводство',
    'Entansif ve mera hayvancılığı',
  ],
  "Mo'ynali va po'stloq mahsulotlarini ishlab chiqarishni tashkil etish": [
    'Organizing the production of fur and sheepskin products',
    'Организация производства меховой и овчинной продукции',
    'Kürk ve koyun postu ürünleri üretiminin organizasyonu',
  ],
  Geografiya: ['Geography', 'География', 'Coğrafya'],
  "Intensiv va yaylov chorvachilik ishlari O'/A": [
    'Intensive and pasture livestock work (practical training)',
    'Интенсивное и пастбищное животноводство (практика)',
    'Entansif ve mera hayvancılığı çalışmaları (uygulama)',
  ],
  Biologiya: ['Biology', 'Биология', 'Biyoloji'],
};

export function subjectLabel(uz: string, lang: Lang): string {
  if (lang === 'uz') return uz;
  const e = SUBJECT_TR[uz];
  if (!e) return uz;
  return e[lang === 'en' ? 0 : lang === 'ru' ? 1 : 2];
}

// index 0 = Sunday
const DAYS: [string, string, string, string][] = [
  ['Yakshanba', 'Sunday', 'Воскресенье', 'Pazar'],
  ['Dushanba', 'Monday', 'Понедельник', 'Pazartesi'],
  ['Seshanba', 'Tuesday', 'Вторник', 'Salı'],
  ['Chorshanba', 'Wednesday', 'Среда', 'Çarşamba'],
  ['Payshanba', 'Thursday', 'Четверг', 'Perşembe'],
  ['Juma', 'Friday', 'Пятница', 'Cuma'],
  ['Shanba', 'Saturday', 'Суббота', 'Cumartesi'],
];
const DAYS_SHORT: [string, string, string, string][] = [
  ['Ya', 'Sun', 'Вс', 'Paz'],
  ['Du', 'Mon', 'Пн', 'Pzt'],
  ['Se', 'Tue', 'Вт', 'Sal'],
  ['Ch', 'Wed', 'Ср', 'Çar'],
  ['Pa', 'Thu', 'Чт', 'Per'],
  ['Ju', 'Fri', 'Пт', 'Cum'],
  ['Sh', 'Sat', 'Сб', 'Cmt'],
];
const LANG_IDX: Record<Lang, number> = { uz: 0, en: 1, ru: 2, tr: 3 };

export const dayName = (d: number, lang: Lang) => DAYS[d][LANG_IDX[lang]];
export const dayShort = (d: number, lang: Lang) => DAYS_SHORT[d][LANG_IDX[lang]];

// ---------- Pair times (break between pairs: 10 minutes) ----------
export const PAIR_TIMES: Record<number, [string, string]> = {
  1: ['09:00', '10:20'],
  2: ['10:30', '11:50'],
  3: ['12:00', '13:20'],
};

export const pairTime = (pair: number) => {
  const t = PAIR_TIMES[pair];
  return t ? `${t[0]}–${t[1]}` : '';
};

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

// Where a pair is relative to the clock: not started / in progress / finished
export function pairState(pair: number, now: Date): 'upcoming' | 'now' | 'over' {
  const t = PAIR_TIMES[pair];
  if (!t) return 'upcoming';
  const cur = now.getHours() * 60 + now.getMinutes();
  if (cur < toMin(t[0])) return 'upcoming';
  if (cur < toMin(t[1])) return 'now';
  return 'over';
}
