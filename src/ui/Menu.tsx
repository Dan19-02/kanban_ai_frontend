import React, { useEffect, useRef, useState } from 'react';

interface TriggerProps {
  'aria-haspopup': 'menu';
  'aria-expanded': boolean;
  onClick: () => void;
}

interface MenuProps {
  /** Renders the control that opens the menu; spread the given props onto it. */
  button: (props: TriggerProps) => React.ReactNode;
  /** Menu contents. Call `close` after an item acts. */
  children: (close: () => void) => React.ReactNode;
  align?: 'left' | 'right';
  /** Tailwind width class for the panel. */
  width?: string;
  onOpenChange?: (open: boolean) => void;
}

/** A small dropdown: closes on Escape, on a click outside, or when an item calls `close`. */
export function Menu({ button, children, align = 'right', width = 'w-56', onOpenChange }: MenuProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const change = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) change(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      change(false);
      root.current?.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // `change` only wraps the setter and the latest callback, so `open` is the one trigger.
  }, [open]);

  return (
    <div ref={root} className="relative">
      {button({ 'aria-haspopup': 'menu', 'aria-expanded': open, onClick: () => change(!open) })}
      {open && (
        <div
          role="menu"
          className={`absolute top-full z-40 mt-1.5 max-w-[calc(100vw-1.5rem)] animate-rise rounded-xs border border-rule-2 bg-paper py-1 shadow-overlay ${width} ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {children(() => change(false))}
        </div>
      )}
    </div>
  );
}

export const menuItemClass =
  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition-colors duration-150 hover:bg-wash focus-visible:-outline-offset-2 disabled:opacity-50 disabled:hover:bg-transparent';
