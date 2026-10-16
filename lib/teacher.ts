// Subject teachers: each teacher marks attendance only for his/her own subjects.
// `null` = no limit (the database has not been updated yet, old single-teacher setup).
export function mySubjects(row: any): string[] | null {
  const s = row?.subjects;
  return Array.isArray(s) ? (s as string[]) : null;
}

// Only the head teacher may manage students' passwords.
// Unknown (old database without the column) counts as head, so nothing breaks before the update.
export function isHead(row: any): boolean {
  return row?.is_head !== false;
}
