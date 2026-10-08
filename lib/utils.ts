export type Status = 'present' | 'late' | 'absent' | 'excused';

export const STATUS_LABEL: Record<Status, string> = {
  present: 'Keldi',
  late: 'Kechikdi',
  absent: 'Kelmadi',
  excused: 'Sababli',
};

export const STATUS_COLOR: Record<Status, string> = {
  present: 'bg-green-600 text-white border-green-500',
  late: 'bg-yellow-500 text-slate-900 border-yellow-400',
  absent: 'bg-red-600 text-white border-red-500',
  excused: 'bg-blue-600 text-white border-blue-500',
};

// Local date as YYYY-MM-DD (not UTC), so "today" matches the phone's calendar
export function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA');
}

export function nowTime(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60000);
  return d.toTimeString().slice(0, 8);
}

// ---------- CSV helpers ----------
export function toCsv(rows: (string | number)[][]): string {
  // BOM so Excel opens Uzbek letters correctly
  return (
    '\uFEFF' +
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
