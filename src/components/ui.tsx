import React, { useEffect, useId, useRef, useState } from 'react';
import { CheckIcon, CloseIcon } from './icons';

/** Join class names, skipping falsy ones. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function initials(name: string): string {
  if (!name || name === 'Unassigned') return '?';
  return name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Buttons ────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-150 disabled:opacity-40';
const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/85 active:bg-ink/75',
  secondary: 'border border-line-strong bg-paper text-ink hover:bg-wash active:bg-wash-2',
  ghost: 'text-ink-2 hover:bg-wash hover:text-ink active:bg-wash-2',
  danger: 'text-danger hover:bg-danger-wash',
};
const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-[0.8125rem]',
  md: 'h-8 px-3 text-ui',
  lg: 'h-10 px-4 text-ui',
};

export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra?: string) {
  return cx(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], extra);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks clicks while true. */
  busy?: boolean;
}

export function Button({ variant = 'secondary', size = 'md', busy, disabled, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={buttonClass(variant, size, className)}
    >
      {busy && <Spinner />}
      {children}
    </button>
  );
}

/** A square button that holds one icon. Always needs a label for screen readers. */
export function IconButton({
  label, className, children, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cx(
        'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-wash hover:text-ink active:bg-wash-2 disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cx('inline-block h-3.5 w-3.5 rounded-full border-[1.5px] border-current border-r-transparent', className)}
      style={{ animation: 'spin-ring 700ms linear infinite' }}
    />
  );
}

/** Full-area loading state for a page or panel. */
export function PageLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-ink-3">
      <Spinner className="h-4 w-4" />
    </div>
  );
}

// ─── Form controls ──────────────────────────────────────────────────────────

export const inputClass =
  'w-full rounded-md border border-line-strong bg-paper px-3 text-ui text-ink outline-none transition-colors hover:border-ink-3 focus:border-ink disabled:bg-wash disabled:text-ink-3';

export function Field({
  label, hint, error, children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: (props: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => React.ReactNode;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error || hint;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ui font-medium text-ink">{label}</label>
      {children({ id, 'aria-describedby': note ? noteId : undefined, 'aria-invalid': error ? true : undefined })}
      {note && (
        <p id={noteId} className={cx('text-meta', error ? 'text-danger' : 'text-ink-2')}>{note}</p>
      )}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} {...rest} className={cx(inputClass, 'h-9', className)} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} {...rest} className={cx(inputClass, 'py-2.5 text-body leading-relaxed', className)} />;
  },
);

export function Select({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx(inputClass, 'h-8 w-auto cursor-pointer pr-8', className)}>
      {children}
    </select>
  );
}

/** A drawn checkbox: an ink square with a check. Round would read as a radio. */
export function Checkbox({
  checked, onChange, disabled, label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <span className="relative inline-flex h-[18px] w-[18px] shrink-0">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
        className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-[5px] border border-line-strong bg-paper transition-colors checked:border-ink checked:bg-ink hover:border-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
      />
      <CheckIcon className="pointer-events-none absolute inset-0 m-auto h-3.5 w-3.5 scale-50 text-paper opacity-0 transition duration-150 peer-checked:scale-100 peer-checked:opacity-100" strokeWidth={2} />
    </span>
  );
}

// ─── People ─────────────────────────────────────────────────────────────────

/** A person's initials. `mine` marks the signed-in person with the highlighter. */
export function Monogram({ name, mine, size = 'md' }: { name: string; mine?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'h-5 w-5 text-[0.5625rem]' : size === 'lg' ? 'h-8 w-8 text-meta' : 'h-6 w-6 text-[0.625rem]';
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-wide',
        dims,
        mine ? 'bg-mark text-on-mark' : 'bg-wash-2 text-ink-2',
      )}
    >
      {initials(name)}
    </span>
  );
}

// ─── Feedback ───────────────────────────────────────────────────────────────

export function Alert({
  tone = 'danger', children, onDismiss,
}: {
  tone?: 'danger' | 'warn' | 'neutral';
  children: React.ReactNode;
  onDismiss?: () => void;
}) {
  const style =
    tone === 'danger' ? 'bg-danger-wash text-danger' : tone === 'warn' ? 'bg-warn-wash text-warn' : 'bg-wash text-ink-2';
  return (
    <div role={tone === 'neutral' ? 'status' : 'alert'} className={cx('flex items-start gap-3 rounded-md px-3 py-2.5 text-ui', style)}>
      <div className="min-w-0 flex-1">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-mr-1 rounded p-0.5 opacity-70 hover:opacity-100">
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

/** What a list says when it has nothing in it: one line, and what to do next. */
export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
      <p className="text-body font-medium text-ink">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-sm text-ui text-ink-2">{children}</div>}
    </div>
  );
}

// ─── Segmented control and tabs ─────────────────────────────────────────────

export function Segmented<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md bg-wash p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'h-7 rounded-[5px] px-2.5 text-[0.8125rem] transition-colors',
            value === o.value ? 'bg-paper font-medium text-ink shadow-[0_0_0_1px_var(--line)]' : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Tabs<T extends string>({
  label, value, onChange, tabs,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  tabs: { value: T; label: string; count?: number; fresh?: boolean }[];
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-5 border-b border-line">
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cx(
              '-mb-px flex items-center gap-1.5 border-b-2 pb-2.5 pt-1 text-ui transition-colors',
              active ? 'border-ink font-medium text-ink' : 'border-transparent text-ink-2 hover:text-ink',
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cx('tnum rounded px-1 text-meta', t.fresh ? 'bg-mark font-medium text-on-mark' : 'text-ink-3')}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Floating layers ────────────────────────────────────────────────────────

/** A modal dialog. Closes on Escape and on a click outside. */
export function Dialog({
  title, onClose, children, footer, width = 'max-w-md',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the focus effect on every render.
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // A field marked autoFocus has already taken focus; otherwise hold it on the panel.
    if (!panel.current?.contains(document.activeElement)) panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('outline-none flex max-h-[92vh] w-full flex-col rounded-t-xl bg-paper shadow-pop sm:rounded-xl', width)}
      >
        <div className="flex items-center justify-between gap-4 px-5 pb-1 pt-4">
          <h2 id={titleId} className="text-title font-semibold tracking-[-0.01em] text-ink">{title}</h2>
          <IconButton label="Close" onClick={onClose} className="-mr-1.5"><CloseIcon /></IconButton>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/** A small menu that opens under its trigger. */
export function Menu({
  trigger, children, align = 'right', side = 'bottom',
}: {
  trigger: (props: { onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu' }) => React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  side?: 'bottom' | 'top';
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      {trigger({ onClick: () => setOpen((v) => !v), 'aria-expanded': open, 'aria-haspopup': 'menu' })}
      {open && (
        <div
          role="menu"
          className={cx(
            'absolute z-40 min-w-[11rem] rounded-lg bg-paper p-1 shadow-pop',
            align === 'right' ? 'right-0' : 'left-0',
            side === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1',
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({
  danger, className, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      {...rest}
      className={cx(
        'flex w-full items-center justify-between gap-6 rounded-md px-2.5 py-1.5 text-left text-ui transition-colors disabled:opacity-40',
        danger ? 'text-danger hover:bg-danger-wash' : 'text-ink hover:bg-wash',
        className,
      )}
    />
  );
}

// ─── Brand ──────────────────────────────────────────────────────────────────

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx('text-[0.9375rem] font-semibold tracking-[-0.01em] text-ink', className)}>
      Transcribe<span className="mark ml-px">Board</span>
    </span>
  );
}
