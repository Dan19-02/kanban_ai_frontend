import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button, IconButton } from './Button';

// Page scroll is held while any dialog is open; dialogs can stack.
let openDialogs = 0;

interface DialogProps {
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** `sheet` is the same modal dialog, docked to the right edge at full height, for longer detail. */
  variant?: 'center' | 'sheet';
  wide?: boolean;
  /** When false there is no close button and Escape or a click outside do nothing. */
  dismissible?: boolean;
}

/**
 * A native modal dialog: the browser supplies the focus trap, the top layer and
 * Escape. Mount it to open it, unmount it to close it. Give a control
 * `data-autofocus` to receive focus first.
 */
export function Dialog({
  title,
  onClose,
  children,
  footer,
  variant = 'center',
  wide = false,
  dismissible = true,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressedOutside = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!el.open) el.showModal();
    el.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    if (openDialogs++ === 0) document.documentElement.style.overflow = 'hidden';
    return () => {
      if (--openDialogs === 0) document.documentElement.style.overflow = '';
      if (el.open) el.close();
    };
  }, []);

  const shape =
    variant === 'sheet'
      ? 'my-0 mr-0 ml-auto h-dvh max-h-dvh w-[min(100vw,30rem)] max-w-none border-l border-rule-2 open:animate-slide'
      : `m-auto max-h-[calc(100dvh-2rem)] max-w-none rounded-xs border border-rule-2 open:animate-rise ${
          wide ? 'w-[min(100vw-2rem,34rem)]' : 'w-[min(100vw-2rem,27rem)]'
        }`;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      // Close on a click that both starts and ends on the backdrop, so dragging
      // a text selection out of the dialog never closes it.
      onMouseDown={(e) => {
        pressedOutside.current = e.target === ref.current;
      }}
      onClick={(e) => {
        if (dismissible && pressedOutside.current && e.target === ref.current) onClose();
      }}
      className={`bg-paper p-0 text-ink shadow-overlay ${shape}`}
    >
      <div className={`flex flex-col ${variant === 'sheet' ? 'h-full' : 'max-h-[calc(100dvh-2rem)]'}`}>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-rule px-5 py-3">
          <h2 id={titleId} className="min-w-0 py-1.5 font-serif text-[1.0625rem] leading-snug font-semibold">
            {title}
          </h2>
          {dismissible && (
            <IconButton label="Close" onClick={onClose} className="-mr-2">
              <X className="h-4 w-4" />
            </IconButton>
          )}
        </header>
        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-rule px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}

interface ConfirmDialogProps {
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  /** Destructive confirmations get the red button and start with focus on Cancel. */
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button onClick={onCancel} disabled={busy} data-autofocus={destructive ? '' : undefined}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'destroy' : 'primary'}
            loading={busy}
            onClick={onConfirm}
            data-autofocus={destructive ? undefined : ''}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-ink-2">{children}</div>
    </Dialog>
  );
}
