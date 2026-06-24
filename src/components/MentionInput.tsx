import React, { useRef, useState } from 'react';
import { activeMentionQuery, applyMention } from '../lib/mentions';

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
    <div className="relative flex-1 min-w-0">
      {open && (
        <div className="absolute bottom-full mb-1 left-0 w-56 max-w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
          {suggestions.map((name, i) => (
            <button
              key={name}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); choose(name); }}
              className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                i === active
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[9px] font-bold shrink-0">
                {name.substring(0, 2).toUpperCase()}
              </span>
              <span className="truncate">{name}</span>
            </button>
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
        className={className}
      />
    </div>
  );
}
