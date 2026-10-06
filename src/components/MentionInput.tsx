import React, { useRef, useState } from 'react';
import { activeMentionQuery, applyMention } from '../lib/mentions';
import { controlClass } from '../ui/Field';
import { Initials } from '../ui/bits';

interface MentionInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  people: string[];
  placeholder?: string;
  disabled?: boolean;
  /** Names the field for screen readers (there is no visible label beside a composer). */
  label: string;
}

/** A text input with @mention autocomplete drawn from `people`. */
export function MentionInput({ value, onChange, onSubmit, people, placeholder, disabled, label }: MentionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const suggestions =
    query === null ? [] : people.filter((p) => p.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  const open = suggestions.length > 0;

  const syncQuery = () => {
    const el = inputRef.current;
    if (!el) return;
    setQuery(activeMentionQuery(el.value, el.selectionStart ?? el.value.length));
    setActive(0);
  };

  const choose = (name: string) => {
    const el = inputRef.current;
    const caret = el?.selectionStart ?? value.length;
    const next = applyMention(value, caret, name);
    onChange(next.value);
    setQuery(null);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(next.caret, next.caret);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        choose(suggestions[active]);
        return;
      }
      if (e.key === 'Escape') {
        // Close the suggestions only; do not let Escape also close the dialog.
        e.preventDefault();
        e.stopPropagation();
        setQuery(null);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      {open && (
        <ul
          role="listbox"
          aria-label="People to mention"
          className="absolute bottom-full left-0 z-50 mb-1.5 w-60 max-w-full animate-rise overflow-hidden rounded-xs border border-rule-2 bg-paper py-1 shadow-overlay"
        >
          {suggestions.map((name, i) => (
            <li key={name} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(name);
                }}
                className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                  i === active ? 'bg-wash-2 text-ink' : 'text-ink hover:bg-wash'
                }`}
              >
                <Initials name={name} size="sm" />
                <span className="truncate">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        type="text"
        aria-label={label}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          syncQuery();
        }}
        onKeyDown={onKeyDown}
        onKeyUp={syncQuery}
        onClick={syncQuery}
        onBlur={() => setTimeout(() => setQuery(null), 100)}
        disabled={disabled}
        placeholder={placeholder}
        className={`${controlClass} h-9 pointer-coarse:h-11`}
      />
    </div>
  );
}
