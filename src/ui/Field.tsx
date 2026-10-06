import React, { useId } from 'react';

/** The ink and focus behaviour every text control shares, with no size or border colour. */
export const controlBase =
  'rounded-xs border bg-paper text-ink placeholder:text-ink-3 transition-colors duration-150 focus:border-ink focus:ring-1 focus:ring-ink focus:outline-none disabled:cursor-not-allowed disabled:bg-wash disabled:text-ink-3';

/** A standard control: a ruled box that darkens to ink on focus. Add a height. */
// 16px text on touch screens stops iOS zooming the page when a field takes focus.
export const controlClass = `${controlBase} block w-full border-edge px-3 text-sm hover:border-ink-3 disabled:hover:border-edge pointer-coarse:text-base`;

type ControlSize = 'sm' | 'md';

// On touch screens every control shares one 44px height.
const heights: Record<ControlSize, string> = { md: 'h-9 pointer-coarse:h-11', sm: 'h-8 pointer-coarse:h-11' };

interface FieldProps {
  label: string;
  hint?: React.ReactNode;
  optional?: boolean;
  /** Receives the id that ties the label to the control. */
  children: (id: string) => React.ReactNode;
}

export function Field({ label, hint, optional, children }: FieldProps) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.8125rem] font-medium text-ink">
        {label}
        {optional && <span className="font-normal text-ink-3"> (optional)</span>}
      </label>
      {children(id)}
      {hint && <p className="mt-1.5 text-xs text-ink-3">{hint}</p>}
    </div>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  controlSize?: ControlSize;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className = '', controlSize = 'md', ...props },
  ref,
) {
  return <input ref={ref} className={`${controlClass} ${heights[controlSize]} ${className}`} {...props} />;
});

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ className = '', ...props }, ref) {
    return <textarea ref={ref} className={`${controlClass} py-2 leading-relaxed ${className}`} {...props} />;
  },
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  controlSize?: ControlSize;
}

export function Select({ className = '', controlSize = 'md', children, ...props }: SelectProps) {
  return (
    <select className={`${controlClass} ${heights[controlSize]} pr-8 ${className}`} {...props}>
      {children}
    </select>
  );
}
