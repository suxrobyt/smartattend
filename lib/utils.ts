export type Status = 'present' | 'late' | 'absent' | 'excused';
export const STATUS_ORDER: Status[] = ['present', 'late', 'absent', 'excused'];

export const STATUS_SOLID: Record<Status, string> = {
  present: 'bg-ok text-[#04130d] border-ok',
  late: 'bg-warn text-[#1b1200] border-warn',
  absent: 'bg-bad text-[#1d0505] border-bad',
  excused: 'bg-info text-[#04101f] border-info',
};
export const STATUS_SOFT: Record<Status, string> = {
  present: 'bg-ok/15 text-ok border-ok/30',
  late: 'bg-warn/15 text-warn border-warn/30',
  absent: 'bg-bad/15 text-bad border-bad/30',
  excused: 'bg-info/15 text-info border-info/30',
};
export const STATUS_DOT: Record<Status, string> = {
  present: 'bg-ok',
  late: 'bg-warn',
  absent: 'bg-bad',
  excused: 'bg-info',
};

// Local date as YYYY-MM-DD (not UTC), so "today" matches the phone's calendar
export function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA');
}

export function nowTime(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  return d.toTimeString().slice(0, 8);
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}.${m}.${y}`;
}

export function fmtTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toTimeString().slice(0, 5);
}

// Full names are "Surname Name Patronymic": the first name is the 2nd word
export function firstName(full: string): string {
  const p = (full || '').trim().split(/\s+/);
  return p[1] || p[0] || '';
}

export function initials(name: string): string {
  const p = (name || '').trim().split(/\s+/);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
}

// ---------- CSV helpers ----------
export function toCsv(rows: (string | number)[][]): string {
  // BOM so Excel opens non-ASCII letters correctly
  return (
    '﻿' +
    rows
      .map((r) => r.map((v) => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(','))
      .join('\r\n')
  );
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Easy-to-read random password (no 0/O, 1/l/I)
export function randomPassword(length = 10): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}
