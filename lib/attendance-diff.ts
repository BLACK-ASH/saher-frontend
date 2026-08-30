// Pure diff engine for session attendance (EVNT-06).
// Backend attendance mutations are BULK and MERGE-ONLY ($addToSet) — there is
// no replace/set endpoint. Given the session's CURRENT attendees and the NEW
// checkbox selection, returns what to POST (added) and what to DELETE
// (removed). Set semantics; stable ascending output for deterministic tests.
// No IO, no React — plain module for testability.
export function computeAttendanceDiff(
  existing: string[],
  selected: string[],
): { added: string[]; removed: string[] } {
  const existingSet = new Set(existing);
  const selectedSet = new Set(selected);
  const added = [...selectedSet]
    .filter((id) => !existingSet.has(id))
    .sort();
  const removed = [...existingSet]
    .filter((id) => !selectedSet.has(id))
    .sort();
  return { added, removed };
}