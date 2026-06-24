import React from 'react';

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Render text with @mentions of known people highlighted. Longest names are
 * matched first so "@John Doe" wins over "@John".
 */
export function renderMentions(text: string, people: string[] = []): React.ReactNode {
  const names = people.filter(Boolean);
  if (names.length === 0) return text;
  const pattern = names
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|');
  const re = new RegExp(`@(${pattern})`, 'g');

  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      <span
        key={key++}
        className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded px-1"
      >
        @{m[1]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/**
 * The active @mention query at the caret (the partial word after a leading "@"),
 * or null if the caret isn't in a mention. Returns "" right after typing "@".
 */
export function activeMentionQuery(value: string, caret: number): string | null {
  const upto = value.slice(0, caret);
  const m = /(?:^|\s)@([\w'.-]*)$/.exec(upto);
  return m ? m[1] : null;
}

/**
 * Replace the active @query at the caret with "@Name ". Returns the new value
 * and the caret position to place after it.
 */
export function applyMention(
  value: string,
  caret: number,
  name: string,
): { value: string; caret: number } {
  const query = activeMentionQuery(value, caret) ?? '';
  const atIndex = caret - query.length - 1; // position of the "@"
  const next = `${value.slice(0, atIndex)}@${name} ${value.slice(caret)}`;
  return { value: next, caret: atIndex + name.length + 2 };
}
