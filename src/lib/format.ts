/** "PS" from "Priya Sharma". A single word gives its first two letters. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

export function isUnassigned(name: string): boolean {
  const clean = name.trim().toLowerCase();
  return clean === '' || clean === 'unassigned';
}

/** Parse a stored due date (yyyy-mm-dd) as a local calendar day, not as UTC. */
function parseDay(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export type DueState = 'none' | 'overdue' | 'today' | 'week' | 'later';

export interface DueInfo {
  state: DueState;
  /** Short human label: "Today", "Tomorrow", "Thu 8 Oct", "22 Oct". Empty when there is no date. */
  label: string;
  /** The most compact form, for a narrow column: "Today" or "8 Oct". */
  short: string;
}

/** Where a due date falls relative to today, with a short label for it. */
export function dueInfo(dueDate?: string | null): DueInfo {
  if (!dueDate) return { state: 'none', label: '', short: '' };
  const day = parseDay(dueDate);
  if (!day) return { state: 'none', label: '', short: '' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const date = day.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(day.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  });

  const short = day.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  if (days < 0) return { state: 'overdue', label: date, short };
  if (days === 0) return { state: 'today', label: 'Today', short: 'Today' };
  if (days === 1) return { state: 'week', label: 'Tomorrow', short };
  if (days <= 7) {
    return { state: 'week', label: `${day.toLocaleDateString(undefined, { weekday: 'short' })} ${date}`, short };
  }
  return { state: 'later', label: date, short };
}

/** A due date as words: "Due today", "Due Thu 8 Oct", or "Overdue since 3 Oct" for unfinished work. */
export function duePhrase(due: DueInfo, done: boolean): string {
  if (!due.label) return '';
  if (due.state === 'overdue' && !done) return `Overdue since ${due.label}`;
  const when = due.label === 'Today' || due.label === 'Tomorrow' ? due.label.toLowerCase() : due.label;
  return `Due ${when}`;
}

/** A full calendar date, e.g. "6 Oct 2026". */
export function longDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** A comment's time: the clock time today, the date and time on other days. */
export function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  if (sameDay) return time;
  const date = d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  });
  return `${date}, ${time}`;
}

/** "1 task", "3 tasks". */
export function count(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}
