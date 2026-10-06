import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Info, Loader2 } from 'lucide-react';
import { initials, isUnassigned } from '../lib/format';
import { COLOR_NAMES, PROJECT_COLORS, projectColor } from '../lib/projectColors';
import type { ProjectColor } from '../types';

/** The mark: a ruled page with its red margin. */
export function Mark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`shrink-0 ${className}`} fill="none" aria-hidden="true">
      <rect x="2.75" y="1.75" width="14.5" height="16.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.25 2v16" stroke="var(--red)" strokeWidth="1.5" />
      <path d="M9.75 7h5M9.75 10.25h5M9.75 13.5h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Brand() {
  return (
    <span className="inline-flex items-center gap-2">
      <Mark />
      <span className="font-serif text-[1.0625rem] font-semibold tracking-[-0.01em]">TranscribeBoard</span>
    </span>
  );
}

/** A person as their initials in a ruled box. Unassigned is an empty dashed box. */
export function Initials({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const none = isUnassigned(name);
  return (
    <span
      title={none ? 'Unassigned' : name}
      className={`inline-flex shrink-0 items-center justify-center rounded-[2px] border px-[3px] leading-none font-semibold tabular-nums ${
        size === 'sm' ? 'h-[1.125rem] min-w-[1.125rem] text-[0.625rem]' : 'h-6 min-w-6 text-[0.6875rem]'
      } ${none ? 'border-dashed border-edge text-ink-3' : 'border-rule-2 text-ink-2'}`}
    >
      {none ? <span className="sr-only">Unassigned</span> : <span aria-hidden>{initials(name)}</span>}
    </span>
  );
}

const PRIORITY_LEVEL: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

/** Priority as three rising bars: more ink means more urgent. */
export function PriorityMark({ priority }: { priority?: string }) {
  // An unexpected label from the analysis still reads as a priority, at full strength.
  const level = priority ? (PRIORITY_LEVEL[priority] ?? 3) : 0;
  const label = priority ? `${priority} priority` : 'No priority';
  return (
    <svg viewBox="0 0 14 12" className="h-3 w-3.5 shrink-0" role="img" aria-label={label}>
      <title>{label}</title>
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={i * 5}
          y={8 - i * 4}
          width="3.5"
          height={4 + i * 4}
          rx="0.5"
          fill={i < level ? 'currentColor' : 'var(--rule-2)'}
        />
      ))}
    </svg>
  );
}

interface NoticeProps {
  tone?: 'error' | 'info' | 'success';
  children: React.ReactNode;
  className?: string;
}

/** An inline message. Errors are announced; the rest are polite status. */
export function Notice({ tone = 'error', children, className = '' }: NoticeProps) {
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? Check : Info;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-xs border px-3 py-2.5 text-sm leading-relaxed ${
        tone === 'error' ? 'border-red/40 bg-red-wash' : 'border-rule-2 bg-wash'
      } ${className}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone === 'error' ? 'text-red' : 'text-ink-2'}`} aria-hidden />
      <div className="min-w-0 flex-1 text-ink">{children}</div>
    </div>
  );
}

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}

export function Checkbox({ checked, onChange, disabled = false, label }: CheckboxProps) {
  return (
    <label
      // The pseudo-element widens the hit area to 40px without moving the box.
      className={`group relative inline-flex h-5 w-5 shrink-0 items-center justify-center after:absolute after:-inset-2.5 ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      }`}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-edge bg-paper text-on-ink transition-colors duration-150 group-hover:border-ink peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink peer-disabled:group-hover:border-edge"
      >
        <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 6.2l2.4 2.4 4.6-5" className={checked ? 'opacity-100' : 'opacity-0'} />
        </svg>
      </span>
    </label>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}

/** A row of mutually exclusive choices; the current one is filled with ink. */
export function Segmented<T extends string>({ label, value, onChange, options }: SegmentedProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex shrink-0 divide-x divide-edge overflow-hidden rounded-xs border border-edge">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className="h-8 px-3 text-[0.8125rem] font-medium text-ink-2 transition-colors duration-150 hover:bg-wash focus-visible:-outline-offset-2 aria-pressed:bg-ink aria-pressed:text-on-ink pointer-coarse:h-11"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

interface TabsProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  tabs: { value: T; label: React.ReactNode }[];
  className?: string;
}

export function Tabs<T extends string>({ label, value, onChange, tabs, className = '' }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={`flex gap-6 border-b border-rule ${className}`}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className="-mb-px border-b-2 border-transparent pt-1 pb-2.5 text-sm font-medium text-ink-3 transition-colors duration-150 hover:text-ink aria-selected:border-ink aria-selected:text-ink"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** A project's colour as the spine of its volume. */
export function Spine({ color, className = 'h-4 w-2.5' }: { color: ProjectColor; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-[1px] ${className}`}
      style={{ background: projectColor(color) }}
    />
  );
}

export function ColorPicker({ value, onChange }: { value: ProjectColor; onChange: (color: ProjectColor) => void }) {
  return (
    <div role="radiogroup" aria-label="Colour" className="flex flex-wrap gap-1.5">
      {PROJECT_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={COLOR_NAMES[c]}
          title={COLOR_NAMES[c]}
          onClick={() => onChange(c)}
          className="flex h-8 w-8 items-center justify-center rounded-xs border border-transparent transition-colors duration-150 hover:border-rule-2 aria-checked:border-ink"
        >
          <span className="h-5 w-5 rounded-[2px]" style={{ background: projectColor(c) }} />
        </button>
      ))}
    </div>
  );
}

/** True once `active` has stayed on for `ms`. Used to explain a slow first load. */
export function useSlow(active: boolean, ms = 3500): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), ms);
    return () => clearTimeout(t);
  }, [active, ms]);
  return slow;
}

export const WAKING_COPY = 'Waking the server. The first load can take up to a minute.';

export function FullScreenLoader() {
  const slow = useSlow(true);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-paper px-6 text-center" role="status">
      <Loader2 className="h-5 w-5 animate-spin text-ink-3" aria-hidden />
      <span className="sr-only">Loading</span>
      <p className={`max-w-xs text-sm text-ink-2 transition-opacity duration-300 ${slow ? 'opacity-100' : 'opacity-0'}`}>
        {slow ? WAKING_COPY : ''}
      </p>
    </div>
  );
}

interface PageHeadProps {
  title: React.ReactNode;
  lead?: React.ReactNode;
  actions?: React.ReactNode;
}

/** A page's title block, closed by the double rule. */
export function PageHead({ title, lead, actions }: PageHeadProps) {
  return (
    <div className="double-rule pb-4">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          <h1 className="font-serif text-[1.75rem] leading-tight font-semibold tracking-[-0.01em] md:text-[2rem]">
            {title}
          </h1>
          {lead && <div className="mt-2 text-sm text-ink-2">{lead}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

interface EmptyPageProps {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/** An empty state set on a blank ruled page. Text and buttons sit on its 2rem lines. */
export function EmptyPage({ title, children, actions }: EmptyPageProps) {
  return (
    <div className="ledger-blank rounded-xs border border-rule">
      <div className="py-8 pr-6 pl-[3.75rem] sm:pl-[4.25rem]">
        <h2 className="font-serif text-xl leading-8 font-semibold">{title}</h2>
        <p className="max-w-md text-sm leading-8 text-ink-2">{children}</p>
        {actions && <div className="mt-8 flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
