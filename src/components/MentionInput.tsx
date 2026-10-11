import React, { useId, useRef, useState } from 'react';
import { activeMentionQuery, applyMention } from '../lib/mentions';
import { MenuItem, Monogram, cx, inputClass } from './ui';

interface MentionInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  people: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/** A text input with @mention autocomplete drawn from `people`. */
export function MentionInput({
  value, onChange, onSubmit, people, placeholder, disabled, className,
}: MentionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const suggestions =
    query === null
      ? []
      : people
          .filter((p) => p.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 6);
  const open = suggestions.length > 0;

  const syncQuery = () => {
    const el = inputRef.current;
    if (!el) return;
    const q = activeMentionQuery(el.value, el.selectionStart ?? el.value.length);
    setQuery(q);
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
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => (i + 1) % suggestions.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); choose(suggestions[active]); return; }
      if (e.key === 'Escape') { e.preventDefault(); setQuery(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="People to mention"
          className="absolute bottom-full left-0 z-50 mb-1 w-56 max-w-full rounded-lg bg-paper p-1 shadow-pop"
        >
          {suggestions.map((name, i) => (
            <MenuItem
              key={name}
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              onMouseDown={(e) => { e.preventDefault(); choose(name); }}
              className={cx(i === active && 'bg-wash')}
            >
              <span className="flex min-w-0 items-center gap-2">
                <Monogram name={name} size="sm" />
                <span className="truncate">{name}</span>
              </span>
            </MenuItem>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); syncQuery(); }}
        onKeyDown={onKeyDown}
        onKeyUp={syncQuery}
        onClick={syncQuery}
        onBlur={() => setTimeout(() => setQuery(null), 100)}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder ?? 'Comment'}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        role="combobox"
        className={cx(inputClass, 'h-9', className)}
      />
    </div>
  );
}
