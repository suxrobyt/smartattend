import type { Lang } from './i18n';

export const GROUP_LABEL = '9K 9-26';
export const ROOM = '1-B, №404';

type Opt = { subject: string; teacher: string | null };
// 1 option = every week. 2 options = [top, bottom] alternating weekly.
type Cell = { pair: 1 | 2 | 3; opts: Opt[] };

const ISAKOV = 'Isakov Shaxzod';
const ABDULLAYEVA = 'Abdullayeva Komila';
const YAKUBOV = 'Yakubov Vali';
const KARJ = ISAKOV;

const one = (pair: 1 | 2 | 3, subject: string, teacher: string | null): Cell => ({
  pair,
  opts: [{ subject, teacher }],
});

// Day keys follow Date.getDay(): 1 = Monday ... 6 = Saturday. Only 3 pairs per day.
export const WEEK: Record<number, Cell[]> = {
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
    one(2, 'Tarix', null),
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
    one(3, 'Tarix', null),
  ],
  6: [
    one(1, 'Tarbiya', 'Tazabayeva Muqaddas'),
    one(2, 'Ingliz tili', ABDULLAYEVA),
    {
      pair: 3,
      opts: [
        { subject: 'Jismoniy tarbiya', teacher: "Quliyeva O'g'iljon" },
        { subject: "Chaqiruvga qadar boshlang'ich tayyorgarlik", teacher: 'Ametov Xudayshukur' },
      ],
    },
  ],
};

export type Resolved = {
  pair: number;
  subject: string;
  teacher: string | null;
  alternates: boolean;
  other?: Opt;
};

export function lessonsFor(day: number, week: 'A' | 'B'): Resolved[] {
  return (WEEK[day] || []).map((c) => {
    const alt = c.opts.length > 1;
    const idx = alt && week === 'B' ? 1 : 0;
    return {
      pair: c.pair,
      subject: c.opts[idx].subject,
      teacher: c.opts[idx].teacher,
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

export const ALL_SUBJECTS: string[] = Array.from(
  new Set(Object.values(WEEK).flatMap((cells) => cells.flatMap((c) => c.opts.map((o) => o.subject))))
);

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
