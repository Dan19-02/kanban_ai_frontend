import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'quietDanger' | 'danger' | 'destroy';
export type ButtonSize = 'sm' | 'md';

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xs font-medium whitespace-nowrap select-none transition-colors duration-150 disabled:opacity-50';

// Height and type size; the horizontal padding is added separately so a square
// (icon-only) button never carries two competing paddings.
// On touch screens every control shares one 44px height.
const heights: Record<ButtonSize, string> = {
  md: 'h-9 text-sm pointer-coarse:h-11',
  sm: 'h-8 text-[0.8125rem] pointer-coarse:h-11',
};
const paddings: Record<ButtonSize, string> = { md: 'px-3.5', sm: 'px-3' };
const squares: Record<ButtonSize, string> = { md: 'w-9 pointer-coarse:w-11', sm: 'w-8 pointer-coarse:w-11' };

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-on-ink hover:bg-ink/88 active:bg-ink/78',
  secondary: 'border border-edge bg-paper text-ink hover:bg-wash active:bg-wash-2',
  quiet: 'text-ink-2 hover:bg-wash hover:text-ink active:bg-wash-2',
  quietDanger: 'text-red hover:bg-red-wash',
  danger: 'border border-red/60 bg-paper text-red hover:bg-red-wash',
  destroy: 'bg-red text-on-red hover:bg-red/88 active:bg-red/78',
};

/** The button look as a class string, for links that should read as buttons. */
export function buttonClass(variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra = ''): string {
  return `${base} ${heights[size]} ${paddings[size]} ${variants[variant]} ${extra}`.trim();
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner in place of the icon and blocks further clicks. */
  loading?: boolean;
  icon?: React.ReactNode;
  /** Icon-only: as wide as it is tall. Give it an `aria-label`. */
  square?: boolean;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  square = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${base} ${heights[size]} ${square ? squares[size] : paddings[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

const iconTones = {
  /** A quiet control that darkens on hover. */
  plain: 'text-ink-2 hover:bg-wash hover:text-ink active:bg-wash-2',
  /** Fainter still, turning red on hover: for delete controls in a list. */
  remove: 'text-ink-3 hover:bg-red-wash hover:text-red',
  /** Boxed like a secondary button, to sit beside one. */
  boxed: 'border border-edge text-ink hover:bg-wash active:bg-wash-2',
};

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Read by screen readers and shown as the tooltip. */
  label: string;
  size?: ButtonSize;
  tone?: keyof typeof iconTones;
}

export function IconButton({
  label,
  size = 'md',
  tone = 'plain',
  className = '',
  children,
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center rounded-xs transition-colors duration-150 disabled:opacity-50 pointer-coarse:h-11 pointer-coarse:w-11 ${
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
      } ${iconTones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
