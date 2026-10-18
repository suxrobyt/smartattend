// Subject teachers: each teacher marks attendance only for his/her own subjects.
// `null` = no limit: either the database has not been updated yet (old single-teacher setup)
// or the teacher is a curator (`all_subjects`) who marks every subject of the group.
export function mySubjects(row: any): string[] | null {
  if (row?.all_subjects === true) return null;
  const s = row?.subjects;
  return Array.isArray(s) ? (s as string[]) : null;
}

// Curator of a group: marks attendance for all subjects of the group.
export function isCurator(row: any): boolean {
  return row?.all_subjects === true;
}

// Only the head teacher may manage students' passwords (inside his/her own group).
// Unknown (old database without the column) counts as head, so nothing breaks before the update.
export function isHead(row: any): boolean {
  return row?.is_head !== false;
}
